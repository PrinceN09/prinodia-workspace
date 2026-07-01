/**
 * Prinodia Drive v1.7.0 — DriveService unit tests
 */

import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DriveService } from "./drive.service";
import { DriveStorageService } from "./storage/drive-storage.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuthenticatedUser } from "../common/types/auth.types";

// ─── Mock factory helpers ─────────────────────────────────────────────────────

const mockActor = {
  id: "user-1",
  email: "test@prinodia.gov",
  matriculeNumber: null,
  role: "EMPLOYEE",
  roleWeight: 1,
  ministryId: "min-1",
  departmentId: null,
  divisionId: null,
  sessionId: "sess-1",
  permissions: [],
  mfaEnabled: false,
} as unknown as AuthenticatedUser;

const _mockAdminActor = {
  ...mockActor,
  id: "admin-1",
  role: "SUPER_ADMIN",
  roleWeight: 100,
} as unknown as AuthenticatedUser;

const mockItem = {
  id: "item-1",
  name: "document.pdf",
  type: "FILE",
  status: "ACTIVE",
  mimeType: "application/pdf",
  extension: "pdf",
  sizeBytes: BigInt(1024),
  storageKey: "org-1/2026/06/item-1/v1/abc.pdf",
  storageProvider: "LOCAL",
  checksum: "abc123",
  currentVersionNum: 1,
  parentId: null,
  organizationId: "org-1",
  ownerId: "user-1",
  isLocked: false,
  isPinned: false,
  previewStatus: "PENDING",
  virusScanStatus: "PENDING",
  trashedAt: null,
  trashedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: { id: "user-1", displayName: "Test User", avatarUrl: null },
};

function buildPrismaMock() {
  return {
    driveItem: {
      findMany: jest.fn().mockResolvedValue([mockItem]),
      findFirst: jest.fn().mockResolvedValue(mockItem),
      findUnique: jest.fn().mockResolvedValue(mockItem),
      create: jest.fn().mockResolvedValue(mockItem),
      update: jest.fn().mockResolvedValue(mockItem),
      count: jest.fn().mockResolvedValue(0),
    },
    driveVersion: {
      create: jest.fn().mockResolvedValue({ id: "ver-1", versionNum: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    driveStorageQuota: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ totalBytes: BigInt(10 * 1024 * 1024 * 1024), usedBytes: BigInt(0) }),
      upsert: jest.fn().mockResolvedValue({
        totalBytes: BigInt(10 * 1024 * 1024 * 1024),
        usedBytes: BigInt(1024),
        fileCount: 1,
      }),
    },
    driveAudit: {
      create: jest.fn().mockResolvedValue({ id: "audit-1" }),
    },
    driveSyncJob: {
      create: jest.fn().mockResolvedValue({ id: "job-1" }),
    },
    driveRecycleBin: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ id: "bin-1" }),
      delete: jest.fn().mockResolvedValue({ id: "bin-1" }),
    },
    driveFavorite: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: "fav-1" }),
      delete: jest.fn().mockResolvedValue({ id: "fav-1" }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    driveRecent: {
      upsert: jest.fn().mockResolvedValue({ id: "rec-1" }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    driveLock: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ id: "lock-1" }),
      delete: jest.fn().mockResolvedValue({ id: "lock-1" }),
    },
    driveCheckout: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: "checkout-1" }),
      update: jest.fn().mockResolvedValue({ id: "checkout-1" }),
    },
    drivePermission: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };
}

