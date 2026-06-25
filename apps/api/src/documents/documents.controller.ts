import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";

import { DocumentsService } from "./documents.service";
import { ExportService } from "./export.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";

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
import type { Response } from "express";

@Controller("v1/documents")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsService,
    private readonly exportSvc: ExportService,
  ) {}

  // ── List & create ──────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions("DOCUMENT:READ")
  findMany(@Query() query: DocumentQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.findMany(query, actor);
  }

  @Post()
  @RequirePermissions("DOCUMENT:CREATE")
  create(@Body() dto: CreateDocumentDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.create(dto, actor);
  }

  @Get("shared-with-me")
  @RequirePermissions("DOCUMENT:READ")
  sharedWithMe(@CurrentUser() actor: AuthenticatedUser) {
    return this.documents.findSharedWithMe(actor);
  }

  @Get("templates")
  @RequirePermissions("DOCUMENT:READ")
  listTemplates(@CurrentUser() actor: AuthenticatedUser) {
    return this.documents.listTemplates(actor);
  }

  @Post("templates")
  @RequirePermissions("DOCUMENT:MANAGE_TEMPLATES")
  createTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.createTemplate(dto, actor);
  }

  // ── Single document ────────────────────────────────────────────────────────

  @Get(":id")
  @RequirePermissions("DOCUMENT:READ")
  findOne(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.findOne(id, actor);
  }

  @Patch(":id")
  @RequirePermissions("DOCUMENT:UPDATE")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.documents.update(id, dto, actor);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("DOCUMENT:DELETE")
  remove(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.remove(id, actor);
  }

  @Post(":id/publish")
  @RequirePermissions("DOCUMENT:PUBLISH")
  publish(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.publish(id, actor);
  }

  @Post(":id/archive")
  @RequirePermissions("DOCUMENT:UPDATE")
  archive(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.archive(id, actor);
  }

  // ── Versions ───────────────────────────────────────────────────────────────

  @Get(":id/versions")
  @RequirePermissions("DOCUMENT:READ")
  listVersions(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.listVersions(id, actor);
  }

  @Post(":id/versions")
  @RequirePermissions("DOCUMENT:UPDATE")
  saveVersion(
    @Param("id") id: string,
    @Body() dto: SaveVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.documents.saveVersion(id, dto, actor);
  }

  @Get(":id/versions/:version")
  @RequirePermissions("DOCUMENT:READ")
  getVersion(
    @Param("id") id: string,
    @Param("version", ParseIntPipe) version: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.documents.getVersion(id, version, actor);
  }

  @Post(":id/versions/:version/restore")
  @RequirePermissions("DOCUMENT:UPDATE")
  restoreVersion(
    @Param("id") id: string,
    @Param("version", ParseIntPipe) version: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.documents.restoreVersion(id, version, actor);
  }

  // ── Shares ─────────────────────────────────────────────────────────────────

  @Get(":id/shares")
  @RequirePermissions("DOCUMENT:READ")
  listShares(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.listShares(id, actor);
  }

  @Post(":id/shares")
  @RequirePermissions("DOCUMENT:SHARE")
  share(
    @Param("id") id: string,
    @Body() dto: ShareDocumentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.documents.share(id, dto, actor);
  }

  @Delete(":id/shares/:shareId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("DOCUMENT:SHARE")
  removeShare(
    @Param("id") id: string,
    @Param("shareId") shareId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.documents.removeShare(id, shareId, actor);
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  @Get(":id/comments")
  @RequirePermissions("DOCUMENT:READ")
  listComments(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.listComments(id, actor);
  }

  @Post(":id/comments")
  @RequirePermissions("DOCUMENT:READ")
  addComment(
    @Param("id") id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.documents.addComment(id, dto, actor);
  }

  @Delete("comments/:commentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions("DOCUMENT:READ")
  deleteComment(@Param("commentId") commentId: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.deleteComment(commentId, actor);
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  @Post(":id/export/pdf")
  @RequirePermissions("DOCUMENT:EXPORT")
  async exportPdf(
    @Param("id") id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const buf = await this.exportSvc.exportPdf(id, actor);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="document-${id}.pdf"`);
    res.send(buf);
  }

  @Post(":id/export/docx")
  @RequirePermissions("DOCUMENT:EXPORT")
  async exportDocx(
    @Param("id") id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const buf = await this.exportSvc.exportDocx(id, actor);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader("Content-Disposition", `attachment; filename="document-${id}.docx"`);
    res.send(buf);
  }

  // ── Approvals ──────────────────────────────────────────────────────────────

  @Get(":id/approvals")
  @RequirePermissions("DOCUMENT:READ")
  listApprovals(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.documents.listApprovals(id, actor);
  }

  @Post(":id/approvals/request")
  @RequirePermissions("DOCUMENT:UPDATE")
  requestApproval(
    @Param("id") id: string,
    @Body() dto: RequestApprovalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.documents.requestApproval(id, dto, actor);
  }

  @Post(":id/approvals/:approvalId/approve")
  @RequirePermissions("DOCUMENT:APPROVE")
  reviewApproval(
    @Param("id") id: string,
    @Param("approvalId") approvalId: string,
    @Body() dto: ReviewApprovalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.documents.reviewApproval(id, approvalId, dto, actor);
  }
}
