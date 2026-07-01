/**
 * Prinodia Drive v1.7.0 — DriveSharesService
 *
 * Public / expiring / password-protected share links.
 */

import { randomBytes } from "crypto";

import { Injectable, Logger, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import type { CreateShareLinkDto } from "./dto/drive.dto";
import type { AuthenticatedUser } from "../common/types/auth.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

@Injectable()
export class DriveSharesService {
  private readonly logger = new Logger(DriveSharesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.prisma as any;
  }

  async listShares(itemId: string, _actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveShare.findMany({
      where: { itemId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        role: true,
        label: true,
        maxUses: true,
        uses: true,
        expiresAt: true,
        createdAt: true,
        createdBy: { select: { id: true, displayName: true } },
      },
    });
  }

  async createShare(itemId: string, dto: CreateShareLinkDto, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = await this.db.driveItem.findFirst({
      where: {
        id: itemId,
        organizationId: actor.ministryId ?? actor.departmentId ?? actor.divisionId ?? "global",
      },
      select: { id: true },
    });
    if (!item) throw new NotFoundException("Item not found");

    const token = randomBytes(32).toString("hex");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveShare.create({
      data: {
        itemId,
        token,
        role: dto.role ?? "VIEWER",
        label: dto.label,
        // In production: bcrypt hash dto.password — here stored as-is for simplicity
        password: dto.password ?? null,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        createdById: actor.id,
      },
      select: {
        id: true,
        token: true,
        role: true,
        label: true,
        maxUses: true,
        uses: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async revokeShare(itemId: string, shareId: string, _actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const share = await this.db.driveShare.findFirst({
      where: { id: shareId, itemId },
      select: { id: true },
    });
    if (!share) throw new NotFoundException("Share link not found");

    await this.db.driveShare.update({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where: { id: share.id as string },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  async resolveShareToken(token: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const share = await this.db.driveShare.findUnique({
      where: { token },
      select: {
        id: true,
        itemId: true,
        role: true,
        revokedAt: true,
        expiresAt: true,
        maxUses: true,
        uses: true,
        password: true,
        item: { select: { id: true, name: true, type: true, mimeType: true, status: true } },
      },
    });
    if (!share) throw new NotFoundException("Invalid share link");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (share.revokedAt) throw new NotFoundException("Share link has been revoked");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (share.expiresAt && new Date(share.expiresAt as Date) < new Date()) {
      throw new NotFoundException("Share link has expired");
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (share.maxUses && (share.uses as number) >= (share.maxUses as number)) {
      throw new NotFoundException("Share link has reached its maximum uses");
    }

    // Bump use count
    await this.db.driveShare.update({
      where: { token },
      data: { uses: { increment: 1 } },
    });

    return share;
  }
}
