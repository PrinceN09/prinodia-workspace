import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

import type { UpsertFeatureFlagDto, UpsertModuleConfigDto } from "../dto/platform.dto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

@Injectable()
export class FeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    return this.prisma as unknown as AnyPrisma;
  }

  // ─── Feature Flags ─────────────────────────────────────────────────────────

  listFeatureFlags(organizationId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.orgFeatureFlag.findMany({
      where: { organizationId },
      orderBy: { featureKey: "asc" },
    });
  }

  upsertFeatureFlag(organizationId: string, featureKey: string, dto: UpsertFeatureFlagDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.orgFeatureFlag.upsert({
      where: { organizationId_featureKey: { organizationId, featureKey } },
      create: { organizationId, featureKey, ...dto },
      update: dto,
    });
  }

  async isFeatureEnabled(organizationId: string, featureKey: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const flag = await this.db.orgFeatureFlag.findUnique({
      where: { organizationId_featureKey: { organizationId, featureKey } },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return flag?.enabled ?? false;
  }

  // ─── Module Configs ────────────────────────────────────────────────────────

  listModuleConfigs(organizationId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.orgModuleConfig.findMany({
      where: { organizationId },
      orderBy: { moduleKey: "asc" },
    });
  }

  upsertModuleConfig(organizationId: string, moduleKey: string, dto: UpsertModuleConfigDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.orgModuleConfig.upsert({
      where: { organizationId_moduleKey: { organizationId, moduleKey } },
      create: {
        organizationId,
        moduleKey,
        ...dto,
        enabledAt: dto.enabled ? new Date() : undefined,
      },
      update: {
        ...dto,
        enabledAt: dto.enabled ? new Date() : undefined,
      },
    });
  }

  async isModuleEnabled(organizationId: string, moduleKey: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cfg = await this.db.orgModuleConfig.findUnique({
      where: { organizationId_moduleKey: { organizationId, moduleKey } },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return cfg?.enabled ?? true; // default enabled
  }
}
