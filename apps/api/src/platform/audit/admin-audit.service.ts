import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

export interface LogAuditEventParams {
  actorId?: string;
  actorEmail?: string;
  organizationId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    return this.prisma as unknown as AnyPrisma;
  }

  log(params: LogAuditEventParams) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.adminAuditLog.create({ data: params as AnyPrisma });
  }

  async listLogs(query: {
    organizationId?: string | undefined;
    actorId?: string | undefined;
    action?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  }) {
    const { organizationId, actorId, action, from, to, page = 1, limit = 50 } = query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (actorId) where.actorId = actorId;
    if (action) where.action = { contains: action, mode: "insensitive" };
    const createdAt: Record<string, Date> = {};
    if (from) createdAt["gte"] = new Date(from);
    if (to) createdAt["lte"] = new Date(to);
    if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [items, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.adminAuditLog.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
