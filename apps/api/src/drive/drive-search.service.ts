/**
 * Prinodia Drive v1.7.0 — DriveSearchService
 *
 * Full-text + filtered search across Drive items.
 * Searches: name, extension, owner, dept, meeting, canvas, tags, dates.
 */

import { Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import type { SearchDriveDto } from "./dto/drive.dto";
import type { AuthenticatedUser } from "../common/types/auth.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

const SEARCH_SELECT = {
  id: true,
  name: true,
  type: true,
  status: true,
  mimeType: true,
  extension: true,
  sizeBytes: true,
  parentId: true,
  thumbnailUrl: true,
  previewStatus: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, displayName: true } },
} as const;

@Injectable()
export class DriveSearchService {
  private readonly logger = new Logger(DriveSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.prisma as any;
  }

  async search(dto: SearchDriveDto, actor: AuthenticatedUser) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build dynamic where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      status: "ACTIVE",
    };

    if (dto.q) {
      where["name"] = { contains: dto.q, mode: "insensitive" };
    }
    if (dto.type) {
      where["type"] = dto.type;
    }
    if (dto.mimeType) {
      where["mimeType"] = { contains: dto.mimeType, mode: "insensitive" };
    }
    if (dto.extension) {
      where["extension"] = { equals: dto.extension.toLowerCase() };
    }
    if (dto.ownerId) {
      where["ownerId"] = dto.ownerId;
    }
    if (dto.folderId) {
      where["parentId"] = dto.folderId;
    }
    if (dto.meetingId) {
      where["meetingId"] = dto.meetingId;
    }
    if (dto.channelId) {
      where["channelId"] = dto.channelId;
    }
    if (dto.canvasBoardId) {
      where["canvasBoardId"] = dto.canvasBoardId;
    }
    if (dto.after ?? dto.before) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dateFilter: Record<string, any> = {};
      if (dto.after) dateFilter["gte"] = new Date(dto.after);
      if (dto.before) dateFilter["lte"] = new Date(dto.before);
      where["createdAt"] = dateFilter;
    }
    if (dto.tags && dto.tags.length > 0) {
      where["tags"] = { some: { name: { in: dto.tags } } };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [items, total] = await Promise.all([
      this.db.driveItem.findMany({
        where,
        select: SEARCH_SELECT,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      this.db.driveItem.count({ where }),
    ]);

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      items,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      total,
      page,
      limit,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      pages: Math.ceil((total as number) / limit),
    };
  }
}
