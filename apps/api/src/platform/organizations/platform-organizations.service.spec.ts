import { Test } from "@nestjs/testing";

import type { TestingModule } from "@nestjs/testing";

import { PlatformOrganizationsService } from "./platform-organizations.service";
import { PrismaService } from "../../prisma/prisma.service";

import type { OrganizationStatus } from "@prisma/client";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockPrismaTransaction = jest.fn();

const mockPrisma = {
  organization: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  orgPlatformProfile: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  orgSubscription: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  onboardingProgress: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  subscriptionPlan: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  orgFeatureFlag: {
    findMany: jest.fn(),
  },
  orgModuleConfig: {
    findMany: jest.fn(),
  },
  $transaction: mockPrismaTransaction,
};

// ─── Test suite ─────────────────────────────────────────────────────────────

describe("PlatformOrganizationsService", () => {
  let service: PlatformOrganizationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformOrganizationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PlatformOrganizationsService>(PlatformOrganizationsService);
    jest.clearAllMocks();
  });

  // ── listOrganizations ────────────────────────────────────────────────────

  describe("listOrganizations", () => {
    it("returns paginated org list", async () => {
      const orgs = [
        {
          id: "org-1",
          name: "Ministry of Finance",
          code: "MOF",
          type: "GOVERNMENT",
          status: "ACTIVE",
          _count: { users: 42 },
        },
      ];
      mockPrisma.organization.findMany.mockResolvedValue(orgs);
      mockPrisma.organization.count.mockResolvedValue(1);
      mockPrisma.orgSubscription.findMany.mockResolvedValue([]);
      mockPrisma.orgPlatformProfile.findMany.mockResolvedValue([]);

      const result = await service.listOrganizations({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it("applies status filter when provided", async () => {
      mockPrisma.organization.findMany.mockResolvedValue([]);
      mockPrisma.organization.count.mockResolvedValue(0);
      mockPrisma.orgSubscription.findMany.mockResolvedValue([]);
      mockPrisma.orgPlatformProfile.findMany.mockResolvedValue([]);

      await service.listOrganizations({
        page: 1,
        limit: 10,
        status: "SUSPENDED" as OrganizationStatus,
      });

      expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "SUSPENDED" }),
        }),
      );
    });
  });

  // ── getOrganizationDetail ────────────────────────────────────────────────

  describe("getOrganizationDetail", () => {
    it("throws NotFoundException when org does not exist", async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.getOrganizationDetail("non-existent-id")).rejects.toThrow();
    });

    it("returns full org detail when org exists", async () => {
      const org = {
        id: "org-1",
        name: "Test Org",
        code: "TST",
        type: "ENTERPRISE",
        status: "ACTIVE",
        _count: { users: 5 },
      };
      const profile = { id: "pp-1", organizationId: "org-1", activatedAt: new Date() };

      mockPrisma.organization.findUnique.mockResolvedValue(org);
      mockPrisma.orgSubscription.findUnique.mockResolvedValue(null);
      mockPrisma.orgPlatformProfile.findUnique.mockResolvedValue(profile);
      mockPrisma.orgFeatureFlag.findMany.mockResolvedValue([]);
      mockPrisma.orgModuleConfig.findMany.mockResolvedValue([]);
      mockPrisma.onboardingProgress.findUnique.mockResolvedValue(null);

      const result = await service.getOrganizationDetail("org-1");

      expect(result.id).toBe("org-1");
      expect(result.profile).toBeDefined();
    });
  });

  // ── provisionOrganization ────────────────────────────────────────────────

  describe("provisionOrganization", () => {
    const dto = {
      name: "New Org",
      code: "NEW",
      type: "ENTERPRISE" as const,
      planSlug: "business",
      billingEmail: "billing@neworg.com",
    };

    it("runs inside a transaction", async () => {
      mockPrismaTransaction.mockImplementation(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma),
      );
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
        id: "plan-1",
        name: "Business",
        trialDays: 14,
      });
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue({ id: "org-new", ...dto });
      mockPrisma.orgPlatformProfile.create.mockResolvedValue({
        id: "pp-new",
        organizationId: "org-new",
      });
      mockPrisma.orgSubscription.create.mockResolvedValue({
        id: "sub-new",
        organizationId: "org-new",
      });
      mockPrisma.onboardingProgress.create.mockResolvedValue({
        id: "op-new",
        organizationId: "org-new",
      });

      await service.provisionOrganization(dto);

      expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
    });

    it("throws BadRequestException when plan does not exist", async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(null);
      mockPrisma.subscriptionPlan.findFirst.mockResolvedValue(null);

      await expect(service.provisionOrganization(dto)).rejects.toThrow();
    });

    it("throws ConflictException when org code already exists", async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ id: "existing-org", code: "NEW" });

      await expect(service.provisionOrganization(dto)).rejects.toThrow();
    });
  });

  // ── updateOrgStatus ──────────────────────────────────────────────────────

  describe("updateOrgStatus", () => {
    it("updates org status", async () => {
      const org = { id: "org-1", name: "Test", status: "ACTIVE" };
      mockPrisma.organization.findUnique.mockResolvedValue(org);
      mockPrisma.organization.update.mockResolvedValue({ ...org, status: "SUSPENDED" });

      await service.updateOrgStatus("org-1", {
        status: "SUSPENDED" as OrganizationStatus,
        reason: "Non-payment",
      });

      expect(mockPrisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "org-1" },
          data: expect.objectContaining({ status: "SUSPENDED" }),
        }),
      );
    });

    it("throws NotFoundException for unknown org", async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrgStatus("bad-id", { status: "SUSPENDED" as OrganizationStatus }),
      ).rejects.toThrow();
    });
  });

  // ── getOrgBranding / updateOrgBranding ──────────────────────────────────

  describe("getOrgBranding", () => {
    it("returns branding from OrgPlatformProfile", async () => {
      const profile = {
        id: "pp-1",
        organizationId: "org-1",
        brandColor: "#1E3A5F",
        brandSecondaryColor: "#F59E0B",
        tagline: "For the people",
      };
      mockPrisma.orgPlatformProfile.findUnique.mockResolvedValue(profile);

      const result = await service.getOrgBranding("org-1");

      expect(result.brandColor).toBe("#1E3A5F");
      expect(result.tagline).toBe("For the people");
    });

    it("throws NotFoundException when profile does not exist", async () => {
      mockPrisma.orgPlatformProfile.findUnique.mockResolvedValue(null);

      await expect(service.getOrgBranding("org-1")).rejects.toThrow();
    });
  });

  describe("updateOrgBranding", () => {
    it("upserts OrgPlatformProfile branding fields", async () => {
      mockPrisma.orgPlatformProfile.upsert.mockResolvedValue({
        id: "pp-1",
        brandColor: "#FF0000",
      });

      await service.updateOrgBranding("org-1", { primaryColor: "#FF0000" });

      expect(mockPrisma.orgPlatformProfile.upsert).toHaveBeenCalled();
    });
  });
});