function buildStorageMock() {
  return {
    activeProviderName: "LOCAL",
    buildKey: jest.fn().mockReturnValue("org-1/2026/06/item-1/v1/test.pdf"),
    upload: jest.fn().mockResolvedValue({
      storageKey: "org-1/2026/06/item-1/v1/test.pdf",
      sizeBytes: 1024,
      checksum: "abc123",
      mimeType: "application/pdf",
    }),
    download: jest.fn().mockResolvedValue({
      buffer: Buffer.from("PDF content"),
      mimeType: "application/pdf",
      sizeBytes: 11,
    }),
    delete: jest.fn().mockResolvedValue(undefined),
    copy: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(true),
    presignedUrl: jest.fn().mockResolvedValue(null),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DriveService", () => {
  let service: DriveService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;
  let storageMock: ReturnType<typeof buildStorageMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    storageMock = buildStorageMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriveService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: DriveStorageService,
          useValue: storageMock,
        },
      ],
    }).compile();

    service = module.get<DriveService>(DriveService);
  });

  // ─── listItems ─────────────────────────────────────────────────────────────

  describe("listItems", () => {
    it("returns items for org root", async () => {
      const result = await service.listItems(mockActor);
      expect(prismaMock.driveItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: "min-1", parentId: null }),
        }),
      );
      expect(result).toEqual([mockItem]);
    });

    it("filters by parentId when provided", async () => {
      await service.listItems(mockActor, "folder-1");
      expect(prismaMock.driveItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ parentId: "folder-1" }),
        }),
      );
    });
  });

  // ─── getItem ───────────────────────────────────────────────────────────────

  describe("getItem", () => {
    it("returns item and updates lastAccessedAt", async () => {
      const result = await service.getItem("item-1", mockActor);
      expect(prismaMock.driveItem.update).toHaveBeenCalled();
      expect(result).toEqual(mockItem);
    });

    it("throws NotFoundException when item not found", async () => {
      prismaMock.driveItem.findFirst.mockResolvedValueOnce(null);
      await expect(service.getItem("bad-id", mockActor)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── uploadFile ────────────────────────────────────────────────────────────

  describe("uploadFile", () => {
    const mockFile = {
      originalname: "test.pdf",
      mimetype: "application/pdf",
      buffer: Buffer.from("PDF content"),
      size: 11,
      fieldname: "file",
      encoding: "7bit",
    } as Express.Multer.File;

    it("creates item, uploads to storage, creates version, and updates quota", async () => {
      const result = await service.uploadFile(mockActor, mockFile);
      expect(storageMock.upload).toHaveBeenCalled();
      expect(prismaMock.driveItem.create).toHaveBeenCalled();
      expect(prismaMock.driveVersion.create).toHaveBeenCalled();
      expect(prismaMock.driveStorageQuota.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockItem);
    });

    it("throws NotFoundException when parentId folder not found", async () => {
      prismaMock.driveItem.findFirst.mockResolvedValueOnce(null);
      await expect(service.uploadFile(mockActor, mockFile, "bad-folder")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws BadRequestException when storage quota exceeded", async () => {
      prismaMock.driveStorageQuota.findUnique.mockResolvedValueOnce({
        totalBytes: BigInt(100),
        usedBytes: BigInt(100),
      });
      await expect(service.uploadFile(mockActor, mockFile)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── trashItem ─────────────────────────────────────────────────────────────

  describe("trashItem", () => {
    it("sets status to TRASHED and creates recycle bin entry", async () => {
      const result = await service.trashItem("item-1", mockActor);
      expect(prismaMock.driveItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "item-1" },
          data: expect.objectContaining({ status: "TRASHED" }),
        }),
      );
      expect(prismaMock.driveRecycleBin.upsert).toHaveBeenCalled();
      expect(result).toEqual({ trashed: true });
    });

    it("throws NotFoundException when item not found", async () => {
      prismaMock.driveItem.findFirst
        .mockResolvedValueOnce(mockItem) // assertOwnerOrEditor check
        .mockResolvedValueOnce(null); // status check
      await expect(service.trashItem("bad-id", mockActor)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── restoreItem ───────────────────────────────────────────────────────────

  describe("restoreItem", () => {
    it("restores item from recycle bin", async () => {
      prismaMock.driveRecycleBin.findUnique.mockResolvedValueOnce({
        originalParentId: "folder-1",
      });
      const result = await service.restoreItem("item-1", mockActor);
      expect(prismaMock.driveItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "ACTIVE" }),
        }),
      );
      expect(result).toEqual({ restored: true });
    });

    it("throws NotFoundException when not in recycle bin", async () => {
      prismaMock.driveRecycleBin.findUnique.mockResolvedValueOnce(null);
      await expect(service.restoreItem("item-1", mockActor)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── lockItem ──────────────────────────────────────────────────────────────

  describe("lockItem", () => {
    it("creates lock and sets isLocked=true", async () => {
      const result = await service.lockItem("item-1", { reason: "Editing" }, mockActor);
      expect(prismaMock.driveLock.upsert).toHaveBeenCalled();
      expect(prismaMock.driveItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isLocked: true } }),
      );
      expect(result).toEqual({ locked: true });
    });

    it("throws ConflictException when locked by someone else", async () => {
      prismaMock.driveLock.findUnique.mockResolvedValueOnce({
        id: "lock-1",
        lockedById: "other-user",
      });
      const { ConflictException: CE } = await import("@nestjs/common");
      await expect(service.lockItem("item-1", {}, mockActor)).rejects.toThrow(CE);
    });
  });

  // ─── toggleFavorite ────────────────────────────────────────────────────────

  describe("toggleFavorite", () => {
    it("creates favorite when none exists", async () => {
      const result = await service.toggleFavorite("item-1", mockActor);
      expect(prismaMock.driveFavorite.create).toHaveBeenCalled();
      expect(result).toEqual({ favorited: true });
    });

    it("removes favorite when it exists", async () => {
      prismaMock.driveFavorite.findUnique.mockResolvedValueOnce({ id: "fav-1" });
      const result = await service.toggleFavorite("item-1", mockActor);
      expect(prismaMock.driveFavorite.delete).toHaveBeenCalled();
      expect(result).toEqual({ favorited: false });
    });
  });

  // ─── permanentlyDeleteItem ────────────────────────────────────────────────

  describe("permanentlyDeleteItem", () => {
    it("deletes storage objects and marks item as PERMANENTLY_DELETED", async () => {
      prismaMock.driveVersion.findMany.mockResolvedValueOnce([
        { storageKey: "key1" },
        { storageKey: "key2" },
      ]);
      await service.permanentlyDeleteItem("item-1", mockActor);
      expect(storageMock.delete).toHaveBeenCalledTimes(2);
      expect(prismaMock.driveItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "PERMANENTLY_DELETED" },
        }),
      );
    });

    it("throws ForbiddenException when non-owner tries to delete", async () => {
      prismaMock.driveItem.findFirst.mockResolvedValueOnce({
        ...mockItem,
        ownerId: "other-user",
      });
      const nonOwner = { ...mockActor, id: "user-2", role: "EMPLOYEE" } as AuthenticatedUser;
      await expect(service.permanentlyDeleteItem("item-1", nonOwner)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── getQuota ──────────────────────────────────────────────────────────────

  describe("getQuota", () => {
    it("returns or creates quota for org", async () => {
      await service.getQuota(mockActor);
      expect(prismaMock.driveStorageQuota.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "min-1" },
        }),
      );
    });
  });
});
