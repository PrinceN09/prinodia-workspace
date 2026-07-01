import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

import type { CreatePlanDto, UpdatePlanDto, UpdateSubscriptionDto } from "../dto/platform.dto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    return this.prisma as unknown as AnyPrisma;
  }

  // ─── Plans ─────────────────────────────────────────────────────────────────

  listPlans(publicOnly = false) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.subscriptionPlan.findMany({
      where: { isActive: true, ...(publicOnly ? { isPublic: true } : {}) },
      orderBy: { sortOrder: "asc" },
    });
  }

  async getPlan(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const plan = await this.db.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return plan;
  }

  createPlan(dto: CreatePlanDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.subscriptionPlan.create({ data: dto as any });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    await this.getPlan(id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.subscriptionPlan.update({ where: { id }, data: dto as any });
  }

  // ─── Org Subscriptions ─────────────────────────────────────────────────────

  async getOrgSubscription(organizationId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sub = await this.db.orgSubscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundException(`No subscription found for org ${organizationId}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return sub;
  }

  async updateOrgSubscription(organizationId: string, dto: UpdateSubscriptionDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existing = await this.db.orgSubscription.findUnique({ where: { organizationId } });
    if (!existing) throw new NotFoundException(`No subscription for org ${organizationId}`);

    if (dto.planId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const plan = await this.db.subscriptionPlan.findUnique({ where: { id: dto.planId } });
      if (!plan) throw new BadRequestException(`Plan ${dto.planId} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.orgSubscription.update({
      where: { organizationId },
      data: dto as any,
      include: { plan: true },
    });
  }

  async cancelOrgSubscription(organizationId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sub = await this.db.orgSubscription.findUnique({ where: { organizationId } });
    if (!sub) throw new NotFoundException(`No subscription for org ${organizationId}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.db.orgSubscription.update({
      where: { organizationId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  }
}
