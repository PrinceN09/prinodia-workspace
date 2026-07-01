-- =============================================================================
-- Prinodia Drive v1.7.0 — Foundation Migration
-- Secure enterprise file system powering every Prinodia product.
-- =============================================================================

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "DriveItemType" AS ENUM ('FILE', 'FOLDER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DriveItemStatus" AS ENUM ('ACTIVE', 'TRASHED', 'PERMANENTLY_DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DrivePermissionRole" AS ENUM ('OWNER', 'EDITOR', 'COMMENTER', 'VIEWER', 'GUEST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DriveShareScope" AS ENUM ('USER', 'DEPARTMENT', 'MINISTRY', 'ORGANIZATION', 'PUBLIC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DriveStorageProviderType" AS ENUM ('LOCAL', 'S3', 'AZURE_BLOB', 'GCS', 'MINIO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DrivePreviewStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'UNSUPPORTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DriveVirusScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'ERROR', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DriveSyncJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DriveSyncJobType" AS ENUM ('THUMBNAIL', 'PREVIEW', 'VIRUS_SCAN', 'VERSION_CLEANUP', 'RECYCLE_PURGE', 'QUOTA_RECALC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── drive_items ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_items" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"              VARCHAR(500) NOT NULL,
  "type"              "DriveItemType" NOT NULL,
  "status"            "DriveItemStatus" NOT NULL DEFAULT 'ACTIVE',
  "mimeType"          VARCHAR(200),
  "extension"         VARCHAR(50),
  "sizeBytes"         BIGINT,
  "storageKey"        VARCHAR(1000),
  "storageProvider"   "DriveStorageProviderType" NOT NULL DEFAULT 'LOCAL',
  "checksum"          VARCHAR(128),
  "currentVersionNum" INTEGER NOT NULL DEFAULT 1,
  "parentId"          TEXT,
  "ownerId"           TEXT NOT NULL,
  "organizationId"    TEXT NOT NULL,
  "ministryId"        TEXT,
  "departmentId"      TEXT,
  "divisionId"        TEXT,
  "meetingId"         TEXT,
  "channelId"         TEXT,
  "canvasBoardId"     TEXT,
  "workflowId"        TEXT,
  "description"       TEXT,
  "isLocked"          BOOLEAN NOT NULL DEFAULT false,
  "isPinned"          BOOLEAN NOT NULL DEFAULT false,
  "previewStatus"     "DrivePreviewStatus" NOT NULL DEFAULT 'PENDING',
  "thumbnailUrl"      VARCHAR(500),
  "previewUrl"        VARCHAR(500),
  "virusScanStatus"   "DriveVirusScanStatus" NOT NULL DEFAULT 'PENDING',
  "virusScanAt"       TIMESTAMP(3),
  "trashedAt"         TIMESTAMP(3),
  "trashedById"       TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAccessedAt"    TIMESTAMP(3),
  CONSTRAINT "drive_items_pkey" PRIMARY KEY ("id")
);

-- FK: parent folder (self-referential)
DO $$ BEGIN
  ALTER TABLE "drive_items"
    ADD CONSTRAINT "drive_items_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "drive_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FK: owner
DO $$ BEGIN
  ALTER TABLE "drive_items"
    ADD CONSTRAINT "drive_items_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FK: trashedBy
DO $$ BEGIN
  ALTER TABLE "drive_items"
    ADD CONSTRAINT "drive_items_trashedById_fkey"
    FOREIGN KEY ("trashedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "drive_items_organizationId_idx" ON "drive_items"("organizationId");
CREATE INDEX IF NOT EXISTS "drive_items_ownerId_idx" ON "drive_items"("ownerId");
CREATE INDEX IF NOT EXISTS "drive_items_parentId_idx" ON "drive_items"("parentId");
CREATE INDEX IF NOT EXISTS "drive_items_type_idx" ON "drive_items"("type");
CREATE INDEX IF NOT EXISTS "drive_items_status_idx" ON "drive_items"("status");
CREATE INDEX IF NOT EXISTS "drive_items_mimeType_idx" ON "drive_items"("mimeType");
CREATE INDEX IF NOT EXISTS "drive_items_meetingId_idx" ON "drive_items"("meetingId");
CREATE INDEX IF NOT EXISTS "drive_items_channelId_idx" ON "drive_items"("channelId");
CREATE INDEX IF NOT EXISTS "drive_items_canvasBoardId_idx" ON "drive_items"("canvasBoardId");
CREATE INDEX IF NOT EXISTS "drive_items_workflowId_idx" ON "drive_items"("workflowId");
CREATE INDEX IF NOT EXISTS "drive_items_trashedAt_idx" ON "drive_items"("trashedAt");
CREATE INDEX IF NOT EXISTS "drive_items_createdAt_idx" ON "drive_items"("createdAt");
CREATE INDEX IF NOT EXISTS "drive_items_org_status_idx" ON "drive_items"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "drive_items_org_type_status_idx" ON "drive_items"("organizationId", "type", "status");

-- ─── drive_versions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_versions" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"          TEXT NOT NULL,
  "versionNum"      INTEGER NOT NULL,
  "sizeBytes"       BIGINT,
  "storageKey"      VARCHAR(1000) NOT NULL,
  "storageProvider" "DriveStorageProviderType" NOT NULL DEFAULT 'LOCAL',
  "checksum"        VARCHAR(128),
  "changeNote"      VARCHAR(500),
  "uploadedById"    TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drive_versions_itemId_versionNum_key" UNIQUE ("itemId", "versionNum")
);

DO $$ BEGIN
  ALTER TABLE "drive_versions"
    ADD CONSTRAINT "drive_versions_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "drive_versions"
    ADD CONSTRAINT "drive_versions_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_versions_itemId_idx" ON "drive_versions"("itemId");
CREATE INDEX IF NOT EXISTS "drive_versions_uploadedById_idx" ON "drive_versions"("uploadedById");

-- ─── drive_permissions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_permissions" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"         TEXT NOT NULL,
  "role"           "DrivePermissionRole" NOT NULL,
  "scope"          "DriveShareScope" NOT NULL,
  "userId"         TEXT,
  "ministryId"     TEXT,
  "departmentId"   TEXT,
  "divisionId"     TEXT,
  "organizationId" TEXT,
  "grantedById"    TEXT NOT NULL,
  "expiresAt"      TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_permissions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "drive_permissions"
    ADD CONSTRAINT "drive_permissions_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "drive_permissions"
    ADD CONSTRAINT "drive_permissions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_permissions_itemId_idx" ON "drive_permissions"("itemId");
CREATE INDEX IF NOT EXISTS "drive_permissions_userId_idx" ON "drive_permissions"("userId");
CREATE INDEX IF NOT EXISTS "drive_permissions_itemId_userId_idx" ON "drive_permissions"("itemId", "userId");

-- ─── drive_shares ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_shares" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"      TEXT NOT NULL,
  "token"       VARCHAR(64) NOT NULL,
  "role"        "DrivePermissionRole" NOT NULL DEFAULT 'VIEWER',
  "label"       VARCHAR(100),
  "password"    VARCHAR(200),
  "maxUses"     INTEGER,
  "uses"        INTEGER NOT NULL DEFAULT 0,
  "expiresAt"   TIMESTAMP(3),
  "revokedAt"   TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_shares_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drive_shares_token_key" UNIQUE ("token")
);

