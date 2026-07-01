import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

import type {
  ProvisionOrgDto,
  UpdateOrgStatusDto,
  UpdateOrgBrandingDto,
} from "../dto/platform.dto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

@Injectable()
export class PlatformOrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): AnyPrisma {
    return this.prisma as unknown as AnyPrisma;
  }

  // ─── List ──────────────────────────────────────────────────────────────────

  async listOrganizations(query: {
    q?: string | undefined;
    status?: string | undefined;
    type?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  }) {
    const { q, status, type, page = 1, limit = 20 } = query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { workspaceSlug: { contains: q, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (type) where.type = type;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [items, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.organization.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { users: true } },
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.organization.count({ where }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const orgIds: string[] = (items as { id: string }[]).map((o) => o.id);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [subscriptions, profiles] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.orgSubscription.findMany({
        where: { organizationId: { in: orgIds } },
        include: { plan: { select: { name: true, tier: true } } },
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.orgPlatformProfile.findMany({
        where: { organizationId: { in: orgIds } },
        select: {
          organizationId: true,
          onboardingCompleted: true,
          activatedAt: true,
          seatsUsed: true,
        },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const subMap = new Map((subscriptions as any[]).map((s: any) => [s.organizationId, s]));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const profMap = new Map((profiles as any[]).map((p: any) => [p.organizationId, p]));

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (items as any[]).map((org: any) => ({
        ...org,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        subscription: subMap.get(org.id as string) ?? null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        profile: profMap.get(org.id as string) ?? null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Detail ────────────────────────────────────────────────────────────────

  async getOrganizationDetail(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const org = await this.db.organization.findUnique({
      where: { id },
      include: { _count: { select: { users: true, ministries: true, departments: true } } },
    });
    if (!org) throw new NotFoundException(`Organization ${id} not found`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [subscription, profile, featureFlags, moduleConfigs, onboarding] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.orgSubscription.findUnique({
        where: { organizationId: id },
        include: { plan: true },
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.orgPlatformProfile.findUnique({ where: { organizationId: id } }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.orgFeatureFlag.findMany({ where: { organizationId: id } }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.orgModuleConfig.findMany({ where: { organizationId: id } }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.db.onboardingProgress.findUnique({ where: { organizationId: id } }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return { ...org, subscription, profile, featureFlags, moduleConfigs, onboarding };
  }

  // ─── Provision ─────────────────────────────────────────────────────────────

  async provisionOrganization(dto: ProvisionOrgDto) {
    // Check code uniqueness
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existing = await this.db.organization.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Organization code "${dto.code}" already exists`);

    // Resolve plan
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const plan = dto.planSlug
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await this.db.subscriptionPlan.findUnique({ where: { slug: dto.planSlug } })
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await this.db.subscriptionPlan.findFirst({
          where: { tier: "STARTER", isActive: true, isPublic: true },
          orderBy: { sortOrder: "asc" },
        });

    if (!plan) throw new BadRequestException("No active plan found for provisioning");

    const workspaceSlug = dto.code
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120);

    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trialEnds = new Date(now.getTime() + plan.trialDays * 86400000);

    // Create org + profile + subscription + onboarding in transaction
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.$transaction(async (tx: AnyPrisma) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          code: dto.code,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          type: dto.type as any,
          workspaceSlug,
          email: dto.billingEmail,
          country: dto.country,
        },
      });

      await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        tx.orgPlatformProfile.create({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: { organizationId: (org as { id: string }).id, billingEmail: dto.billingEmail },
        }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        tx.orgSubscription.create({
          data: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            organizationId: (org as { id: string }).id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            planId: plan.id,
            status: "TRIALING",
            trialStartsAt: now,
            trialEndsAt: trialEnds,
          },
        }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        tx.onboardingProgress.create({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: { organizationId: (org as { id: string }).id },
        }),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return org;
    });
  }

  // ─── Status ────────────────────────────────────────────────────────────────

  async updateOrgStatus(id: string, dto: UpdateOrgStatusDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const org = await this.db.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException(`Organization ${id} not found`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.organization.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { status: dto.status as any },
    });
  }

  // ─── Branding ──────────────────────────────────────────────────────────────

  async getOrgBranding(organizationId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const profile = await this.db.orgPlatformProfile.findUnique({ where: { organizationId } });
    if (!profile)
      throw new NotFoundException(`Branding profile for org ${organizationId} not found`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return profile;
  }

  updateOrgBranding(organizationId: string, dto: UpdateOrgBrandingDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.orgPlatformProfile.upsert({
      where: { organizationId },
      create: { organizationId, ...dto },
      update: dto,
    });
  }
}
