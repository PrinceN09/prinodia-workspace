import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { PermissionsService } from "../permissions/permissions.service";
import type { AuthenticatedUser } from "../../common/types/auth.types";

/** Role weight map — higher weight cannot be assigned by lower weight admin. */
const ROLE_WEIGHTS: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  GOVERNMENT_ADMIN: 90,
  MINISTRY_ADMIN: 70,
  DEPARTMENT_ADMIN: 50,
  DIVISION_ADMIN: 40,
  TEAM_MANAGER: 30,
  EMPLOYEE: 10,
  GUEST: 0,
};

export interface AssignRoleDto {
  roleId: string;
  ministryId?: string;
  departmentId?: string;
  divisionId?: string;
  expiresAt?: string;
}

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async findAll(): Promise<unknown[]> {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: { weight: "desc" },
    });
  }

  async findById(id: string): Promise<unknown> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });

    if (!role) throw new NotFoundException({ error: "ROLE_NOT_FOUND", message: "Role not found" });
    return role;
  }

  /**
   * Assign a role to a user with optional organizational scope.
   * Only admins with a higher role weight than the target role may assign it.
   */
  async assignRoleToUser(
    targetUserId: string,
    dto: AssignRoleDto,
    assignedBy: AuthenticatedUser,
    ipAddress: string,
  ): Promise<unknown> {
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException({ error: "ROLE_NOT_FOUND", message: "Role not found" });

    // Ensure assigner has higher weight than the role being assigned
    if (assignedBy.roleWeight <= role.weight) {
      throw new ForbiddenException({
        error: "INSUFFICIENT_WEIGHT",
        message: "You cannot assign a role equal to or higher than your own",
      });
    }

    // Ministry-scoped admins can only assign within their ministry
    if (assignedBy.ministryId && dto.ministryId && dto.ministryId !== assignedBy.ministryId) {
      throw new ForbiddenException({
        error: "SCOPE_VIOLATION",
        message: "You can only assign roles within your own ministry",
      });
    }

    const existing = await this.prisma.userRoleAssignment.findFirst({
      where: {
        userId: targetUserId,
        roleId: dto.roleId,
        ministryId: dto.ministryId ?? null,
        departmentId: dto.departmentId ?? null,
        divisionId: dto.divisionId ?? null,
        isActive: true,
      },
    });

    if (existing) {
      throw new BadRequestException({
        error: "ROLE_ALREADY_ASSIGNED",
        message: "User already has this role in this scope",
      });
    }

    const assignment = await this.prisma.userRoleAssignment.create({
      data: {
        userId: targetUserId,
        roleId: dto.roleId,
        ministryId: dto.ministryId ?? null,
        departmentId: dto.departmentId ?? null,
        divisionId: dto.divisionId ?? null,
        grantedById: assignedBy.id,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    // Also update User.role if this role has higher weight than their current one
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    });
    if (user && role.weight > ROLE_WEIGHTS[user.role]) {
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: { role: role.name as UserRole },
      });
    }

    this.permissionsService.invalidateCache(targetUserId);

    await this.auditService.log({
      userId: assignedBy.id,
      action: "ROLE_ASSIGNED",
      entityType: "USER",
      entityId: targetUserId,
      metadata: {
        roleId: dto.roleId,
        roleName: role.name,
        scope: { ministryId: dto.ministryId, departmentId: dto.departmentId, divisionId: dto.divisionId },
      },
      ipAddress,
    });

    return assignment;
  }

  async revokeRoleFromUser(
    targetUserId: string,
    assignmentId: string,
    revokedBy: AuthenticatedUser,
    ipAddress: string,
  ): Promise<void> {
    const assignment = await this.prisma.userRoleAssignment.findFirst({
      where: { id: assignmentId, userId: targetUserId },
      include: { role: true },
    });

    if (!assignment) {
      throw new NotFoundException({ error: "ASSIGNMENT_NOT_FOUND", message: "Role assignment not found" });
    }

    if (revokedBy.roleWeight <= assignment.role.weight) {
      throw new ForbiddenException({
        error: "INSUFFICIENT_WEIGHT",
        message: "You cannot revoke a role equal to or higher than your own",
      });
    }

    await this.prisma.userRoleAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false },
    });

    this.permissionsService.invalidateCache(targetUserId);

    await this.auditService.log({
      userId: revokedBy.id,
      action: "ROLE_REMOVED",
      entityType: "USER",
      entityId: targetUserId,
      metadata: { assignmentId, roleName: assignment.role.name },
      ipAddress,
    });
  }
}
