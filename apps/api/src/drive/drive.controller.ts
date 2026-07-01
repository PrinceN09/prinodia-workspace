/**
 * Prinodia Drive v1.7.0 — DriveController
 *
 * Route layout (all under /v1/drive):
 *
 *   GET    /v1/drive                           list items in root (or ?parentId=)
 *   GET    /v1/drive/recent                    recently accessed items
 *   GET    /v1/drive/favorites                 starred items
 *   GET    /v1/drive/recycle-bin               trashed items
 *   GET    /v1/drive/search                    search items
 *   GET    /v1/drive/quota                     storage quota
 *   GET    /v1/drive/tree                      folder tree
 *
 *   POST   /v1/drive/folders                   create folder
 *   GET    /v1/drive/folders/:id               list folder children
 *   GET    /v1/drive/folders/:id/breadcrumbs   breadcrumb path
 *   PATCH  /v1/drive/folders/:id              rename folder
 *
 *   POST   /v1/drive/upload                    upload file (multipart)
 *   GET    /v1/drive/items/:id                 get item metadata
 *   PATCH  /v1/drive/items/:id                 update item (name, description, isPinned)
 *   DELETE /v1/drive/items/:id                 trash item
 *   POST   /v1/drive/items/:id/restore         restore from recycle bin
 *   DELETE /v1/drive/items/:id/permanent       permanently delete
 *   POST   /v1/drive/items/:id/move            move to new parent
 *   POST   /v1/drive/items/:id/duplicate       duplicate item
 *   GET    /v1/drive/items/:id/download        download file content
 *   POST   /v1/drive/items/:id/favorite        toggle favorite
 *   POST   /v1/drive/items/:id/lock            lock item
 *   DELETE /v1/drive/items/:id/lock            unlock item
 *   POST   /v1/drive/items/:id/checkout        check out item
 *   POST   /v1/drive/items/:id/checkin         check in item
 *
 *   GET    /v1/drive/items/:id/versions        list versions
 *   POST   /v1/drive/items/:id/versions        upload new version (multipart)
 *   POST   /v1/drive/items/:id/versions/restore  restore to a version
 *
 *   GET    /v1/drive/items/:id/permissions     list permissions
 *   POST   /v1/drive/items/:id/permissions     grant permission
 *   DELETE /v1/drive/items/:id/permissions/:permId revoke permission
 *
 *   GET    /v1/drive/items/:id/shares          list share links
 *   POST   /v1/drive/items/:id/shares          create share link
 *   DELETE /v1/drive/items/:id/shares/:shareId revoke share link
 *   GET    /v1/drive/share/:token             resolve public share token
 *
 *   GET    /v1/drive/items/:id/comments        list comments
 *   POST   /v1/drive/items/:id/comments        add comment
 *   POST   /v1/drive/items/:id/comments/:commentId/resolve  resolve comment
 *   DELETE /v1/drive/items/:id/comments/:commentId          delete comment
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { DriveCommentsService } from "./drive-comments.service";
import { DriveFoldersService } from "./drive-folders.service";
import { DrivePermissionsService } from "./drive-permissions.service";
import { DriveSearchService } from "./drive-search.service";
import { DriveSharesService } from "./drive-shares.service";
import { DriveService } from "./drive.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

import type {
  CheckinItemDto,
  CreateCommentDto,
  CreateFolderDto,
  CreateShareLinkDto,
  GrantPermissionDto,
  LockItemDto,
  MoveItemDto,
  RestoreVersionDto,
  SearchDriveDto,
  UpdateItemDto,
} from "./dto/drive.dto";
import type { AuthenticatedUser } from "../common/types/auth.types";
import type { Response } from "express";

@UseGuards(JwtAuthGuard)
@Controller("v1/drive")
export class DriveController {
  constructor(
    private readonly drive: DriveService,
    private readonly folders: DriveFoldersService,
    private readonly permissions: DrivePermissionsService,
    private readonly shares: DriveSharesService,
    private readonly search: DriveSearchService,
    private readonly comments: DriveCommentsService,
  ) {}

  // ─── Root / Discovery ───────────────────────────────────────────────────────

  @Get()
  listItems(
    @Query("parentId") parentId: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.drive.listItems(actor, parentId);
  }

  @Get("recent")
  listRecent(@CurrentUser() actor: AuthenticatedUser) {
    return this.drive.listRecent(actor);
  }

  @Get("favorites")
  listFavorites(@CurrentUser() actor: AuthenticatedUser) {
    return this.drive.listFavorites(actor);
  }

  @Get("recycle-bin")
  listRecycleBin(@CurrentUser() actor: AuthenticatedUser) {
    return this.drive.listRecycleBin(actor);
  }

  @Get("quota")
  getQuota(@CurrentUser() actor: AuthenticatedUser) {
    return this.drive.getQuota(actor);
  }

  @Get("tree")
  getFolderTree(@CurrentUser() actor: AuthenticatedUser) {
    return this.folders.getFolderTree(actor);
  }

  @Get("search")
  searchItems(@Query() dto: SearchDriveDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.search.search(dto, actor);
  }

  // ─── Folders ────────────────────────────────────────────────────────────────

  @Post("folders")
  createFolder(@Body() dto: CreateFolderDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.folders.createFolder(dto, actor);
  }

  @Get("folders/:id")
  listFolderChildren(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.folders.listChildren(id, actor);
  }

  @Get("folders/:id/breadcrumbs")
  getBreadcrumbs(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.folders.getBreadcrumbs(id, actor);
  }

  @Patch("folders/:id")
  renameFolder(
    @Param("id") id: string,
    @Body("name") name: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.folders.renameFolder(id, name, actor);
  }

  // ─── Upload / Items ──────────────────────────────────────────────────────────

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query("parentId") parentId: string | undefined,
    @Query("description") description: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.drive.uploadFile(actor, file, parentId, description);
  }

  @Get("items/:id")
  getItem(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drive.getItem(id, actor);
  }

  @Patch("items/:id")
  updateItem(
    @Param("id") id: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.drive.updateItem(id, dto, actor);
  }

  @Delete("items/:id")
  @HttpCode(HttpStatus.OK)
  trashItem(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drive.trashItem(id, actor);
  }

  @Post("items/:id/restore")
  @HttpCode(HttpStatus.OK)
  restoreItem(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drive.restoreItem(id, actor);
  }

  @Delete("items/:id/permanent")
  @HttpCode(HttpStatus.OK)
  permanentlyDeleteItem(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drive.permanentlyDeleteItem(id, actor);
  }

  @Post("items/:id/move")
  @HttpCode(HttpStatus.OK)
  moveItem(
    @Param("id") id: string,
    @Body() dto: MoveItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.drive.moveItem(id, dto.parentId ?? null, actor);
  }

  @Post("items/:id/duplicate")
  @HttpCode(HttpStatus.CREATED)
  duplicateItem(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drive.duplicateItem(id, actor);
  }

  @Get("items/:id/download")
  async downloadFile(
    @Param("id") id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const result = await this.drive.downloadFile(id, actor);
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(result.filename)}"`,
    );
    res.send(result.buffer);
  }

  @Post("items/:id/favorite")
  @HttpCode(HttpStatus.OK)
  toggleFavorite(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drive.toggleFavorite(id, actor);
  }

  // ─── Lock / Checkout ────────────────────────────────────────────────────────

  @Post("items/:id/lock")
  @HttpCode(HttpStatus.OK)
  lockItem(
    @Param("id") id: string,
    @Body() dto: LockItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.drive.lockItem(id, dto, actor);
  }

  @Delete("items/:id/lock")
  @HttpCode(HttpStatus.OK)
  unlockItem(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drive.unlockItem(id, actor);
  }

  @Post("items/:id/checkout")
  @HttpCode(HttpStatus.OK)
  checkoutItem(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drive.checkoutItem(id, actor);
  }

  @Post("items/:id/checkin")
  @HttpCode(HttpStatus.OK)
  checkinItem(
    @Param("id") id: string,
    @Body() dto: CheckinItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.drive.checkinItem(id, dto, actor);
  }

  // ─── Versions ───────────────────────────────────────────────────────────────

  @Get("items/:id/versions")
  listVersions(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drive.listVersions(id, actor);
  }

  @Post("items/:id/versions")
  @UseInterceptors(FileInterceptor("file"))
  uploadVersion(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query("note") note: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.drive.uploadNewVersion(id, file, note, actor);
  }

  @Post("items/:id/versions/restore")
  @HttpCode(HttpStatus.OK)
  restoreVersion(
    @Param("id") id: string,
    @Body() dto: RestoreVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.drive.restoreVersion(id, dto, actor);
  }

  // ─── Permissions ────────────────────────────────────────────────────────────

  @Get("items/:id/permissions")
  listPermissions(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.permissions.listPermissions(id, actor);
  }

  @Post("items/:id/permissions")
  grantPermission(
    @Param("id") id: string,
    @Body() dto: GrantPermissionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.permissions.grantPermission(id, dto, actor);
  }

  @Delete("items/:id/permissions/:permId")
  @HttpCode(HttpStatus.OK)
  revokePermission(
    @Param("id") id: string,
    @Param("permId") permId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.permissions.revokePermission(id, permId, actor);
  }

  // ─── Shares ──────────────────────────────────────────────────────────────────

  @Get("items/:id/shares")
  listShares(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.shares.listShares(id, actor);
  }

  @Post("items/:id/shares")
  createShare(
    @Param("id") id: string,
    @Body() dto: CreateShareLinkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shares.createShare(id, dto, actor);
  }

  @Delete("items/:id/shares/:shareId")
  @HttpCode(HttpStatus.OK)
  revokeShare(
    @Param("id") id: string,
    @Param("shareId") shareId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.shares.revokeShare(id, shareId, actor);
  }

  @Get("share/:token")
  resolveShareToken(@Param("token") token: string) {
    return this.shares.resolveShareToken(token);
  }

  // ─── Comments ───────────────────────────────────────────────────────────────

  @Get("items/:id/comments")
  listComments(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.comments.listComments(id, actor);
  }

  @Post("items/:id/comments")
  createComment(
    @Param("id") id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.comments.createComment(id, dto, actor);
  }

  @Post("items/:id/comments/:commentId/resolve")
  @HttpCode(HttpStatus.OK)
  resolveComment(
    @Param("id") id: string,
    @Param("commentId") commentId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.comments.resolveComment(id, commentId, actor);
  }

  @Delete("items/:id/comments/:commentId")
  @HttpCode(HttpStatus.OK)
  deleteComment(
    @Param("id") id: string,
    @Param("commentId") commentId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.comments.deleteComment(id, commentId, actor);
  }
}
