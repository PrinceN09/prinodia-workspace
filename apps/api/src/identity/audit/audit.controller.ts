import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { AuditService } from "./audit.service";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";

import type { AuditAction } from "@prisma/client";

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
    // exactOptionalPropertyTypes: build the filter object incrementally so we
    // never explicitly assign `undefined` to an optional property.
    const filters: {
      userId?: string;
      action?: AuditAction;
      entityType?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {};
    if (userId !== undefined) filters.userId = userId;
    if (action !== undefined) filters.action = action as AuditAction;
    if (entityType !== undefined) filters.entityType = entityType;
    if (entityId !== undefined) filters.entityId = entityId;
    if (startDate !== undefined) filters.startDate = new Date(startDate);
    if (endDate !== undefined) filters.endDate = new Date(endDate);
    if (page !== undefined) filters.page = parseInt(page, 10);
    if (limit !== undefined) filters.limit = parseInt(limit, 10);
    return this.auditService.findMany(filters);
  }
}
