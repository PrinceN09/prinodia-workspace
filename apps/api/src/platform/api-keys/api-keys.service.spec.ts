import * as crypto from "crypto";

import { Test } from "@nestjs/testing";

import type { TestingModule } from "@nestjs/testing";

import { ApiKeysService } from "./api-keys.service";
import { PrismaService } from "../../prisma/prisma.service";

import type { AuthenticatedUser } from "../../common/types/auth.types";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockPrisma = {
  apiKey: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockActor = {
  id: "user-1",
  email: "admin@test.com",
  matriculeNumber: "M001",
  role: "PLATFORM_ADMIN",
  roleWeight: 100,
  sessionId: "sess-1",
  permissions: [],
  mfaEnabled: false,
} as unknown as AuthenticatedUser;

// ─── Test suite ─────────────────────────────────────────────────────────────

describe("ApiKeysService", () => {
  let service: ApiKeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiKeysService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    jest.clearAllMocks();
  });

  // ── listApiKeys ──────────────────────────────────────────────────────────

  describe("listApiKeys", () => {
    it("returns keys via select (keyHash excluded from select)", async () => {
      const keys = [
        { id: "key-1", name: "Production key", keyPrefix: "pk_ABCD1234", isActive: true, scopes: [] },
        { id: "key-2", name: "Staging key", keyPrefix: "pk_EFGH5678", isActive: false, scopes: [] },
      ];
      mockPrisma.apiKey.findMany.mockResolvedValue(keys);

      const result = await service.listApiKeys("org-1");

      expect(result).toHaveLength(2);
    });

    it("filters by organizationId", async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([]);

      await service.listApiKeys("org-1");

      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: "org-1" }),
        }),
      );
    });

    it("uses a select that excludes keyHash", async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([]);

      await service.listApiKeys("org-1");

      const [callArgs] = mockPrisma.apiKey.findMany.mock.calls[0] as [
        { select: Record<string, unknown> },
      ];
      expect(callArgs.select).toBeDefined();
      expect(callArgs.select["keyHash"]).not.toBe(true);
    });
  });

  // ── createApiKey ─────────────────────────────────────────────────────────

  describe("createApiKey", () => {
    const dto = { name: "My API Key", scopes: ["drive:read", "docs:write"] };

    it("stores SHA-256 hash, not raw key", async () => {
      mockPrisma.apiKey.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          id: "key-new",
          ...data,
        }),
      );

      const result = await service.createApiKey("org-1", mockActor, dto);

      // The raw key is returned to caller exactly once
      expect(result.rawKey).toBeDefined();
      expect(typeof result.rawKey).toBe("string");
      expect(result.rawKey.length).toBeGreaterThan(20);

      // Verify what was stored is the hash of the raw key
      const expectedHash = crypto.createHash("sha256").update(result.rawKey).digest("hex");
      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ keyHash: expectedHash }),
        }),
      );
    });

    it("sets keyPrefix matching pk_ pattern", async () => {
      mockPrisma.apiKey.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          id: "key-new",
          ...data,
        }),
      );

      await service.createApiKey("org-1", mockActor, dto);

      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            keyPrefix: expect.stringMatching(/^pk_/),
          }),
        }),
      );
    });

    it("does NOT return keyHash in the response", async () => {
      mockPrisma.apiKey.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          id: "key-new",
          ...data,
        }),
      );

      const result = await service.createApiKey("org-1", mockActor, dto);

      // keyHash is explicitly nulled out before returning
      expect(result.keyHash).toBeUndefined();
    });

    it("sets createdById from the actor", async () => {
      mockPrisma.apiKey.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          id: "key-new",
          ...data,
        }),
      );

      await service.createApiKey("org-1", mockActor, dto);

      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ createdById: "user-1" }),
        }),
      );
    });
  });

  // ── revokeApiKey ─────────────────────────────────────────────────────────

  describe("revokeApiKey", () => {
    it("sets isActive to false (soft delete)", async () => {
      const key = { id: "key-1", organizationId: "org-1", isActive: true };
      mockPrisma.apiKey.findUnique.mockResolvedValue(key);
      mockPrisma.apiKey.update.mockResolvedValue({ ...key, isActive: false });

      await service.revokeApiKey("key-1", "org-1");

      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "key-1" },
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it("throws NotFoundException for unknown key", async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      await expect(service.revokeApiKey("bad-key-id", "org-1")).rejects.toThrow();
    });

    it("throws if key does not belong to org", async () => {
      const key = { id: "key-1", organizationId: "org-OTHER", isActive: true };
      mockPrisma.apiKey.findUnique.mockResolvedValue(key);

      await expect(service.revokeApiKey("key-1", "org-1")).rejects.toThrow();
    });
  });

  // ── validateApiKey ───────────────────────────────────────────────────────

  describe("validateApiKey", () => {
    it("returns true and updates lastUsedAt when key is valid", async () => {
      const rawKey = "pk_ABCD1234_EFGH5678";
      const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
      const key = {
        id: "key-1",
        keyHash: hash,
        isActive: true,
        organizationId: "org-1",
        scopes: [],
      };

      mockPrisma.apiKey.findUnique.mockResolvedValue(key);
      mockPrisma.apiKey.update.mockResolvedValue({ ...key, lastUsedAt: new Date() });

      const result = await service.validateApiKey(rawKey);

      expect(result).toBe(true);
      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "key-1" },
          data: expect.objectContaining({ lastUsedAt: expect.any(Date) }),
        }),
      );
    });

    it("returns false for missing or inactive key", async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      const result = await service.validateApiKey("invalid-raw-key");

      expect(result).toBe(false);
    });

    it("hashes the raw key before querying", async () => {
      const rawKey = "pk_TESTKEY1234";
      const expectedHash = crypto.createHash("sha256").update(rawKey).digest("hex");
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      await service.validateApiKey(rawKey);

      expect(mockPrisma.apiKey.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ keyHash: expectedHash }),
        }),
      );
    });
  });
});