DO $$ BEGIN
  ALTER TABLE "drive_shares"
    ADD CONSTRAINT "drive_shares_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "drive_shares"
    ADD CONSTRAINT "drive_shares_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_shares_itemId_idx" ON "drive_shares"("itemId");
CREATE INDEX IF NOT EXISTS "drive_shares_token_idx" ON "drive_shares"("token");

-- ─── drive_favorites ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_favorites" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_favorites_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drive_favorites_itemId_userId_key" UNIQUE ("itemId", "userId")
);

DO $$ BEGIN
  ALTER TABLE "drive_favorites"
    ADD CONSTRAINT "drive_favorites_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "drive_favorites"
    ADD CONSTRAINT "drive_favorites_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_favorites_userId_idx" ON "drive_favorites"("userId");

-- ─── drive_recent ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_recent" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"     TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_recent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drive_recent_itemId_userId_key" UNIQUE ("itemId", "userId")
);

DO $$ BEGIN
  ALTER TABLE "drive_recent"
    ADD CONSTRAINT "drive_recent_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "drive_recent"
    ADD CONSTRAINT "drive_recent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_recent_userId_accessedAt_idx" ON "drive_recent"("userId", "accessedAt");

-- ─── drive_tags ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_tags" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"      TEXT NOT NULL,
  "name"        VARCHAR(100) NOT NULL,
  "color"       VARCHAR(7),
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_tags_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drive_tags_itemId_name_key" UNIQUE ("itemId", "name")
);

