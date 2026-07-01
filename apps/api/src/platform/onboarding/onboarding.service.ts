import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

import type { CompleteOnboardingStepDto } from "../dto/platform.dto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

export const ONBOARDING_STEPS = [
  { step: 0, key: "profile", label: "Complete org profile" },
  { step: 1, key: "branding", label: "Set up branding" },
  { step: 2, key: "invite_users", label: "Invite team members" },
  { step: 3, key: "enable_modules", label: "Enable modules" },
  { step: 4, key: "configure_domain", label: "Configure workspace domain" },
  { step: 5, key: "explore", label: "Explore the workspace" },
];

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    return this.prisma as unknown as AnyPrisma;
  }

  async getProgress(organizationId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let progress = await this.db.onboardingProgress.findUnique({ where: { organizationId } });
    if (!progress) {
      // Auto-create if provisioning didn't create it
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      progress = await this.db.onboardingProgress.create({ data: { organizationId } });
    }
    return { ...progress, steps: ONBOARDING_STEPS };
  }

  async completeStep(organizationId: string, dto: CompleteOnboardingStepDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const progress = await this.db.onboardingProgress.findUnique({ where: { organizationId } });
    if (!progress)
      throw new NotFoundException(`Onboarding progress for org ${organizationId} not found`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const completed: number[] = progress.completedSteps ?? [];
    if (!completed.includes(dto.step)) completed.push(dto.step);

    const nextStep = dto.step + 1 >= ONBOARDING_STEPS.length ? dto.step : dto.step + 1;
    const isCompleted = completed.length >= ONBOARDING_STEPS.length;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.onboardingProgress.update({
      where: { organizationId },
      data: {
        completedSteps: completed,
        currentStep: nextStep,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
        data: dto.data ? { ...progress.data, [`step_${dto.step}`]: dto.data } : undefined,
      },
    });
  }

  async completeOnboarding(organizationId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const progress = await this.db.onboardingProgress.findUnique({ where: { organizationId } });
    if (!progress)
      throw new NotFoundException(`Onboarding progress not found for org ${organizationId}`);

    // Also update the profile
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.db.orgPlatformProfile.upsert({
      where: { organizationId },
      create: { organizationId, onboardingCompleted: true, activatedAt: new Date() },
      update: { onboardingCompleted: true, activatedAt: new Date() },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.onboardingProgress.update({
      where: { organizationId },
      data: { isCompleted: true, completedAt: new Date() },
    });
  }
}
