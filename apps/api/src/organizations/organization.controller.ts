/**
 * Prinodia Workspace — OrganizationController (v1.0.2)
 *
 * GET    /v1/organizations              → list with pagination + filters
 * GET    /v1/organizations/:id          → get single organization
 * GET    /v1/organizations/:id/dashboard → stats overview
 * GET    /v1/organizations/:id/structure → departments tree
 * GET    /v1/organizations/:id/users    → paginated employee list
 * POST   /v1/organizations              → create organization
 * PATCH  /v1/organizations/:id         → update organization
 * DELETE /v1/organizations/:id         → archive organization (soft delete)
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import {
  CreateOrganizationDto,
  QueryOrganizationsDto,
  UpdateOrganizationDto,
} from "./dto/organization.dto";
import { OrganizationService } from "./organization.service";

@Controller("v1/organizations")
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get()
  findAll(@Query() query: QueryOrganizationsDto) {
    return this.orgService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.orgService.findOne(id);
  }

  @Get(":id/dashboard")
  getDashboard(@Param("id") id: string) {
    return this.orgService.getDashboard(id);
  }

  @Get(":id/structure")
  getStructure(@Param("id") id: string) {
    return this.orgService.getStructure(id);
  }

  @Get(":id/users")
  getUsers(@Param("id") id: string, @Query("page") page?: number, @Query("limit") limit?: number) {
    return this.orgService.getUsers(id, page, limit);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrganizationDto) {
    return this.orgService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) {
    return this.orgService.remove(id);
  }
}
