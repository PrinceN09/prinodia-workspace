/**
 * Prinodia Workspace — OrganizationService (v1.0.2)
 *
 * Neutral top-level organization management.
 * Supports governments, enterprises, schools, hospitals, NGOs, churches, and more.
 *
 * NOTE: Uses a local type-wrapper around PrismaService until `prisma generate` is
 * run in the target environment to add Organization to the generated client.
 */

import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import type {
  CreateOrganizationDto,
  QueryOrganizationsDto,
  UpdateOrganizationDto,
} from "./dto/organization.dto";
import type {
  Organization,
  OrganizationDelegate,
  OrganizationWithCounts,
} from "./types/organization.types";
import type { PrismaClient } from "@prisma/client";

// ─── Extended Prisma type ─────────────────────────────────────────────────────
// The Organization model was added in v1.0.2. Until `prisma generate` regenerates
// the client, we extend PrismaClient locally to keep TypeScript happy.

type ExtendedPrismaClient = PrismaClient & {
  organization: OrganizationDelegate;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOrgWhere(query: QueryOrganizationsDto) {
  return {
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" as const } },
            { code: { contains: query.search, mode: "insensitive" as const } },
            { description: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface OrganizationsPage {
  data: OrganizationWithCounts[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Access the extended Prisma client with Organization model. */
  private get db(): ExtendedPrismaClient {
    return this.prisma as unknown as ExtendedPrismaClient;
  }

  // ─── List ────────────────────────────────────────────────────────────────

  async findAll(query: QueryOrganizationsDto): Promise<OrganizationsPage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = buildOrgWhere(query);

    const [data, total] = await Promise.all([
      this.db.organization.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: {
          _count: { select: { ministries: true, departments: true, users: true } },
        },
      }),
      this.db.organization.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Get one ─────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<OrganizationWithCounts> {
    const org = await this.db.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { ministries: true, departments: true, users: true } },
        ministries: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          select: { id: true, name: true, code: true, isActive: true } as unknown as boolean,
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization '${id}' not found.`);
    }

    return org;
  }

  // ─── Dashboard stats ──────────────────────────────────────────────────────

  async getDashboard(id: string) {
    const org = await this.findOne(id);

    // Counts from related entities linked via ministryId (govt) or organizationId (non-govt)
    const ministryIds: string[] = org.ministries?.map((m: { id: string }) => m.id) ?? [];

    // NOTE: organizationId was added in v1.0.2. Cast to `any` until `prisma generate`
    //       regenerates the Prisma client with the new column.
    const deptWhere = {
      OR: [
        ...(ministryIds.length > 0 ? [{ ministryId: { in: ministryIds } }] : []),
        { organizationId: id },
      ],
    };
    const userWhere = {
      OR: [
        ...(ministryIds.length > 0 ? [{ ministryId: { in: ministryIds } }] : []),
        { organizationId: id },
      ],
    };

    const [users, departments] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      this.prisma.user.count({ where: userWhere as any }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      this.prisma.department.count({ where: deptWhere as any }),
    ]);

    return {
      organization: org,
      stats: {
        ministries: org._count?.ministries ?? 0,
        departments,
        users,
      },
    };
  }

  // ─── Structure ────────────────────────────────────────────────────────────

  async getStructure(id: string) {
    const org = await this.findOne(id);
    const ministryIds: string[] = org.ministries?.map((m: { id: string }) => m.id) ?? [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const structureWhere: any = {
      OR: [
        ...(ministryIds.length > 0 ? [{ ministryId: { in: ministryIds } }] : []),
        { organizationId: id },
      ],
      isActive: true,
    };
    const departments = await this.prisma.department.findMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: structureWhere,
      include: {
        _count: { select: { divisions: true, users: true } },
      },
      orderBy: { name: "asc" },
    });

    return { organization: org, departments };
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  async getUsers(id: string, page = 1, limit = 20) {
    const org = await this.findOne(id);
    const ministryIds: string[] = org.ministries?.map((m: { id: string }) => m.id) ?? [];
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      OR: [
        ...(ministryIds.length > 0 ? [{ ministryId: { in: ministryIds } }] : []),
        { organizationId: id },
      ],
    };

    const [users, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.prisma.user.findMany({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          email: true,
          role: true,
          userType: true,
          status: true,
        },
        orderBy: { lastName: "asc" },
        skip,
        take: limit,
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const existing = await this.db.organization.findFirst({
      where: { code: dto.code } as Partial<Record<keyof Organization, unknown>>,
    });

    if (existing) {
      throw new ConflictException(`Organization with code '${dto.code}' already exists.`);
    }

    return this.db.organization.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase(),
        type: dto.type,
        status: "ACTIVE",
        description: dto.description ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        website: dto.website ?? null,
        address: dto.address ?? null,
        city: dto.city ?? null,
        country: dto.country ?? null,
        logoUrl: dto.logoUrl ?? null,
      },
    });
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    await this.findOne(id); // 404 guard

    return this.db.organization.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      },
    });
  }

  // ─── Delete (soft: set ARCHIVED) ─────────────────────────────────────────

  async remove(id: string): Promise<Organization> {
    await this.findOne(id); // 404 guard

    return this.db.organization.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }
}
