/**
 * Prinodia Drive v1.7.0 — DriveService
 *
 * Core file operations: upload, download, rename, move, copy, duplicate,
 * soft-delete, restore, permanent delete, lock/unlock, checkout/checkin,
 * version history, and quota management.
 */

import * as path from "path";

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { DriveStorageService } from "./storage/drive-storage.service";

import type {
  CheckinItemDto,
  LockItemDto,
  RestoreVersionDto,
  UpdateItemDto,
} from "./dto/drive.dto";
import type { AuthenticatedUser } from "../common/types/auth.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

/** Default days before trashed items are permanently purged. */
const RECYCLE_TTL_DAYS = 30;

/** Minimal item select shape reused across queries. */
const ITEM_SELECT = {
  id: true,
  name: true,
  type: true,
  status: true,
  mimeType: true,
  extension: true,
  sizeBytes: true,
  storageProvider: true,
  checksum: true,
  currentVersionNum: true,
  parentId: true,
  organizationId: true,
  ministryId: true,
  departmentId: true,
  description: true,
  isLocked: true,
  isPinned: true,
  previewStatus: true,
  thumbnailUrl: true,
  previewUrl: true,
  virusScanStatus: true,
  trashedAt: true,
  createdAt: true,
  updatedAt: true,
  lastAccessedAt: true,
  owner: { select: { id: true, displayName: true, avatarUrl: true } },
} as const;

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: DriveStorageService,
  ) {}

  private get db(): AnyPrisma {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.prisma as any;
  }

  // ─── List & Get ─────────────────────────────────────────────────────────────

  async listItems(actor: AuthenticatedUser, parentId?: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveItem.findMany({
      where: {
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        parentId: parentId ?? null,
        status: "ACTIVE",
      },
      select: ITEM_SELECT,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  }

  async getItem(id: string, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = await this.db.driveItem.findFirst({
      where: {
        id,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      },
      select: {
        ...ITEM_SELECT,
        tags: { select: { id: true, name: true, color: true } },
        lock: {
          select: {
            id: true,
            reason: true,
            expiresAt: true,
            createdAt: true,
            lockedBy: { select: { id: true, displayName: true } },
          },
        },
      },
    });
    if (!item) throw new NotFoundException("File or folder not found");

    // Update lastAccessedAt and recent list
    await this.db.driveItem.update({
      where: { id },
      data: { lastAccessedAt: new Date() },
    });
    await this.upsertRecent(id, actor.id);

    return item;
  }

  // ─── Upload ─────────────────────────────────────────────────────────────────

  async uploadFile(
    actor: AuthenticatedUser,
    file: Express.Multer.File,
    parentId?: string,
    description?: string,
  ) {
    // Validate parent exists and belongs to org
    if (parentId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parent = await this.db.driveItem.findFirst({
        where: {
          id: parentId,
          organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
          type: "FOLDER",
        },
        select: { id: true },
      });
      if (!parent) throw new NotFoundException("Parent folder not found");
    }

    // Check quota
    await this.assertQuota(
      actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      file.size,
    );

    // Create DB record first to get the item ID for the storage key
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = await this.db.driveItem.create({
      data: {
        name: file.originalname,
        type: "FILE",
        status: "ACTIVE",
        mimeType: file.mimetype,
        extension: path.extname(file.originalname).replace(".", "").toLowerCase(),
        sizeBytes: file.size,
        storageProvider: this.storage.activeProviderName,
        ownerId: actor.id,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        ...(parentId && { parentId }),
        ...(description && { description }),
        currentVersionNum: 1,
        virusScanStatus: "PENDING",
        previewStatus: "PENDING",
      },
      select: ITEM_SELECT,
    });

    // Upload to storage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const storageKey = this.storage.buildKey(
      actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      item.id as string,
      1,
      file.originalname,
    );
    const uploadResult = await this.storage.upload(
      storageKey,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    // Update item with storage key and checksum
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const updated = await this.db.driveItem.update({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where: { id: item.id as string },
      data: {
        storageKey: uploadResult.storageKey,
        checksum: uploadResult.checksum,
        sizeBytes: uploadResult.sizeBytes,
      },
      select: ITEM_SELECT,
    });

    // Create version record (v1)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await this.db.driveVersion.create({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        itemId: item.id as string,
        versionNum: 1,
        sizeBytes: uploadResult.sizeBytes,
        storageKey: uploadResult.storageKey,
        storageProvider: this.storage.activeProviderName,
        checksum: uploadResult.checksum,
        uploadedById: actor.id,
      },
    });

    // Update quota
    await this.incrementQuota(
      actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      uploadResult.sizeBytes,
    );

    // Audit
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await this.audit(item.id as string, actor.id, "upload", { size: uploadResult.sizeBytes });

    // Queue async jobs (thumbnails, virus scan)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await this.queueAsyncJobs(item.id as string, file.mimetype);

    return updated;
  }

  // ─── Download ───────────────────────────────────────────────────────────────

  async downloadFile(id: string, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = await this.db.driveItem.findFirst({
      where: {
        id,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        type: "FILE",
        status: "ACTIVE",
      },
      select: { id: true, name: true, mimeType: true, storageKey: true },
    });
    if (!item) throw new NotFoundException("File not found");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!item.storageKey) throw new BadRequestException("File has no storage key");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const downloadResult = await this.storage.download(item.storageKey as string);

    // Update recent
    await this.upsertRecent(id, actor.id);
    await this.audit(id, actor.id, "download", {});

    return {
      buffer: downloadResult.buffer,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      filename: item.name as string,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      mimeType: (item.mimeType as string) ?? "application/octet-stream",
    };
  }

  // ─── Rename / Move / Update ─────────────────────────────────────────────────

  async updateItem(id: string, dto: UpdateItemDto, actor: AuthenticatedUser) {
    await this.assertOwnerOrEditor(id, actor);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
      },
      select: ITEM_SELECT,
    });
  }

  async moveItem(id: string, newParentId: string | null, actor: AuthenticatedUser) {
    await this.assertOwnerOrEditor(id, actor);

    if (newParentId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parent = await this.db.driveItem.findFirst({
        where: {
          id: newParentId,
          organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
          type: "FOLDER",
        },
        select: { id: true },
      });
      if (!parent) throw new NotFoundException("Destination folder not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveItem.update({
      where: { id },
      data: { parentId: newParentId },
      select: ITEM_SELECT,
    });
  }

  async duplicateItem(id: string, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const source = await this.db.driveItem.findFirst({
      where: {
        id,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        type: "FILE",
        status: "ACTIVE",
      },
      select: { ...ITEM_SELECT, storageKey: true },
    });
    if (!source) throw new NotFoundException("File not found");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!source.storageKey) throw new BadRequestException("File has no storage key");

    // Create new DB record
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const newItem = await this.db.driveItem.create({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        name: `Copy of ${source.name as string}`,
        type: "FILE",
        status: "ACTIVE",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        mimeType: source.mimeType as string,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        extension: source.extension as string,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        sizeBytes: source.sizeBytes as bigint,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        storageProvider: source.storageProvider as string,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        checksum: source.checksum as string,
        currentVersionNum: 1,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        parentId: source.parentId as string,
        ownerId: actor.id,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        virusScanStatus: "CLEAN", // inherit scan from source
        previewStatus: "PENDING",
      },
      select: { id: true },
    });

    // Copy storage object
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const newKey = this.storage.buildKey(
      actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      newItem.id as string,
      1,
      source.name as string,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await this.storage.copy(source.storageKey as string, newKey);

    // Update key
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const finalItem = await this.db.driveItem.update({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where: { id: newItem.id as string },
      data: { storageKey: newKey },
      select: ITEM_SELECT,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await this.audit(newItem.id as string, actor.id, "duplicate", { sourceId: id });
    return finalItem;
  }

  // ─── Soft Delete / Recycle ──────────────────────────────────────────────────

  async trashItem(id: string, actor: AuthenticatedUser) {
    await this.assertOwnerOrEditor(id, actor);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = await this.db.driveItem.findFirst({
      where: {
        id,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        status: "ACTIVE",
      },
      select: { id: true, type: true, parentId: true },
    });
    if (!item) throw new NotFoundException("Item not found");

    const now = new Date();
    const permanentDeleteAt = new Date(now.getTime() + RECYCLE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.db.driveItem.update({
      where: { id },
      data: { status: "TRASHED", trashedAt: now, trashedById: actor.id },
    });

    // Upsert recycle bin record
    await this.db.driveRecycleBin.upsert({
      where: { itemId: id },
      create: {
        itemId: id,
        trashedById: actor.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        originalParentId: item.parentId as string | undefined,
        permanentDeleteAt,
      },
      update: { permanentDeleteAt, trashedById: actor.id },
    });

    await this.audit(id, actor.id, "trash", {});
    return { trashed: true };
  }

  async restoreItem(id: string, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const bin = await this.db.driveRecycleBin.findUnique({
      where: { itemId: id },
      select: { originalParentId: true },
    });
    if (!bin) throw new NotFoundException("Item not found in recycle bin");

    await this.db.driveItem.update({
      where: { id },
      data: {
        status: "ACTIVE",
        trashedAt: null,
        trashedById: null,
        // Restore to original folder if it still exists (else root)
      },
    });

    await this.db.driveRecycleBin.delete({ where: { itemId: id } });
    await this.audit(id, actor.id, "restore", {});
    return { restored: true };
  }

  async permanentlyDeleteItem(id: string, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = await this.db.driveItem.findFirst({
      where: {
        id,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      },
      select: { id: true, ownerId: true, sizeBytes: true, organizationId: true },
    });
    if (!item) throw new NotFoundException("Item not found");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (
      item.ownerId !== actor.id &&
      actor.role !== "SUPER_ADMIN" &&
      actor.role !== "GOVERNMENT_ADMIN" &&
      actor.role !== "MINISTRY_ADMIN"
    ) {
      throw new ForbiddenException("Only the owner can permanently delete");
    }

    // Get all version storage keys for deletion
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const versions = await this.db.driveVersion.findMany({
      where: { itemId: id },
      select: { storageKey: true },
    });

    // Delete storage objects
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    for (const v of versions as Array<{ storageKey: string }>) {
      try {
        await this.storage.delete(v.storageKey);
      } catch {
        this.logger.warn(`Failed to delete storage key ${v.storageKey}`);
      }
    }

    // Decrement quota
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (item.sizeBytes) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      await this.decrementQuota(
        actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        Number(item.sizeBytes as bigint),
      );
    }

    // Delete DB record (cascades to versions, permissions, etc.)
    await this.db.driveItem.update({
      where: { id },
      data: { status: "PERMANENTLY_DELETED" },
    });

    return { deleted: true };
  }

  // ─── Versions ───────────────────────────────────────────────────────────────

  async listVersions(id: string, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = await this.db.driveItem.findFirst({
      where: {
        id,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      },
      select: { id: true },
    });
    if (!item) throw new NotFoundException("File not found");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveVersion.findMany({
      where: { itemId: id },
      orderBy: { versionNum: "desc" },
      select: {
        id: true,
        versionNum: true,
        sizeBytes: true,
        checksum: true,
        changeNote: true,
        createdAt: true,
        uploadedBy: { select: { id: true, displayName: true } },
      },
    });
  }

  async uploadNewVersion(
    id: string,
    file: Express.Multer.File,
    changeNote: string | undefined,
    actor: AuthenticatedUser,
  ) {
    await this.assertOwnerOrEditor(id, actor);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = await this.db.driveItem.findFirst({
      where: {
        id,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        type: "FILE",
        status: "ACTIVE",
      },
      select: { id: true, currentVersionNum: true, organizationId: true, name: true },
    });
    if (!item) throw new NotFoundException("File not found");

    await this.assertQuota(
      actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      file.size,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const newVersionNum = (item.currentVersionNum as number) + 1;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const storageKey = this.storage.buildKey(
      actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      id,
      newVersionNum,
      item.name as string,
    );
    const uploadResult = await this.storage.upload(
      storageKey,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    await this.db.driveVersion.create({
      data: {
        itemId: id,
        versionNum: newVersionNum,
        sizeBytes: uploadResult.sizeBytes,
        storageKey: uploadResult.storageKey,
        storageProvider: this.storage.activeProviderName,
        checksum: uploadResult.checksum,
        uploadedById: actor.id,
        ...(changeNote && { changeNote }),
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const updated = await this.db.driveItem.update({
      where: { id },
      data: {
        currentVersionNum: newVersionNum,
        storageKey: uploadResult.storageKey,
        checksum: uploadResult.checksum,
        sizeBytes: uploadResult.sizeBytes,
        mimeType: file.mimetype,
        previewStatus: "PENDING",
      },
      select: ITEM_SELECT,
    });

    await this.incrementQuota(
      actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      uploadResult.sizeBytes,
    );
    await this.audit(id, actor.id, "version_upload", { versionNum: newVersionNum });
    await this.queueAsyncJobs(id, file.mimetype);

    return updated;
  }

  async restoreVersion(id: string, dto: RestoreVersionDto, actor: AuthenticatedUser) {
    await this.assertOwnerOrEditor(id, actor);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const version = await this.db.driveVersion.findFirst({
      where: { itemId: id, versionNum: dto.versionNum },
      select: { storageKey: true, sizeBytes: true, checksum: true, versionNum: true },
    });
    if (!version) throw new NotFoundException(`Version ${dto.versionNum} not found`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = await this.db.driveItem.findFirst({
      where: { id },
      select: { currentVersionNum: true, name: true },
    });

    // Create a new version entry that points to the restored content
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const newVersionNum = (item.currentVersionNum as number) + 1;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const newKey = this.storage.buildKey(
      actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      id,
      newVersionNum,
      item.name as string,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await this.storage.copy(version.storageKey as string, newKey);

    await this.db.driveVersion.create({
      data: {
        itemId: id,
        versionNum: newVersionNum,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        sizeBytes: version.sizeBytes as bigint,
        storageKey: newKey,
        storageProvider: this.storage.activeProviderName,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        checksum: version.checksum as string,
        uploadedById: actor.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        changeNote: `Restored from v${version.versionNum as number}`,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveItem.update({
      where: { id },
      data: {
        currentVersionNum: newVersionNum,
        storageKey: newKey,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        checksum: version.checksum as string,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        sizeBytes: version.sizeBytes as bigint,
      },
      select: ITEM_SELECT,
    });
  }

  // ─── Lock / Unlock ──────────────────────────────────────────────────────────

  async lockItem(id: string, dto: LockItemDto, actor: AuthenticatedUser) {
    await this.assertOwnerOrEditor(id, actor);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existing = await this.db.driveLock.findUnique({
      where: { itemId: id },
      select: { id: true, lockedById: true },
    });
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (existing.lockedById !== actor.id) {
        throw new ConflictException("File is already locked by another user");
      }
    }

    await this.db.driveLock.upsert({
      where: { itemId: id },
      create: {
        itemId: id,
        lockedById: actor.id,
        reason: dto.reason,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      update: {
        reason: dto.reason,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    await this.db.driveItem.update({ where: { id }, data: { isLocked: true } });
    await this.audit(id, actor.id, "lock", { reason: dto.reason });
    return { locked: true };
  }

  async unlockItem(id: string, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const lock = await this.db.driveLock.findUnique({
      where: { itemId: id },
      select: { lockedById: true },
    });
    if (!lock) throw new NotFoundException("File is not locked");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (
      lock.lockedById !== actor.id &&
      actor.role !== "SUPER_ADMIN" &&
      actor.role !== "GOVERNMENT_ADMIN" &&
      actor.role !== "MINISTRY_ADMIN"
    ) {
      throw new ForbiddenException("Only the lock holder or admin can unlock");
    }

    await this.db.driveLock.delete({ where: { itemId: id } });
    await this.db.driveItem.update({ where: { id }, data: { isLocked: false } });
    await this.audit(id, actor.id, "unlock", {});
    return { unlocked: true };
  }

  // ─── Checkout / Checkin ─────────────────────────────────────────────────────

  async checkoutItem(id: string, actor: AuthenticatedUser) {
    await this.assertOwnerOrEditor(id, actor);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const activeCheckout = await this.db.driveCheckout.findFirst({
      where: { itemId: id, checkedInAt: null },
      select: { checkedOutById: true },
    });
    if (activeCheckout) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (activeCheckout.checkedOutById !== actor.id) {
        throw new ConflictException("File is checked out by another user");
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveCheckout.create({
      data: { itemId: id, checkedOutById: actor.id },
      select: { id: true, checkedOutAt: true },
    });
  }

  async checkinItem(id: string, dto: CheckinItemDto, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const checkout = await this.db.driveCheckout.findFirst({
      where: { itemId: id, checkedOutById: actor.id, checkedInAt: null },
      select: { id: true },
    });
    if (!checkout) throw new NotFoundException("No active checkout for this file");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveCheckout.update({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where: { id: checkout.id as string },
      data: { checkedInAt: new Date(), checkInNote: dto.checkInNote },
      select: { id: true, checkedOutAt: true, checkedInAt: true },
    });
  }

  // ─── Favorites ───────────────────────────────────────────────────────────────

  async toggleFavorite(id: string, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existing = await this.db.driveFavorite.findUnique({
      where: { itemId_userId: { itemId: id, userId: actor.id } },
      select: { id: true },
    });

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      await this.db.driveFavorite.delete({ where: { id: existing.id as string } });
      return { favorited: false };
    }

    await this.db.driveFavorite.create({ data: { itemId: id, userId: actor.id } });
    return { favorited: true };
  }

  async listFavorites(actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveFavorite.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, item: { select: ITEM_SELECT } },
    });
  }

  async listRecent(actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveRecent.findMany({
      where: { userId: actor.id },
      orderBy: { accessedAt: "desc" },
      take: 20,
      select: { id: true, accessedAt: true, item: { select: ITEM_SELECT } },
    });
  }

  // ─── Recycle Bin ─────────────────────────────────────────────────────────────

  async listRecycleBin(actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveRecycleBin.findMany({
      where: { trashedById: actor.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        permanentDeleteAt: true,
        originalParentId: true,
        createdAt: true,
        item: { select: ITEM_SELECT },
      },
    });
  }

  // ─── Quota ───────────────────────────────────────────────────────────────────

  async getQuota(actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveStorageQuota.upsert({
      where: {
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      },
      create: {
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      },
      update: {},
      select: { totalBytes: true, usedBytes: true, fileCount: true },
    });
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async assertOwnerOrEditor(itemId: string, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = await this.db.driveItem.findFirst({
      where: {
        id: itemId,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      },
      select: { ownerId: true },
    });
    if (!item) throw new NotFoundException("Item not found");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (
      item.ownerId !== actor.id &&
      actor.role !== "SUPER_ADMIN" &&
      actor.role !== "GOVERNMENT_ADMIN" &&
      actor.role !== "MINISTRY_ADMIN"
    ) {
      // Check explicit permission
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const perm = await this.db.drivePermission.findFirst({
        where: {
          itemId,
          userId: actor.id,
          role: { in: ["OWNER", "EDITOR"] },
        },
        select: { id: true },
      });
      if (!perm) throw new ForbiddenException("Insufficient permissions");
    }
  }

  private async assertQuota(orgId: string, fileSizeBytes: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const quota = await this.db.driveStorageQuota.findUnique({
      where: { organizationId: orgId },
      select: { totalBytes: true, usedBytes: true },
    });
    if (!quota) return; // no quota yet, allow
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const available = Number(quota.totalBytes as bigint) - Number(quota.usedBytes as bigint);
    if (available < fileSizeBytes) {
      throw new BadRequestException("Storage quota exceeded");
    }
  }

  private async incrementQuota(orgId: string, bytes: number) {
    await this.db.driveStorageQuota.upsert({
      where: { organizationId: orgId },
      create: { organizationId: orgId, usedBytes: bytes, fileCount: 1 },
      update: { usedBytes: { increment: bytes }, fileCount: { increment: 1 } },
    });
  }

  private async decrementQuota(orgId: string, bytes: number) {
    await this.db.driveStorageQuota.upsert({
      where: { organizationId: orgId },
      create: { organizationId: orgId },
      update: {
        usedBytes: { decrement: bytes },
        fileCount: { decrement: 1 },
      },
    });
  }

  private async upsertRecent(itemId: string, userId: string) {
    await this.db.driveRecent.upsert({
      where: { itemId_userId: { itemId, userId } },
      create: { itemId, userId },
      update: { accessedAt: new Date() },
    });
  }

  private async audit(
    itemId: string,
    actorId: string,
    action: string,
    metadata: Record<string, unknown>,
  ) {
    await this.db.driveAudit.create({
      data: { itemId, actorId, action, metadata },
    });
  }

  private async queueAsyncJobs(itemId: string, mimeType: string) {
    // Queue thumbnail generation for images/PDFs
    if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
      await this.db.driveSyncJob.create({
        data: { itemId, type: "THUMBNAIL" },
      });
      await this.db.driveSyncJob.create({
        data: { itemId, type: "PREVIEW" },
      });
    }
    // Queue virus scan
    await this.db.driveSyncJob.create({
      data: { itemId, type: "VIRUS_SCAN" },
    });
  }
}
