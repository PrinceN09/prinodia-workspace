import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { AuditService } from "../identity/audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";

import type {
  AddCommentDto,
  CreateDocumentDto,
  CreateTemplateDto,
  DocumentQueryDto,
  RequestApprovalDto,
  ReviewApprovalDto,
  SaveVersionDto,
  ShareDocumentDto,
  UpdateDocumentDto,
} from "./dto/document.dto";
import type { AuthenticatedUser } from "../common/types/auth.types";
import type { AuditAction, Prisma } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base}-${id.slice(-8)}`;
}

function extractText(content: Record<string, unknown>): string {
  const parts: string[] = [];
  function walk(node: Record<string, unknown>) {
    if (node["type"] === "text" && typeof node["text"] === "string") {
      parts.push(node["text"]);
    }
    if (Array.isArray(node["content"])) {
      for (const child of node["content"] as Record<string, unknown>[]) {
        walk(child);
      }
    }
  }
  walk(content);
  return parts.join(" ");
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const DOC_SELECT = {
  id: true,
  title: true,
  slug: true,
  type: true,
  status: true,
  classification: true,
  wordCount: true,
  tags: true,
  ministryId: true,
  departmentId: true,
  divisionId: true,
  templateId: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, displayName: true, avatarUrl: true } },
  ministry: { select: { id: true, name: true, code: true } },
  department: { select: { id: true, name: true, code: true } },
} satisfies Prisma.DocumentSelect;

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateDocumentDto, actor: AuthenticatedUser) {
    const id = crypto.randomUUID();
    const content = (dto.content as Record<string, unknown>) ?? { type: "doc", content: [] };
    const text = extractText(content);
    const words = countWords(text);

    const doc = await this.prisma.document.create({
      data: {
        id,
        title: dto.title,
        slug: toSlug(dto.title, id),
        type: dto.type ?? "OTHER",
        classification: dto.classification ?? "INTERNAL",
        content: content as Prisma.InputJsonValue,
        contentText: text,
        wordCount: words,
        authorId: actor.id,
        ...(dto.templateId ? { templateId: dto.templateId } : {}),
        ...(dto.ministryId ? { ministryId: dto.ministryId } : {}),
        ...(dto.departmentId ? { departmentId: dto.departmentId } : {}),
        ...(dto.divisionId ? { divisionId: dto.divisionId } : {}),
        tags: dto.tags ?? [],
      },
      select: { ...DOC_SELECT, content: true },
    });

    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_CREATED" as AuditAction,
      entityType: "document",
      entityId: doc.id,
      metadata: { title: dto.title, classification: doc.classification },
    });

    return doc;
  }

  // ── List ──────────────────────────────────────────────────────────────────

  async findMany(query: DocumentQueryDto, actor: AuthenticatedUser) {
    const limit = Math.min(Number(query.limit ?? 25), 100);
    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
      OR: [
        { authorId: actor.id },
        {
          shares: {
            some: {
              OR: [
                { targetUserId: actor.id },
                ...(actor.ministryId ? [{ targetMinistryId: actor.ministryId }] : []),
                ...(actor.departmentId ? [{ targetDepartmentId: actor.departmentId }] : []),
              ],
            },
          },
        },
      ],
      ...(query.type ? { type: query.type } : {}),
      ...(query.classification ? { classification: query.classification } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.ministryId ? { ministryId: query.ministryId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { contentText: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    if (query.cursor) {
      (where as Record<string, unknown>)["id"] = { gt: query.cursor };
    }

    const docs = await this.prisma.document.findMany({
      where,
      take: limit + 1,
      orderBy: { updatedAt: "desc" },
      select: DOC_SELECT,
    });

    const hasMore = docs.length > limit;
    return {
      data: hasMore ? docs.slice(0, limit) : docs,
      nextCursor: hasMore ? docs[limit - 1]?.id : null,
      hasMore,
    };
  }

  // ── Shared with me ────────────────────────────────────────────────────────

  async findSharedWithMe(actor: AuthenticatedUser) {
    const shares = await this.prisma.documentShare.findMany({
      where: {
        OR: [
          { targetUserId: actor.id },
          ...(actor.ministryId ? [{ targetMinistryId: actor.ministryId }] : []),
          ...(actor.departmentId ? [{ targetDepartmentId: actor.departmentId }] : []),
        ],
        document: { deletedAt: null, authorId: { not: actor.id } },
      },
      select: {
        id: true,
        canEdit: true,
        canExport: true,
        canComment: true,
        createdAt: true,
        sharedBy: { select: { id: true, displayName: true, avatarUrl: true } },
        document: { select: DOC_SELECT },
      },
      orderBy: { createdAt: "desc" },
    });
    return shares;
  }

  // ── Find one ──────────────────────────────────────────────────────────────

  async findOne(id: string, actor: AuthenticatedUser) {
    const doc = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
      select: { ...DOC_SELECT, content: true },
    });

    if (!doc) throw new NotFoundException("Document introuvable.");
    await this.assertAccess(id, actor, "read");
    return doc;
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateDocumentDto, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "write");

    const updateData: Prisma.DocumentUpdateInput = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.classification !== undefined) updateData.classification = dto.classification;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.content !== undefined) {
      const text = extractText(dto.content);
      updateData.content = dto.content as Prisma.InputJsonValue;
      updateData.contentText = text;
      updateData.wordCount = countWords(text);
    }

    const doc = await this.prisma.document.update({
      where: { id },
      data: updateData,
      select: { ...DOC_SELECT, content: true },
    });

    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_UPDATED" as AuditAction,
      entityType: "document",
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });

    return doc;
  }

  // ── Soft delete ───────────────────────────────────────────────────────────

  async remove(id: string, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "write");
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actor.id },
    });
    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_DELETED" as AuditAction,
      entityType: "document",
      entityId: id,
    });
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async publish(id: string, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "write");
    const doc = await this.prisma.document.update({
      where: { id },
      data: { status: "PUBLISHED" },
      select: DOC_SELECT,
    });
    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_PUBLISHED" as AuditAction,
      entityType: "document",
      entityId: id,
    });
    return doc;
  }

  // ── Archive ───────────────────────────────────────────────────────────────

  async archive(id: string, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "write");
    const doc = await this.prisma.document.update({
      where: { id },
      data: { status: "ARCHIVED" },
      select: DOC_SELECT,
    });
    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_ARCHIVED" as AuditAction,
      entityType: "document",
      entityId: id,
    });
    return doc;
  }

  // ── Versions ──────────────────────────────────────────────────────────────

  async saveVersion(id: string, dto: SaveVersionDto, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "write");

    const doc = await this.prisma.document.findUniqueOrThrow({
      where: { id },
      select: {
        title: true,
        content: true,
        contentText: true,
        wordCount: true,
        _count: { select: { versions: true } },
      },
    });

    const version = await this.prisma.documentVersion.create({
      data: {
        documentId: id,
        version: doc._count.versions + 1,
        title: doc.title,
        content: doc.content as Prisma.InputJsonValue,
        ...(doc.contentText !== null ? { contentText: doc.contentText } : {}),
        wordCount: doc.wordCount,
        savedById: actor.id,
        ...(dto.changeNote ? { changeNote: dto.changeNote } : {}),
      },
    });

    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_VERSION_SAVED" as AuditAction,
      entityType: "document",
      entityId: id,
      metadata: { version: version.version },
    });
    return version;
  }

  async listVersions(id: string, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "read");
    return this.prisma.documentVersion.findMany({
      where: { documentId: id },
      select: {
        id: true,
        version: true,
        title: true,
        wordCount: true,
        changeNote: true,
        createdAt: true,
        savedBy: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { version: "desc" },
    });
  }

  async getVersion(id: string, versionNumber: number, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "read");
    const v = await this.prisma.documentVersion.findUnique({
      where: { documentId_version: { documentId: id, version: versionNumber } },
    });
    if (!v) throw new NotFoundException("Version introuvable.");
    return v;
  }

  async restoreVersion(id: string, versionNumber: number, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "write");
    const v = await this.getVersion(id, versionNumber, actor);

    const text = extractText(v.content as Record<string, unknown>);
    await this.prisma.document.update({
      where: { id },
      data: {
        title: v.title,
        content: v.content as Prisma.InputJsonValue,
        contentText: text,
        wordCount: countWords(text),
      },
    });

    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_VERSION_RESTORED" as AuditAction,
      entityType: "document",
      entityId: id,
      metadata: { version: versionNumber },
    });
    return { ok: true };
  }

  // ── Shares ────────────────────────────────────────────────────────────────

  async share(id: string, dto: ShareDocumentDto, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "write");

    const share = await this.prisma.documentShare.create({
      data: {
        documentId: id,
        scope: dto.scope as "USER" | "MINISTRY" | "DEPARTMENT" | "DIVISION",
        sharedById: actor.id,
        canEdit: dto.canEdit ?? false,
        canComment: dto.canComment ?? true,
        canExport: dto.canExport ?? false,
        ...(dto.targetUserId ? { targetUserId: dto.targetUserId } : {}),
        ...(dto.targetMinistryId ? { targetMinistryId: dto.targetMinistryId } : {}),
        ...(dto.targetDepartmentId ? { targetDepartmentId: dto.targetDepartmentId } : {}),
        ...(dto.targetDivisionId ? { targetDivisionId: dto.targetDivisionId } : {}),
      },
    });

    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_SHARED" as AuditAction,
      entityType: "document",
      entityId: id,
      metadata: { ...dto },
    });
    return share;
  }

  async listShares(id: string, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "read");
    return this.prisma.documentShare.findMany({
      where: { documentId: id },
      include: {
        targetUser: { select: { id: true, displayName: true, avatarUrl: true } },
        targetMinistry: { select: { id: true, name: true } },
        targetDepartment: { select: { id: true, name: true } },
        targetDivision: { select: { id: true, name: true } },
        sharedBy: { select: { id: true, displayName: true } },
      },
    });
  }

  async removeShare(id: string, shareId: string, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "write");
    await this.prisma.documentShare.delete({ where: { id: shareId } });
    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_UNSHARED" as AuditAction,
      entityType: "document",
      entityId: id,
      metadata: { shareId },
    });
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  async addComment(id: string, dto: AddCommentDto, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "read");
    const comment = await this.prisma.documentComment.create({
      data: {
        documentId: id,
        authorId: actor.id,
        content: dto.content,
        ...(dto.replyToId ? { replyToId: dto.replyToId } : {}),
      },
      include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_COMMENT_ADDED" as AuditAction,
      entityType: "document",
      entityId: id,
    });
    return comment;
  }

  async listComments(id: string, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "read");
    return this.prisma.documentComment.findMany({
      where: { documentId: id, deletedAt: null, replyToId: null },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        replies: {
          where: { deletedAt: null },
          include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async deleteComment(commentId: string, actor: AuthenticatedUser) {
    const comment = await this.prisma.documentComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException("Commentaire introuvable.");
    if (comment.authorId !== actor.id) throw new ForbiddenException("Pas autorisé.");
    await this.prisma.documentComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_COMMENT_DELETED" as AuditAction,
      entityType: "document",
      entityId: comment.documentId,
    });
  }

  // ── Templates ─────────────────────────────────────────────────────────────

  async createTemplate(dto: CreateTemplateDto, actor: AuthenticatedUser) {
    const template = await this.prisma.documentTemplate.create({
      data: {
        name: dto.name,
        type: dto.type as "MEMO",
        classification: (dto.classification as "INTERNAL") ?? "INTERNAL",
        content: (dto.content as Prisma.InputJsonValue) ?? {},
        createdById: actor.id,
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.ministryId ? { ministryId: dto.ministryId } : {}),
      },
    });
    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_TEMPLATE_CREATED" as AuditAction,
      entityType: "document_template",
      entityId: template.id,
      metadata: { name: dto.name },
    });
    return template;
  }

  listTemplates(_actor: AuthenticatedUser) {
    return this.prisma.documentTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        classification: true,
        createdAt: true,
        ministry: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  // ── Approvals ─────────────────────────────────────────────────────────────

  async requestApproval(id: string, dto: RequestApprovalDto, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "write");
    const approval = await this.prisma.documentApproval.create({
      data: {
        documentId: id,
        approverId: dto.approverId,
        requestedById: actor.id,
        ...(dto.comment ? { comment: dto.comment } : {}),
      },
      include: { approver: { select: { id: true, displayName: true } } },
    });
    await this.prisma.document.update({ where: { id }, data: { status: "REVIEW" } });
    this.audit.log({
      userId: actor.id,
      action: "DOCUMENT_APPROVAL_REQUESTED" as AuditAction,
      entityType: "document",
      entityId: id,
      metadata: { approverId: dto.approverId },
    });
    return approval;
  }

  async reviewApproval(
    id: string,
    approvalId: string,
    dto: ReviewApprovalDto,
    actor: AuthenticatedUser,
  ) {
    const approval = await this.prisma.documentApproval.findFirst({
      where: { id: approvalId, documentId: id, approverId: actor.id },
    });
    if (!approval) throw new NotFoundException("Approbation introuvable.");

    const action = (
      dto.decision === "APPROVED" ? "DOCUMENT_APPROVED" : "DOCUMENT_REJECTED"
    ) as AuditAction;
    const updated = await this.prisma.documentApproval.update({
      where: { id: approvalId },
      data: {
        status: dto.decision as "APPROVED" | "REJECTED",
        reviewedAt: new Date(),
        ...(dto.comment ? { comment: dto.comment } : {}),
      },
    });

    if (dto.decision === "APPROVED") {
      await this.prisma.document.update({ where: { id }, data: { status: "APPROVED" } });
    }

    this.audit.log({ userId: actor.id, action, entityType: "document", entityId: id });
    return updated;
  }

  async listApprovals(id: string, actor: AuthenticatedUser) {
    await this.assertAccess(id, actor, "read");
    return this.prisma.documentApproval.findMany({
      where: { documentId: id },
      include: {
        approver: { select: { id: true, displayName: true, avatarUrl: true } },
        requestedBy: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Access guard ──────────────────────────────────────────────────────────

  private async assertAccess(docId: string, actor: AuthenticatedUser, mode: "read" | "write") {
    const doc = await this.prisma.document.findFirst({
      where: { id: docId, deletedAt: null },
      select: { authorId: true, ministryId: true, departmentId: true, divisionId: true },
    });
    if (!doc) throw new NotFoundException("Document introuvable.");
    if (doc.authorId === actor.id) return; // author always has full access

    // Check explicit share
    const share = await this.prisma.documentShare.findFirst({
      where: {
        documentId: docId,
        OR: [
          { targetUserId: actor.id },
          ...(actor.ministryId ? [{ targetMinistryId: actor.ministryId }] : []),
          ...(actor.departmentId ? [{ targetDepartmentId: actor.departmentId }] : []),
        ],
      },
    });

    if (!share) throw new ForbiddenException("Accès refusé à ce document.");
    if (mode === "write" && !share.canEdit)
      throw new ForbiddenException("Vous ne pouvez pas modifier ce document.");
  }
}
