/**
 * Prinodia Drive v1.7.0 — DriveCommentsService
 */

import { Injectable, Logger, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import type { CreateCommentDto } from "./dto/drive.dto";
import type { AuthenticatedUser } from "../common/types/auth.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = any;

@Injectable()
export class DriveCommentsService {
  private readonly logger = new Logger(DriveCommentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get db(): AnyPrisma {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.prisma as any;
  }

  async listComments(itemId: string, _actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveComment.findMany({
      where: { itemId, replyToId: null, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async createComment(itemId: string, dto: CreateCommentDto, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveComment.create({
      data: {
        itemId,
        authorId: actor.id,
        content: dto.content,
        ...(dto.replyToId && { replyToId: dto.replyToId }),
      },
      select: {
        id: true,
        content: true,
        replyToId: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async resolveComment(itemId: string, commentId: string, _actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const comment = await this.db.driveComment.findFirst({
      where: { id: commentId, itemId },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException("Comment not found");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.db.driveComment.update({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where: { id: comment.id as string },
      data: { resolvedAt: new Date() },
      select: { id: true, resolvedAt: true },
    });
  }

  async deleteComment(itemId: string, commentId: string, actor: AuthenticatedUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const comment = await this.db.driveComment.findFirst({
      where: { id: commentId, itemId, authorId: actor.id },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException("Comment not found or not yours");

    await this.db.driveComment.update({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where: { id: comment.id as string },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }
}
