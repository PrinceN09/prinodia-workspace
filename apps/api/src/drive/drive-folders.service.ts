/**
 * Prinodia Drive v1.7.0 — DriveFoldersService
 *
 * Folder management: create, rename, move, list breadcrumbs, list children.
 */

import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import type { CreateFolderDto } from "./dto/drive.dto";
import type { AuthenticatedUser } from "../common/types/auth.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

const FOLDER_SELECT = {
  id: true,
  name: true,
  type: true,
  status: true,
  parentId: true,
  organizationId: true,
  description: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, displayName: true } },
  _count: { select: { children: true } },
} as const;

@Injectable()
export class DriveFoldersService {
  private readonly logger = new Logger(DriveFoldersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.prisma as any;
  }

  async createFolder(dto: CreateFolderDto, actor: AuthenticatedUser) {
    // Validate parent
    if (dto.parentId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parent = await this.db.driveItem.findFirst({
        where: {
          id: dto.parentId,
          organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
          type: "FOLDER",
          status: "ACTIVE",
        },
        select: { id: true },
      });
      if (!parent) throw new NotFoundException("Parent folder not found");
    }

    // Check for name collision in same parent
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existing = await this.db.driveItem.findFirst({
      where: {
        name: dto.name,
        parentId: dto.parentId ?? null,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        type: "FOLDER",
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException(`A folder named "${dto.name}" already exists here`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveItem.create({
      data: {
        name: dto.name,
        type: "FOLDER",
        status: "ACTIVE",
        ownerId: actor.id,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        ...(dto.parentId && { parentId: dto.parentId }),
        ...(dto.description && { description: dto.description }),
        virusScanStatus: "SKIPPED",
        previewStatus: "UNSUPPORTED",
      },
      select: FOLDER_SELECT,
    });
  }

  async listChildren(folderId: string, actor: AuthenticatedUser) {
    // Verify folder exists
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const folder = await this.db.driveItem.findFirst({
      where: {
        id: folderId,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        type: "FOLDER",
      },
      select: { id: true },
    });
    if (!folder) throw new NotFoundException("Folder not found");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveItem.findMany({
      where: {
        parentId: folderId,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        status: "ACTIVE",
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: {
        ...FOLDER_SELECT,
        mimeType: true,
        extension: true,
        sizeBytes: true,
        thumbnailUrl: true,
        previewStatus: true,
      },
    });
  }

  async getBreadcrumbs(folderId: string, actor: AuthenticatedUser): Promise<unknown[]> {
    const crumbs: unknown[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-await-in-loop
      const item = await this.db.driveItem.findFirst({
        where: {
          id: currentId,
          organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        },
        select: { id: true, name: true, parentId: true, type: true },
      });
      if (!item) break;
      crumbs.unshift(item);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      currentId = item.parentId as string | null;
    }

    return crumbs;
  }

  async getFolderTree(actor: AuthenticatedUser) {
    // Return top-level folders; frontend builds tree recursively
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveItem.findMany({
      where: {
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        type: "FOLDER",
        parentId: null,
        status: "ACTIVE",
      },
      orderBy: { name: "asc" },
      select: {
        ...FOLDER_SELECT,
        children: {
          where: { type: "FOLDER", status: "ACTIVE" },
          orderBy: { name: "asc" },
          select: { id: true, name: true, parentId: true, _count: { select: { children: true } } },
        },
      },
    });
  }

  async renameFolder(id: string, name: string, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const folder = await this.db.driveItem.findFirst({
      where: {
        id,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
        type: "FOLDER",
      },
      select: { id: true, parentId: true },
    });
    if (!folder) throw new NotFoundException("Folder not found");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveItem.update({
      where: { id },
      data: { name },
      select: FOLDER_SELECT,
    });
  }
}
