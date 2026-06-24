import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { PermissionsService } from "../permissions/permissions.service";
import type { AuthenticatedUser } from "../../common/types/auth.types";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { UpdateUserStatusDto } from "./dto/update-user-status.dto";

const BCRYPT_ROUNDS = 12;

/** Safe user projection — never includes passwordHash, mfaSecret. */
const SAFE_USER_SELECT = {
  id: true,
  matriculeNumber: true,
  email: true,
  firstName: true,
  lastName: true,
  displayName: true,
  avatarUrl: true,
  userType: true,
  role: true,
  status: true,
  preferredLanguage: true,
  mfaEnabled: true,
  ministryId: true,
  departmentId: true,
  divisionId: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly permissionsService: PermissionsService,
  ) {}

  // ---------------------------------------------------------------------------
  // GET PROFILE (for /auth/me)
  // ---------------------------------------------------------------------------

  async getProfile(userId: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT,
    });

    if (!user) throw new NotFoundException({ error: "USER_NOT_FOUND", message: "User not found" });

    const permissions = await this.permissionsService.resolvePermissionsForUser(userId);
    return { ...user, permissions };
  }

  // ---------------------------------------------------------------------------
  // LIST USERS (scoped)
  // ---------------------------------------------------------------------------

  async findMany(
    requestingUser: AuthenticatedUser,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      role?: string;
      ministryId?: string;
      search?: string;
    },
  ): Promise<{ data: unknown[]; meta: { total: number; page: number; limit: number } }> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    // Build scope-based where clause
    const where: Record<string, unknown> = {};

    // GOVERNMENT_ADMIN and above can filter by any ministryId
    // Lower roles are restricted to their own ministry
    if (requestingUser.roleWeight < 90 && requestingUser.ministryId) {
      where["ministryId"] = requestingUser.ministryId;
    } else if (params.ministryId) {
      where["ministryId"] = params.ministryId;
    }

    if (params.status) where["status"] = params.status;
    if (params.role) where["role"] = params.role;

    if (params.search) {
      where["OR"] = [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { matriculeNumber: { contains: params.search } },
        { displayName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: SAFE_USER_SELECT,
        skip,
        take: limit,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, meta: { total, page, limit } };
  }

  // ---------------------------------------------------------------------------
  // FIND BY ID
  // ---------------------------------------------------------------------------

  async findById(id: string, requestingUser: AuthenticatedUser): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...SAFE_USER_SELECT, ministryId: true },
    });

    if (!user) throw new NotFoundException({ error: "USER_NOT_FOUND", message: "User not found" });

    // Scope check: non-GOV_ADMIN can only view users in their own ministry
    if (
      requestingUser.roleWeight < 90 &&
      requestingUser.ministryId &&
      user.ministryId !== requestingUser.ministryId
    ) {
      throw new NotFoundException({ error: "USER_NOT_FOUND", message: "User not found" });
    }

    return user;
  }

  // ---------------------------------------------------------------------------
  // CREATE USER (admin-only)
  // ---------------------------------------------------------------------------

  async create(
    dto: CreateUserDto,
    createdBy: AuthenticatedUser,
    ipAddress: string,
  ): Promise<{ id: string; status: string; temporaryPassword: string }> {
    // Check email uniqueness
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existingEmail) {
      throw new ConflictException({ error: "EMAIL_TAKEN", message: "Email address is already registered" });
    }

    // Check matricule uniqueness if provided
    if (dto.matriculeNumber) {
      const existingMatricule = await this.prisma.user.findUnique({
        where: { matriculeNumber: dto.matriculeNumber },
      });
      if (existingMatricule) {
        throw new ConflictException({ error: "MATRICULE_TAKEN", message: "Matricule number is already registered" });
      }
    }

    // Generate a temporary password if not provided
    const temporaryPassword = dto.initialPassword ?? this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    const displayName = `${dto.firstName} ${dto.lastName}`;

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        displayName,
        email: dto.email.toLowerCase(),
        matriculeNumber: dto.matriculeNumber ?? null,
        passwordHash,
        userType: dto.userType ?? "GOVERNMENT_EMPLOYEE",
        role: "EMPLOYEE",
        status: "PENDING",
        preferredLanguage: dto.preferredLanguage ?? "fr",
        ministryId: dto.ministryId ?? null,
        departmentId: dto.departmentId ?? null,
        divisionId: dto.divisionId ?? null,
      },
      select: { id: true, status: true },
    });

    await this.auditService.log({
      userId: createdBy.id,
      action: "USER_CREATED",
      entityType: "USER",
      entityId: user.id,
      metadata: {
        createdBy: createdBy.id,
        userType: dto.userType ?? "GOVERNMENT_EMPLOYEE",
        ministryId: dto.ministryId,
      },
      ipAddress,
    });

    return {
      id: user.id,
      status: user.status,
      temporaryPassword, // shown ONCE — caller must transmit securely
    };
  }

  // ---------------------------------------------------------------------------
  // UPDATE STATUS
  // ---------------------------------------------------------------------------

  async updateStatus(
    targetUserId: string,
    dto: UpdateUserStatusDto,
    updatedBy: AuthenticatedUser,
    ipAddress: string,
  ): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, status: true, ministryId: true },
    });

    if (!user) throw new NotFoundException({ error: "USER_NOT_FOUND", message: "User not found" });

    // Scope check
    if (updatedBy.roleWeight < 90 && updatedBy.ministryId && user.ministryId !== updatedBy.ministryId) {
      throw new NotFoundException({ error: "USER_NOT_FOUND", message: "User not found" });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        status: dto.status,
        ...(dto.status === "ACTIVE" ? { lockedUntil: null, failedLoginCount: 0 } : {}),
      },
      select: SAFE_USER_SELECT,
    });

    // Invalidate sessions if suspending or deactivating
    if (dto.status === "SUSPENDED" || dto.status === "DEACTIVATED") {
      await this.prisma.userSession.updateMany({
        where: { userId: targetUserId, isActive: true },
        data: { isActive: false, revokedAt: new Date() },
      });
      this.permissionsService.invalidateCache(targetUserId);
    }

    const action =
      dto.status === "SUSPENDED" ? "USER_SUSPENDED" as const :
      dto.status === "DEACTIVATED" ? "USER_DEACTIVATED" as const :
      "USER_REACTIVATED" as const;

    await this.auditService.log({
      userId: updatedBy.id,
      action,
      entityType: "USER",
      entityId: targetUserId,
      metadata: { status: dto.status, reason: dto.reason },
      ipAddress,
    });

    return updatedUser;
  }

  // ---------------------------------------------------------------------------
  // UNLOCK ACCOUNT
  // ---------------------------------------------------------------------------

  async unlockAccount(
    targetUserId: string,
    unlockedBy: AuthenticatedUser,
    ipAddress: string,
  ): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, status: true },
    });

    if (!user) throw new NotFoundException({ error: "USER_NOT_FOUND", message: "User not found" });

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: "ACTIVE", lockedUntil: null, failedLoginCount: 0 },
      select: SAFE_USER_SELECT,
    });

    await this.auditService.log({
      userId: unlockedBy.id,
      action: "USER_UNLOCKED",
      entityType: "USER",
      entityId: targetUserId,
      metadata: { unlockedBy: unlockedBy.id },
      ipAddress,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private generateTemporaryPassword(): string {
    // Generates a 16-char password meeting all policy requirements
    const chars = "abcdefghijkmnopqrstuvwxyz";
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "23456789";
    const special = "!@#$%&*";

    const pick = (set: string) => set[crypto.randomInt(set.length)] ?? set[0];

    const required = [pick(chars), pick(upper), pick(digits), pick(special)];
    const all = chars + upper + digits + special;
    const rest = Array.from({ length: 12 }, () => pick(all));

    return [...required, ...rest]
      .sort(() => crypto.randomInt(3) - 1)
      .join("");
  }
}