DO $$ BEGIN
  ALTER TABLE "drive_tags"
    ADD CONSTRAINT "drive_tags_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_tags_itemId_idx" ON "drive_tags"("itemId");
CREATE INDEX IF NOT EXISTS "drive_tags_name_idx" ON "drive_tags"("name");

-- ─── drive_comments ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_comments" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"     TEXT NOT NULL,
  "authorId"   TEXT NOT NULL,
  "content"    TEXT NOT NULL,
  "replyToId"  TEXT,
  "resolvedAt" TIMESTAMP(3),
  "deletedAt"  TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_comments_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "drive_comments"
    ADD CONSTRAINT "drive_comments_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "drive_comments"
    ADD CONSTRAINT "drive_comments_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "drive_comments"
    ADD CONSTRAINT "drive_comments_replyToId_fkey"
    FOREIGN KEY ("replyToId") REFERENCES "drive_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_comments_itemId_idx" ON "drive_comments"("itemId");
CREATE INDEX IF NOT EXISTS "drive_comments_authorId_idx" ON "drive_comments"("authorId");

-- ─── drive_audits ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_audits" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"    TEXT NOT NULL,
  "actorId"   TEXT NOT NULL,
  "action"    VARCHAR(100) NOT NULL,
  "metadata"  JSONB NOT NULL DEFAULT '{}',
  "ipAddress" VARCHAR(50),
  "userAgent" VARCHAR(300),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_audits_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "drive_audits"
    ADD CONSTRAINT "drive_audits_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "drive_audits"
    ADD CONSTRAINT "drive_audits_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_audits_itemId_idx" ON "drive_audits"("itemId");
CREATE INDEX IF NOT EXISTS "drive_audits_actorId_idx" ON "drive_audits"("actorId");
CREATE INDEX IF NOT EXISTS "drive_audits_action_idx" ON "drive_audits"("action");
CREATE INDEX IF NOT EXISTS "drive_audits_createdAt_idx" ON "drive_audits"("createdAt");

-- ─── drive_retention_policies ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_retention_policies" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"             VARCHAR(255) NOT NULL,
  "organizationId"   TEXT NOT NULL,
  "retentionDays"    INTEGER NOT NULL,
  "applyToFolderIds" TEXT[] NOT NULL DEFAULT '{}',
  "applyToMimeTypes" TEXT[] NOT NULL DEFAULT '{}',
  "isActive"         BOOLEAN NOT NULL DEFAULT true,
  "isLegalHold"      BOOLEAN NOT NULL DEFAULT false,
  "createdById"      TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_retention_policies_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "drive_retention_policies"
    ADD CONSTRAINT "drive_retention_policies_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_retention_policies_organizationId_idx" ON "drive_retention_policies"("organizationId");

-- ─── drive_storage_quotas ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_storage_quotas" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL,
  "totalBytes"     BIGINT NOT NULL DEFAULT 10737418240,
  "usedBytes"      BIGINT NOT NULL DEFAULT 0,
  "fileCount"      INTEGER NOT NULL DEFAULT 0,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_storage_quotas_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drive_storage_quotas_organizationId_key" UNIQUE ("organizationId")
);

-- ─── drive_thumbnails ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_thumbnails" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"     TEXT NOT NULL,
  "size"       VARCHAR(10) NOT NULL,
  "width"      INTEGER NOT NULL,
  "height"     INTEGER NOT NULL,
  "storageKey" VARCHAR(1000) NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_thumbnails_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drive_thumbnails_itemId_size_key" UNIQUE ("itemId", "size")
);

