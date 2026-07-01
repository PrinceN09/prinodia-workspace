import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";

import { SubscriptionsService } from "./subscriptions.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CreatePlanDto, UpdatePlanDto, UpdateSubscriptionDto } from "../dto/platform.dto";

import type { AuthenticatedUser } from "../../common/types/auth.types";

@UseGuards(JwtAuthGuard)
@Controller("v1/platform")
export class SubscriptionsController {
  constructor(private readonly svc: SubscriptionsService) {}

  // Plans
  @Get("plans")
  listPlans(@Query("publicOnly") publicOnly?: string) {
    return this.svc.listPlans(publicOnly === "true");
  }

  @Get("plans/:id")
  getPlan(@Param("id") id: string) {
    return this.svc.getPlan(id);
  }

  @Post("plans")
  @HttpCode(HttpStatus.CREATED)
  createPlan(@Body() dto: CreatePlanDto) {
    return this.svc.createPlan(dto);
  }

  @Patch("plans/:id")
  updatePlan(@Param("id") id: string, @Body() dto: UpdatePlanDto) {
    return this.svc.updatePlan(id, dto);
  }

  // Subscriptions
  @Get("subscriptions/my")
  getMySubscription(@CurrentUser() actor: AuthenticatedUser) {
    const orgId = actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global";
    return this.svc.getOrgSubscription(orgId);
  }

  @Get("subscriptions/:orgId")
  getOrgSubscription(@Param("orgId") orgId: string) {
    return this.svc.getOrgSubscription(orgId);
  }

  @Patch("subscriptions/:orgId")
  updateOrgSubscription(@Param("orgId") orgId: string, @Body() dto: UpdateSubscriptionDto) {
    return this.svc.updateOrgSubscription(orgId, dto);
  }

  @Post("subscriptions/:orgId/cancel")
  @HttpCode(HttpStatus.OK)
  cancelOrgSubscription(@Param("orgId") orgId: string) {
    return this.svc.cancelOrgSubscription(orgId);
  }
}
