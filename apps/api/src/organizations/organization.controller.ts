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
import { RequirePermissions } from "../common/decorators/permissions.decorator";

@Controller("v1/organizations")
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get()
  @RequirePermissions("ORGANIZATION:READ")
  findAll(@Query() query: QueryOrganizationsDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("ORGANIZATION:READ")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/dashboard")
  @RequirePermissions("ORGANIZATION:READ")
  getDashboard(@Param("id") id: string) {
    return this.service.getDashboard(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("ORGANIZATION:CREATE")
  create(@Body() dto: CreateOrganizationDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("ORGANIZATION:UPDATE")
  update(@Param("id") id: string, @Body() dto: UpdateOrganizationDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("ORGANIZATION:DELETE")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