DO $$ BEGIN
  ALTER TABLE "drive_thumbnails"
    ADD CONSTRAINT "drive_thumbnails_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_thumbnails_itemId_idx" ON "drive_thumbnails"("itemId");

-- ─── drive_previews ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_previews" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"    TEXT NOT NULL,
  "status"    "DrivePreviewStatus" NOT NULL DEFAULT 'PENDING',
  "url"       VARCHAR(500),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_previews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drive_previews_itemId_key" UNIQUE ("itemId")
);

DO $$ BEGIN
  ALTER TABLE "drive_previews"
    ADD CONSTRAINT "drive_previews_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── drive_locks ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_locks" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"     TEXT NOT NULL,
  "lockedById" TEXT NOT NULL,
  "reason"     VARCHAR(500),
  "expiresAt"  TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_locks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drive_locks_itemId_key" UNIQUE ("itemId")
);

DO $$ BEGIN
  ALTER TABLE "drive_locks"
    ADD CONSTRAINT "drive_locks_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "drive_locks"
    ADD CONSTRAINT "drive_locks_lockedById_fkey"
    FOREIGN KEY ("lockedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── drive_checkouts ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_checkouts" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"         TEXT NOT NULL,
  "checkedOutById" TEXT NOT NULL,
  "checkedOutAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkedInAt"    TIMESTAMP(3),
  "checkInNote"    VARCHAR(500),
  CONSTRAINT "drive_checkouts_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "drive_checkouts"
    ADD CONSTRAINT "drive_checkouts_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "drive_checkouts"
    ADD CONSTRAINT "drive_checkouts_checkedOutById_fkey"
    FOREIGN KEY ("checkedOutById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_checkouts_itemId_idx" ON "drive_checkouts"("itemId");
CREATE INDEX IF NOT EXISTS "drive_checkouts_checkedOutById_idx" ON "drive_checkouts"("checkedOutById");

-- ─── drive_virus_scans ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_virus_scans" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"    TEXT NOT NULL,
  "status"    "DriveVirusScanStatus" NOT NULL DEFAULT 'PENDING',
  "engine"    VARCHAR(100),
  "scannedAt" TIMESTAMP(3),
  "result"    JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_virus_scans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drive_virus_scans_itemId_key" UNIQUE ("itemId")
);

DO $$ BEGIN
  ALTER TABLE "drive_virus_scans"
    ADD CONSTRAINT "drive_virus_scans_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── drive_sync_jobs ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_sync_jobs" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"      TEXT,
  "type"        "DriveSyncJobType" NOT NULL,
  "status"      "DriveSyncJobStatus" NOT NULL DEFAULT 'PENDING',
  "metadata"    JSONB NOT NULL DEFAULT '{}',
  "error"       TEXT,
  "startedAt"   TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_sync_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "drive_sync_jobs_type_status_idx" ON "drive_sync_jobs"("type", "status");
CREATE INDEX IF NOT EXISTS "drive_sync_jobs_itemId_idx" ON "drive_sync_jobs"("itemId");
CREATE INDEX IF NOT EXISTS "drive_sync_jobs_createdAt_idx" ON "drive_sync_jobs"("createdAt");

-- ─── drive_recycle_bin ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drive_recycle_bin" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "itemId"            TEXT NOT NULL,
  "trashedById"       TEXT NOT NULL,
  "originalParentId"  TEXT,
  "permanentDeleteAt" TIMESTAMP(3) NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_recycle_bin_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drive_recycle_bin_itemId_key" UNIQUE ("itemId")
);

DO $$ BEGIN
  ALTER TABLE "drive_recycle_bin"
    ADD CONSTRAINT "drive_recycle_bin_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "drive_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "drive_recycle_bin"
    ADD CONSTRAINT "drive_recycle_bin_trashedById_fkey"
    FOREIGN KEY ("trashedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "drive_recycle_bin_trashedById_idx" ON "drive_recycle_bin"("trashedById");
CREATE INDEX IF NOT EXISTS "drive_recycle_bin_permanentDeleteAt_idx" ON "drive_recycle_bin"("permanentDeleteAt");
