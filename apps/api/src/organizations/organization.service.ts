import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import type {
  CreateOrganizationDto,
  QueryOrganizationsDto,
  UpdateOrganizationDto,
} from "./dto/organization.dto";
import type { OrganizationDelegate, OrganizationWithCounts } from "./types/organization.types";

// Local extended type until prisma generate is re-run after v1.0.2 migration
type ExtendedPrismaClient = PrismaClient & { organization: OrganizationDelegate };

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): ExtendedPrismaClient {
    return this.prisma as unknown as ExtendedPrismaClient;
  }

  async findAll(query: QueryOrganizationsDto) {
    const { q, type, status, isDemo, limit = 20, page = 1 } = query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (isDemo !== undefined) where.isDemo = isDemo === "true";

    const [items, total] = await Promise.all([
      this.db.organization.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { ministries: true, departments: true, users: true } } },
      }),
      this.db.organization.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<OrganizationWithCounts> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const org = await this.db.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { ministries: true, departments: true, users: true } },
        ministries: { select: { id: true, name: true, code: true, isActive: true }, take: 10 },
      },
    });
    if (!org) throw new NotFoundException(`Organization ${id} not found`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return org;
  }

  async create(dto: CreateOrganizationDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return this.db.organization.create({ data: dto as any });
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return this.db.organization.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.db.organization.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }

  async getDashboard(id: string) {
    await this.findOne(id);
    const [userCount, deptCount, ministryCount, meetingCount, docCount, workflowCount] =
      await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        this.prisma.user.count({ where: { organizationId: id } as any }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        this.prisma.department.count({ where: { organizationId: id } as any }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        this.prisma.ministry.count({ where: { organizationId: id } as any }),
        this.prisma.meeting.count(),
        this.prisma.document.count(),
        this.prisma.workflowInstance.count(),
      ]);
    return { userCount, deptCount, ministryCount, meetingCount, docCount, workflowCount };
  }
}
