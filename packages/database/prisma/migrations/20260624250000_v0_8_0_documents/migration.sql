-- GovSphere v0.8.0 — Documents & Writer Platform Migration

-- ─── New enums ────────────────────────────────────────────────────────────────

CREATE TYPE "DocumentClassification" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET');
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "DocumentType" AS ENUM ('MEMO', 'REPORT', 'CIRCULAR', 'LETTER', 'SPEECH', 'DECREE', 'DIRECTIVE', 'NOTE', 'OTHER');
CREATE TYPE "DocumentShareScope" AS ENUM ('USER', 'MINISTRY', 'DEPARTMENT', 'DIVISION');
CREATE TYPE "DocumentExportFormat" AS ENUM ('PDF', 'DOCX');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ─── New AuditAction values ───────────────────────────────────────────────────

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_DELETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_PUBLISHED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_SHARED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_UNSHARED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_EXPORTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_VERSION_SAVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_VERSION_RESTORED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_COMMENT_ADDED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_COMMENT_DELETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_APPROVAL_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_TEMPLATE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_TEMPLATE_UPDATED';

-- ─── document_templates (referenced by documents) ────────────────────────────

CREATE TABLE "document_templates" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name"           VARCHAR(255) NOT NULL,
  "description"    TEXT,
  "type"           "DocumentType" NOT NULL,
  "classification" "DocumentClassification" NOT NULL DEFAULT 'INTERNAL',
  "content"        JSONB NOT NULL DEFAULT '{}',
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "createdById"    TEXT NOT NULL,
  "ministryId"     TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_templates_type_idx" ON "document_templates"("type");
CREATE INDEX "document_templates_ministryId_idx" ON "document_templates"("ministryId");

ALTER TABLE "document_templates"
  ADD CONSTRAINT "document_templates_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "document_templates_ministryId_fkey"
    FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── documents ────────────────────────────────────────────────────────────────

CREATE TABLE "documents" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid(),
  "title"          VARCHAR(500) NOT NULL,
  "slug"           VARCHAR(500) NOT NULL,
  "type"           "DocumentType" NOT NULL DEFAULT 'OTHER',
  "status"         "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "classification" "DocumentClassification" NOT NULL DEFAULT 'INTERNAL',
  "content"        JSONB NOT NULL DEFAULT '{}',
  "contentText"    TEXT,
  "wordCount"      INTEGER NOT NULL DEFAULT 0,
  "templateId"     TEXT,
  "authorId"       TEXT NOT NULL,
  "ministryId"     TEXT,
  "departmentId"   TEXT,
  "divisionId"     TEXT,
  "tags"           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "deletedAt"      TIMESTAMP(3),
  "deletedById"    TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "documents_slug_key" ON "documents"("slug");
CREATE INDEX "documents_authorId_idx" ON "documents"("authorId");
CREATE INDEX "documents_status_idx" ON "documents"("status");
CREATE INDEX "documents_classification_idx" ON "documents"("classification");
CREATE INDEX "documents_ministryId_idx" ON "documents"("ministryId");
CREATE INDEX "documents_type_idx" ON "documents"("type");
CREATE INDEX "documents_createdAt_idx" ON "documents"("createdAt");
CREATE INDEX "documents_deletedAt_idx" ON "documents"("deletedAt");

ALTER TABLE "documents"
  ADD CONSTRAINT "documents_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "documents_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "documents_ministryId_fkey"
    FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "documents_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "documents_divisionId_fkey"
    FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── document_versions ───────────────────────────────────────────────────────

CREATE TABLE "document_versions" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
  "documentId"  TEXT NOT NULL,
  "version"     INTEGER NOT NULL,
  "title"       VARCHAR(500) NOT NULL,
  "content"     JSONB NOT NULL,
  "contentText" TEXT,
  "wordCount"   INTEGER NOT NULL DEFAULT 0,
  "savedById"   TEXT NOT NULL,
  "changeNote"  VARCHAR(500),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_versions_documentId_version_key" ON "document_versions"("documentId", "version");
CREATE INDEX "document_versions_documentId_idx" ON "document_versions"("documentId");
CREATE INDEX "document_versions_createdAt_idx" ON "document_versions"("createdAt");

