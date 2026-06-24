import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/types/auth.types";
import { RolesService, type AssignRoleDto } from "./roles.service";

@Controller("v1")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get("roles")
  @RequirePermissions("ADMIN:MANAGE_ROLES")
  findAll(): Promise<unknown[]> {
    return this.rolesService.findAll();
  }

  @Get("roles/:id")
  @RequirePermissions("ADMIN:MANAGE_ROLES")
  findOne(@Param("id") id: string): Promise<unknown> {
    return this.rolesService.findById(id);
  }

  @Post("users/:userId/roles")
  @RequirePermissions("USER:UPDATE_ROLE")
  assignRole(
    @Param("userId") userId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<unknown> {
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "";
    return this.rolesService.assignRoleToUser(userId, dto, user, ip);
  }

  @Delete("users/:userId/roles/:assignmentId")
  @RequirePermissions("USER:UPDATE_ROLE")
  async revokeRole(
    @Param("userId") userId: string,
    @Param("assignmentId") assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "";
    await this.rolesService.revokeRoleFromUser(userId, assignmentId, user, ip);
    return { message: "Role revoked" };
  }
}
