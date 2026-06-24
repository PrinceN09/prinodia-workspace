import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/types/auth.types";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";

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
    return this.usersService.findMany(user, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      role,
      ministryId,
      search,
    });
  }

  @Get(":id")
  @RequirePermissions("USER:READ_MINISTRY")
  findOne(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
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
    return (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "";
  }
}
