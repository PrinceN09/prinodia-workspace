import { Controller, Get, Header, Query, Res, UseGuards } from "@nestjs/common";

import { AuditService } from "./audit.service";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";

import type { AuditAction } from "@prisma/client";
import type { Response } from "express";

// ─── Shared filter builder ────────────────────────────────────────────────────

type AuditFilters = {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
};

function buildFilters(
  userId: string | undefined,
  action: string | undefined,
  entityType: string | undefined,
  entityId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
  page: string | undefined,
  limit: string | undefined,
): AuditFilters {
  const filters: AuditFilters = {};
  if (userId !== undefined) filters.userId = userId;
  if (action !== undefined) filters.action = action as AuditAction;
  if (entityType !== undefined) filters.entityType = entityType;
  if (entityId !== undefined) filters.entityId = entityId;
  if (startDate !== undefined) filters.startDate = new Date(startDate);
  if (endDate !== undefined) filters.endDate = new Date(endDate);
  if (page !== undefined) filters.page = parseInt(page, 10);
  if (limit !== undefined) filters.limit = parseInt(limit, 10);
  return filters;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller("v1/audit-logs")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions("ADMIN:VIEW_AUDIT_LOGS_MINISTRY")
  findAll(
    @Query("userId") userId?: string,
    @Query("action") action?: string,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ): Promise<unknown> {
    return this.auditService.findMany(
      buildFilters(userId, action, entityType, entityId, startDate, endDate, page, limit),
    );
  }

  @Get("export")
  @RequirePermissions("ADMIN:VIEW_AUDIT_LOGS_ALL")
  @Header("Content-Type", "text/csv; charset=utf-8")
  async exportCsv(
    @Query("userId") userId?: string,
    @Query("action") action?: string,
    @Query("entityType") entityType?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const filters = buildFilters(
      userId,
      action,
      entityType,
      undefined,
      startDate,
      endDate,
      "1",
      "10000",
    );

    const result = (await this.auditService.findMany(filters)) as {
      data: Record<string, unknown>[];
    };
    const rows = result.data ?? [];

    const csvHeader = "id,action,entityType,entityId,userId,ipAddress,createdAt\n";
    const csvBody = rows
      .map((r) => {
        const esc = (v: unknown): string => {
          const s = v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        };
        return [
          r["id"],
          r["action"],
          r["entityType"],
          r["entityId"],
          r["userId"],
          r["ipAddress"],
          r["createdAt"],
        ]
          .map(esc)
          .join(",");
      })
      .join("\n");

    const date = new Date().toISOString().slice(0, 10);
    res?.setHeader("Content-Disposition", `attachment; filename=audit-export-${date}.csv`);
    res?.send(csvHeader + csvBody);
  }
}
