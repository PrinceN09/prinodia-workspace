import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";

import { ApiKeysService } from "./api-keys.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreateApiKeyDto, UpdateApiKeyDto } from "../dto/platform.dto";

import type { AuthenticatedUser } from "../../common/types/auth.types";

@UseGuards(JwtAuthGuard)
@Controller("v1/platform/api-keys")
export class ApiKeysController {
  constructor(private readonly svc: ApiKeysService) {}

  @Get(":orgId")
  listApiKeys(@Param("orgId") orgId: string) {
    return this.svc.listApiKeys(orgId);
  }

  @Post(":orgId")
  @HttpCode(HttpStatus.CREATED)
  createApiKey(
    @Param("orgId") orgId: string,
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.svc.createApiKey(orgId, actor, dto);
  }

  @Patch(":orgId/:id")
  updateApiKey(
    @Param("orgId") orgId: string,
    @Param("id") id: string,
    @Body() dto: UpdateApiKeyDto,
  ) {
    return this.svc.updateApiKey(id, orgId, dto);
  }

  @Delete(":orgId/:id")
  @HttpCode(HttpStatus.OK)
  revokeApiKey(@Param("orgId") orgId: string, @Param("id") id: string) {
    return this.svc.revokeApiKey(id, orgId);
  }
}
