import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";

import { OnboardingService } from "./onboarding.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CompleteOnboardingStepDto } from "../dto/platform.dto";

@UseGuards(JwtAuthGuard)
@Controller("v1/platform/onboarding")
export class OnboardingController {
  constructor(private readonly svc: OnboardingService) {}

  @Get(":orgId")
  getProgress(@Param("orgId") orgId: string) {
    return this.svc.getProgress(orgId);
  }

  @Patch(":orgId/step")
  completeStep(@Param("orgId") orgId: string, @Body() dto: CompleteOnboardingStepDto) {
    return this.svc.completeStep(orgId, dto);
  }

  @Post(":orgId/complete")
  @HttpCode(HttpStatus.OK)
  completeOnboarding(@Param("orgId") orgId: string) {
    return this.svc.completeOnboarding(orgId);
  }
}
