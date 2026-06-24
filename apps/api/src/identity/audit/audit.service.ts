import { Injectable, Logger } from "@nestjs/common";
import type { AuditAction } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface AuditLogInput {
  userId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write an immutable audit log entry.
   * Fires asynchronously and never throws — audit failures must not block requests.
   */
  log(input: AuditLogInput): void {
    this.writeLog(input).catch((err: unknown) => {
      this.logger.error(`Audit log write failed for action ${input.action}:`, err);
    });
  }

  /** Await the write (used in tests to ensure log is persisted before assertions). */
  async logAndWait(input: AuditLogInput): Promise<void> {
    await this.writeLog(input);
  }

  private async writeLog(input: AuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: (input.metadata ?? {}) as object,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  /**
   * Query audit logs with filters and pagination.
   * Only ADMIN:VIEW_AUDIT_LOGS_* routes call this — authorization enforced upstream.
   */
  async findMany(params: {
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
    ministryId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: unknown[]; meta: { total: number; page: number; limit: number } }> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.userId) where["userId"] = params.userId;
    if (params.action) where["action"] = params.action;
    if (params.entityType) where["entityType"] = params.entityType;
    if (params.entityId) where["entityId"] = params.entityId;

    if (params.startDate || params.endDate) {
      where["createdAt"] = {
        ...(params.startDate ? { gte: params.startDate } : {}),
        ...(params.endDate ? { lte: params.endDate } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              matriculeNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }
}
