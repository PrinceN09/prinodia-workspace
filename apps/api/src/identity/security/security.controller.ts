import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { SecurityService } from "./security.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";

import type { SecurityDashboard, AdminSession } from "./security.service";
import type { AuthenticatedUser } from "../../common/types/auth.types";
import type { Request } from "express";

const ip = (req: Request): string =>
  (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "";

@Controller("v1/security")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────

  @Get("dashboard")
  @RequirePermissions("ADMIN:VIEW_AUDIT_LOGS_ALL")
  getDashboard(): Promise<SecurityDashboard> {
    return this.securityService.getDashboardStats();
  }

  // ── Sessions ──────────────────────────────────────────────────────────────

  @Get("sessions")
  @RequirePermissions("ADMIN:VIEW_AUDIT_LOGS_ALL")
  findAllSessions(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("ministryId") ministryId?: string,
    @Query("search") search?: string,
  ): Promise<{ data: AdminSession[]; meta: { total: number; page: number; limit: number } }> {
    const params: {
      page?: number;
      limit?: number;
      ministryId?: string;
      search?: string;
    } = {};
    if (page !== undefined) params.page = parseInt(page, 10);
    if (limit !== undefined) params.limit = parseInt(limit, 10);
    if (ministryId !== undefined) params.ministryId = ministryId;
    if (search !== undefined) params.search = search;
    return this.securityService.findAllSessions(params);
  }

  @Delete("sessions/:id")
  @RequirePermissions("ADMIN:VIEW_AUDIT_LOGS_ALL")
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.securityService.revokeSessionById(id, user, ip(req));
    return { message: "Session revoked" };
  }

  @Delete("sessions")
  @RequirePermissions("ADMIN:VIEW_AUDIT_LOGS_ALL")
  @HttpCode(HttpStatus.OK)
  async revokeUserSessions(
    @Query("userId") userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ count: number }> {
    return this.securityService.revokeAllSessionsForUser(userId, user, ip(req));
  }
}
