/**
 * Prinodia Drive v1.7.0 — DTOs
 */

import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

// ─── Enums (mirrored from Prisma schema for DTO validation) ──────────────────

export enum DriveItemTypeDto {
  FILE = "FILE",
  FOLDER = "FOLDER",
}

export enum DrivePermissionRoleDto {
  OWNER = "OWNER",
  EDITOR = "EDITOR",
  COMMENTER = "COMMENTER",
  VIEWER = "VIEWER",
  GUEST = "GUEST",
}

export enum DriveShareScopeDto {
  USER = "USER",
  DEPARTMENT = "DEPARTMENT",
  MINISTRY = "MINISTRY",
  ORGANIZATION = "ORGANIZATION",
  PUBLIC = "PUBLIC",
}

// ─── Folder DTOs ──────────────────────────────────────────────────────────────

export class CreateFolderDto {
  @IsString()
  @MaxLength(500)
  name!: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class RenameFolderDto {
  @IsString()
  @MaxLength(500)
  name!: string;
}

// ─── File DTOs ────────────────────────────────────────────────────────────────

export class MoveItemDto {
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class RenameItemDto {
  @IsString()
  @MaxLength(500)
  name!: string;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

// ─── Version DTOs ─────────────────────────────────────────────────────────────

export class RestoreVersionDto {
  @IsInt()
  @Min(1)
  versionNum!: number;
}

export class AddVersionNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}

// ─── Permission DTOs ──────────────────────────────────────────────────────────

export class GrantPermissionDto {
  @IsEnum(DrivePermissionRoleDto)
  role!: DrivePermissionRoleDto;

  @IsEnum(DriveShareScopeDto)
  scope!: DriveShareScopeDto;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  ministryId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  divisionId?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string; // ISO date
}

// ─── Share DTOs ───────────────────────────────────────────────────────────────

export class CreateShareLinkDto {
  @IsOptional()
  @IsEnum(DrivePermissionRoleDto)
  role?: DrivePermissionRoleDto;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsString()
  expiresAt?: string; // ISO date
}

// ─── Comment DTOs ─────────────────────────────────────────────────────────────

export class CreateCommentDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  replyToId?: string;
}

// ─── Tag DTOs ─────────────────────────────────────────────────────────────────

export class AddTagDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;
}

// ─── Search DTOs ──────────────────────────────────────────────────────────────

export class SearchDriveDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(DriveItemTypeDto)
  type?: DriveItemTypeDto;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  extension?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsString()
  meetingId?: string;

  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  canvasBoardId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  after?: string; // ISO date

  @IsOptional()
  @IsString()
  before?: string; // ISO date

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}

// ─── Retention Policy DTOs ────────────────────────────────────────────────────

export class CreateRetentionPolicyDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsInt()
  @Min(1)
  retentionDays!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applyToFolderIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applyToMimeTypes?: string[];

  @IsOptional()
  @IsBoolean()
  isLegalHold?: boolean;
}

// ─── Lock / Checkout DTOs ─────────────────────────────────────────────────────

export class LockItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class CheckoutItemDto {
  // empty — no extra fields needed; actor from JWT
}

export class CheckinItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  checkInNote?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
