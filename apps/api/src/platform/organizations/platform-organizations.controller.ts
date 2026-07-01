import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";

import { PlatformOrganizationsService } from "./platform-organizations.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProvisionOrgDto, UpdateOrgStatusDto, UpdateOrgBrandingDto } from "../dto/platform.dto";

import type { AuthenticatedUser } from "../../common/types/auth.types";

@UseGuards(JwtAuthGuard)
@Controller("v1/platform/organizations")
export class PlatformOrganizationsController {
  constructor(private readonly svc: PlatformOrganizationsService) {}

  @Get()
  listOrganizations(
    @Query("q") q?: string,
    @Query("status") status?: string,
    @Query("type") type?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.svc.listOrganizations({
      q,
      status,
      type,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(":id")
  getOrganizationDetail(@Param("id") id: string) {
    return this.svc.getOrganizationDetail(id);
  }

  @Post("provision")
  @HttpCode(HttpStatus.CREATED)
  provisionOrganization(@Body() dto: ProvisionOrgDto) {
    return this.svc.provisionOrganization(dto);
  }

  @Patch(":id/status")
  updateOrgStatus(@Param("id") id: string, @Body() dto: UpdateOrgStatusDto) {
    return this.svc.updateOrgStatus(id, dto);
  }

  @Get(":id/branding")
  getOrgBranding(@Param("id") id: string) {
    return this.svc.getOrgBranding(id);
  }

  @Patch(":id/branding")
  updateOrgBranding(
    @Param("id") id: string,
    @Body() dto: UpdateOrgBrandingDto,
    @CurrentUser() _actor: AuthenticatedUser,
  ) {
    return this.svc.updateOrgBranding(id, dto);
  }
}
