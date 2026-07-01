import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { AdminAuditService } from "./admin-audit.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("v1/platform/audit")
export class AdminAuditController {
  constructor(private readonly svc: AdminAuditService) {}

  @Get()
  listLogs(
    @Query("orgId") organizationId?: string,
    @Query("actorId") actorId?: string,
    @Query("action") action?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.svc.listLogs({
      organizationId,
      actorId,
      action,
      from,
      to,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}
