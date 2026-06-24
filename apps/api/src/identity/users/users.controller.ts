import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";

import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UsersService } from "./users.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";

import type { AuthenticatedUser } from "../../common/types/auth.types";
import type { Request } from "express";

@Controller("v1/users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions("USER:READ_MINISTRY")
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("role") role?: string,
    @Query("ministryId") ministryId?: string,
    @Query("search") search?: string,
  ): Promise<unknown> {
    // exactOptionalPropertyTypes: build the filter object incrementally.
    const filters: {
      page?: number;
      limit?: number;
      status?: string;
      role?: string;
      ministryId?: string;
      search?: string;
    } = {};
    if (page !== undefined) filters.page = parseInt(page, 10);
    if (limit !== undefined) filters.limit = parseInt(limit, 10);
    if (status !== undefined) filters.status = status;
    if (role !== undefined) filters.role = role;
    if (ministryId !== undefined) filters.ministryId = ministryId;
    if (search !== undefined) filters.search = search;
    return this.usersService.findMany(user, filters);
  }

  @Get(":id")
  @RequirePermissions("USER:READ_MINISTRY")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.usersService.findById(id, user);
  }

  @Post()
  @RequirePermissions("USER:CREATE")
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<unknown> {
    const ip = this.getIp(req);
    return this.usersService.create(dto, user, ip);
  }

  @Patch(":id/status")
  @RequirePermissions("USER:DEACTIVATE")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.usersService.updateStatus(id, dto, user, this.getIp(req));
  }

  @Patch(":id/unlock")
  @RequirePermissions("USER:UNLOCK")
  unlockAccount(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.usersService.unlockAccount(id, user, this.getIp(req));
  }

  private getIp(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? ""
    );
  }
}
