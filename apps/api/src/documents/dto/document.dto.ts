import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import type { DocumentClassification, DocumentStatus, DocumentType } from "@prisma/client";

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsEnum([
    "MEMO",
    "REPORT",
    "CIRCULAR",
    "LETTER",
    "SPEECH",
    "DECREE",
    "DIRECTIVE",
    "NOTE",
    "OTHER",
  ])
  type?: DocumentType;

  @IsOptional()
  @IsEnum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SECRET"])
  classification?: DocumentClassification;

  @IsOptional()
  content?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  templateId?: string;

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
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsEnum([
    "MEMO",
    "REPORT",
    "CIRCULAR",
    "LETTER",
    "SPEECH",
    "DECREE",
    "DIRECTIVE",
    "NOTE",
    "OTHER",
  ])
  type?: DocumentType;

  @IsOptional()
  @IsEnum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SECRET"])
  classification?: DocumentClassification;

  @IsOptional()
  content?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class DocumentQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum([
    "MEMO",
    "REPORT",
    "CIRCULAR",
    "LETTER",
    "SPEECH",
    "DECREE",
    "DIRECTIVE",
    "NOTE",
    "OTHER",
  ])
  type?: DocumentType;

  @IsOptional()
  @IsEnum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SECRET"])
  classification?: DocumentClassification;

  @IsOptional()
  @IsEnum(["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"])
  status?: DocumentStatus;

  @IsOptional()
  @IsString()
  ministryId?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  limit?: number;
}

export class SaveVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}

export class ShareDocumentDto {
  @IsEnum(["USER", "MINISTRY", "DEPARTMENT", "DIVISION"])
  scope!: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  targetMinistryId?: string;

  @IsOptional()
  @IsString()
  targetDepartmentId?: string;

  @IsOptional()
  @IsString()
  targetDivisionId?: string;

  @IsOptional()
  canEdit?: boolean;

  @IsOptional()
  canComment?: boolean;

  @IsOptional()
  canExport?: boolean;
}

export class AddCommentDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  replyToId?: string;
}

export class RequestApprovalDto {
  @IsString()
  approverId!: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ReviewApprovalDto {
  @IsEnum(["APPROVED", "REJECTED"])
  decision!: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum([
    "MEMO",
    "REPORT",
    "CIRCULAR",
    "LETTER",
    "SPEECH",
    "DECREE",
    "DIRECTIVE",
    "NOTE",
    "OTHER",
  ])
  type!: string;

  @IsOptional()
  @IsEnum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SECRET"])
  classification?: string;

  @IsOptional()
  content?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  ministryId?: string;
}