ALTER TABLE "document_versions"
  ADD CONSTRAINT "document_versions_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "document_versions_savedById_fkey"
    FOREIGN KEY ("savedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── document_shares ─────────────────────────────────────────────────────────

CREATE TABLE "document_shares" (
  "id"                 TEXT NOT NULL DEFAULT gen_random_uuid(),
  "documentId"         TEXT NOT NULL,
  "scope"              "DocumentShareScope" NOT NULL,
  "targetUserId"       TEXT,
  "targetMinistryId"   TEXT,
  "targetDepartmentId" TEXT,
  "targetDivisionId"   TEXT,
  "canEdit"            BOOLEAN NOT NULL DEFAULT false,
  "canComment"         BOOLEAN NOT NULL DEFAULT true,
  "canExport"          BOOLEAN NOT NULL DEFAULT false,
  "sharedById"         TEXT NOT NULL,
  "expiresAt"          TIMESTAMP(3),
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_shares_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_shares_documentId_idx" ON "document_shares"("documentId");
CREATE INDEX "document_shares_targetUserId_idx" ON "document_shares"("targetUserId");
CREATE INDEX "document_shares_targetMinistryId_idx" ON "document_shares"("targetMinistryId");
CREATE INDEX "document_shares_targetDepartmentId_idx" ON "document_shares"("targetDepartmentId");
CREATE INDEX "document_shares_targetDivisionId_idx" ON "document_shares"("targetDivisionId");

ALTER TABLE "document_shares"
  ADD CONSTRAINT "document_shares_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "document_shares_targetUserId_fkey"
    FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "document_shares_sharedById_fkey"
    FOREIGN KEY ("sharedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "document_shares_targetMinistryId_fkey"
    FOREIGN KEY ("targetMinistryId") REFERENCES "ministries"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "document_shares_targetDepartmentId_fkey"
    FOREIGN KEY ("targetDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "document_shares_targetDivisionId_fkey"
    FOREIGN KEY ("targetDivisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── document_comments ───────────────────────────────────────────────────────

CREATE TABLE "document_comments" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid(),
  "documentId"   TEXT NOT NULL,
  "authorId"     TEXT NOT NULL,
  "content"      TEXT NOT NULL,
  "replyToId"    TEXT,
  "resolvedAt"   TIMESTAMP(3),
  "resolvedById" TEXT,
  "deletedAt"    TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_comments_documentId_idx" ON "document_comments"("documentId");
CREATE INDEX "document_comments_authorId_idx" ON "document_comments"("authorId");

ALTER TABLE "document_comments"
  ADD CONSTRAINT "document_comments_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "document_comments_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "document_comments_replyToId_fkey"
    FOREIGN KEY ("replyToId") REFERENCES "document_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── document_exports ────────────────────────────────────────────────────────

CREATE TABLE "document_exports" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid(),
  "documentId"   TEXT NOT NULL,
  "format"       "DocumentExportFormat" NOT NULL,
  "versionId"    TEXT,
  "exportedById" TEXT NOT NULL,
  "fileSize"     INTEGER,
  "storageKey"   VARCHAR(500),
  "expiresAt"    TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_exports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_exports_documentId_idx" ON "document_exports"("documentId");
CREATE INDEX "document_exports_exportedById_idx" ON "document_exports"("exportedById");

ALTER TABLE "document_exports"
  ADD CONSTRAINT "document_exports_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "document_exports_exportedById_fkey"
    FOREIGN KEY ("exportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── document_approvals ──────────────────────────────────────────────────────

CREATE TABLE "document_approvals" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid(),
  "documentId"    TEXT NOT NULL,
  "approverId"    TEXT NOT NULL,
  "status"        "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "requestedById" TEXT NOT NULL,
  "comment"       TEXT,
  "reviewedAt"    TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_approvals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_approvals_documentId_idx" ON "document_approvals"("documentId");
CREATE INDEX "document_approvals_approverId_idx" ON "document_approvals"("approverId");
CREATE INDEX "document_approvals_status_idx" ON "document_approvals"("status");

ALTER TABLE "document_approvals"
  ADD CONSTRAINT "document_approvals_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "document_approvals_approverId_fkey"
    FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "document_approvals_requestedById_fkey"
    FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
