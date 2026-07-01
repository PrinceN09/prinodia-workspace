import { Controller, Get, Put, Body, Param, UseGuards } from "@nestjs/common";

import { FeaturesService } from "./features.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UpsertFeatureFlagDto, UpsertModuleConfigDto } from "../dto/platform.dto";

@UseGuards(JwtAuthGuard)
@Controller("v1/platform")
export class FeaturesController {
  constructor(private readonly svc: FeaturesService) {}

  @Get("features/:orgId")
  listFeatureFlags(@Param("orgId") orgId: string) {
    return this.svc.listFeatureFlags(orgId);
  }

  @Put("features/:orgId/:key")
  upsertFeatureFlag(
    @Param("orgId") orgId: string,
    @Param("key") key: string,
    @Body() dto: UpsertFeatureFlagDto,
  ) {
    return this.svc.upsertFeatureFlag(orgId, key, dto);
  }

  @Get("modules/:orgId")
  listModuleConfigs(@Param("orgId") orgId: string) {
    return this.svc.listModuleConfigs(orgId);
  }

  @Put("modules/:orgId/:moduleKey")
  upsertModuleConfig(
    @Param("orgId") orgId: string,
    @Param("moduleKey") moduleKey: string,
    @Body() dto: UpsertModuleConfigDto,
  ) {
    return this.svc.upsertModuleConfig(orgId, moduleKey, dto);
  }
}
