-- Prinodia Canvas v1.6.0 — Foundation Migration
-- Strategy: fully additive — new tables, new enums, no drops, no renames.
-- Safe to run on an existing v1.5.0 database.

-- ─── 1. New enum types ────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "CanvasBoardType" AS ENUM (
    'WHITEBOARD', 'MEETING_BOARD', 'PROJECT_BOARD', 'DOCUMENT_BOARD',
    'WORKFLOW_BOARD', 'CODE_BOARD', 'DIAGRAM_BOARD', 'BRAINSTORM_BOARD'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CanvasBoardStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CanvasParticipantRole" AS ENUM ('OWNER', 'EDITOR', 'PRESENTER', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CanvasElementType" AS ENUM (
    'PENCIL_STROKE', 'HIGHLIGHTER_STROKE', 'TEXT', 'STICKY_NOTE', 'SHAPE',
    'CONNECTOR', 'ARROW', 'IMAGE', 'PDF', 'DOCUMENT_LINK', 'CODE_BLOCK',
    'TABLE', 'MIND_MAP_NODE', 'FLOWCHART_NODE', 'COMMENT_PIN',
    'LASER_POINTER', 'SCREEN_ANNOTATION'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CanvasExportFormat" AS ENUM ('PNG', 'PDF', 'SVG', 'JSON');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CanvasExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CanvasShareAccess" AS ENUM ('VIEW', 'EDIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. canvas_boards ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "canvas_boards" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL,
  "ownerId"        TEXT NOT NULL,
  "title"          VARCHAR(200) NOT NULL,
  "description"    TEXT,
  "boardType"      "CanvasBoardType" NOT NULL DEFAULT 'WHITEBOARD',
  "status"         "CanvasBoardStatus" NOT NULL DEFAULT 'ACTIVE',
  "meetingId"      TEXT,
  "channelId"      TEXT,
  "documentId"     TEXT,
  "workflowId"     TEXT,
  "templateId"     TEXT,
  "thumbnailUrl"   VARCHAR(500),
  "viewportState"  JSONB NOT NULL DEFAULT '{}',
  "background"     VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
  "isPublic"       BOOLEAN NOT NULL DEFAULT false,
  "isLocked"       BOOLEAN NOT NULL DEFAULT false,
  "elementCount"   INTEGER NOT NULL DEFAULT 0,
  "lastActivityAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "aiEnabled"      BOOLEAN NOT NULL DEFAULT false,
  "aiContext"      JSONB,
  "driveFileId"    VARCHAR(200),
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt"      TIMESTAMPTZ,
  CONSTRAINT "canvas_boards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "canvas_boards_organizationId_idx" ON "canvas_boards"("organizationId");
CREATE INDEX IF NOT EXISTS "canvas_boards_ownerId_idx"        ON "canvas_boards"("ownerId");
CREATE INDEX IF NOT EXISTS "canvas_boards_boardType_idx"      ON "canvas_boards"("boardType");
CREATE INDEX IF NOT EXISTS "canvas_boards_status_idx"         ON "canvas_boards"("status");
CREATE INDEX IF NOT EXISTS "canvas_boards_meetingId_idx"      ON "canvas_boards"("meetingId");
CREATE INDEX IF NOT EXISTS "canvas_boards_channelId_idx"      ON "canvas_boards"("channelId");
CREATE INDEX IF NOT EXISTS "canvas_boards_lastActivityAt_idx" ON "canvas_boards"("lastActivityAt");

DO $$ BEGIN
  ALTER TABLE "canvas_boards"
    ADD CONSTRAINT "canvas_boards_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 3. canvas_participants ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "canvas_participants" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid(),
  "boardId"    TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "role"       "CanvasParticipantRole" NOT NULL DEFAULT 'VIEWER',
  "invitedBy"  TEXT,
  "joinedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastSeenAt" TIMESTAMPTZ,
  "isActive"   BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "canvas_participants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "canvas_participants_boardId_userId_key" UNIQUE ("boardId", "userId")
);

CREATE INDEX IF NOT EXISTS "canvas_participants_userId_idx" ON "canvas_participants"("userId");
CREATE INDEX IF NOT EXISTS "canvas_participants_role_idx"   ON "canvas_participants"("role");

DO $$ BEGIN
  ALTER TABLE "canvas_participants"
    ADD CONSTRAINT "canvas_participants_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "canvas_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "canvas_participants"
    ADD CONSTRAINT "canvas_participants_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 4. canvas_elements ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "canvas_elements" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
  "boardId"     TEXT NOT NULL,
  "createdBy"   TEXT NOT NULL,
  "elementType" "CanvasElementType" NOT NULL,
  "layerIndex"  INTEGER NOT NULL DEFAULT 0,
  "isLocked"    BOOLEAN NOT NULL DEFAULT false,
  "isVisible"   BOOLEAN NOT NULL DEFAULT true,
  "isDeleted"   BOOLEAN NOT NULL DEFAULT false,
  "x"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "y"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "width"       DOUBLE PRECISION,
  "height"      DOUBLE PRECISION,
  "rotation"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "data"        JSONB NOT NULL DEFAULT '{}',
  "style"       JSONB NOT NULL DEFAULT '{}',
  "lockedBy"    TEXT,
  "lockedAt"    TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "canvas_elements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "canvas_elements_boardId_idx"             ON "canvas_elements"("boardId");
CREATE INDEX IF NOT EXISTS "canvas_elements_boardId_isDeleted_idx"   ON "canvas_elements"("boardId", "isDeleted");
CREATE INDEX IF NOT EXISTS "canvas_elements_boardId_layerIndex_idx"  ON "canvas_elements"("boardId", "layerIndex");
CREATE INDEX IF NOT EXISTS "canvas_elements_elementType_idx"         ON "canvas_elements"("elementType");
CREATE INDEX IF NOT EXISTS "canvas_elements_createdBy_idx"           ON "canvas_elements"("createdBy");

DO $$ BEGIN
  ALTER TABLE "canvas_elements"
    ADD CONSTRAINT "canvas_elements_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "canvas_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "canvas_elements"
    ADD CONSTRAINT "canvas_elements_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 5. canvas_element_versions ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "canvas_element_versions" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid(),
  "elementId"  TEXT NOT NULL,
  "editorId"   TEXT NOT NULL,
  "versionNum" INTEGER NOT NULL,
  "data"       JSONB NOT NULL,
  "style"      JSONB NOT NULL,
  "x"          DOUBLE PRECISION NOT NULL,
  "y"          DOUBLE PRECISION NOT NULL,
  "width"      DOUBLE PRECISION,
  "height"     DOUBLE PRECISION,
  "rotation"   DOUBLE PRECISION NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "canvas_element_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "canvas_element_versions_elementId_idx"            ON "canvas_element_versions"("elementId");
CREATE INDEX IF NOT EXISTS "canvas_element_versions_elementId_versionNum_idx" ON "canvas_element_versions"("elementId", "versionNum");

DO $$ BEGIN
  ALTER TABLE "canvas_element_versions"
    ADD CONSTRAINT "canvas_element_versions_elementId_fkey"
    FOREIGN KEY ("elementId") REFERENCES "canvas_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "canvas_element_versions"
    ADD CONSTRAINT "canvas_element_versions_editorId_fkey"
    FOREIGN KEY ("editorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 6. canvas_sessions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "canvas_sessions" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
  "boardId"          TEXT NOT NULL,
  "startedById"      TEXT NOT NULL,
  "startedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "endedAt"          TIMESTAMPTZ,
  "durationSeconds"  INTEGER,
  "participantCount" INTEGER NOT NULL DEFAULT 1,
  "peakParticipants" INTEGER NOT NULL DEFAULT 1,
  "operationCount"   INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "canvas_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "canvas_sessions_boardId_idx"        ON "canvas_sessions"("boardId");
CREATE INDEX IF NOT EXISTS "canvas_sessions_boardId_endedAt_idx" ON "canvas_sessions"("boardId", "endedAt");

DO $$ BEGIN
  ALTER TABLE "canvas_sessions"
    ADD CONSTRAINT "canvas_sessions_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "canvas_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "canvas_sessions"
    ADD CONSTRAINT "canvas_sessions_startedById_fkey"
    FOREIGN KEY ("startedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 7. canvas_comments ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "canvas_comments" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid(),
  "boardId"    TEXT NOT NULL,
  "elementId"  TEXT,
  "authorId"   TEXT NOT NULL,
  "parentId"   TEXT,
  "content"    TEXT NOT NULL,
  "posX"       DOUBLE PRECISION,
  "posY"       DOUBLE PRECISION,
  "isResolved" BOOLEAN NOT NULL DEFAULT false,
  "resolvedBy" TEXT,
  "resolvedAt" TIMESTAMPTZ,
  "isDeleted"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "canvas_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "canvas_comments_boardId_idx"            ON "canvas_comments"("boardId");
CREATE INDEX IF NOT EXISTS "canvas_comments_elementId_idx"          ON "canvas_comments"("elementId");
CREATE INDEX IF NOT EXISTS "canvas_comments_authorId_idx"           ON "canvas_comments"("authorId");
CREATE INDEX IF NOT EXISTS "canvas_comments_boardId_isResolved_idx" ON "canvas_comments"("boardId", "isResolved");

DO $$ BEGIN
  ALTER TABLE "canvas_comments"
    ADD CONSTRAINT "canvas_comments_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "canvas_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "canvas_comments"
    ADD CONSTRAINT "canvas_comments_elementId_fkey"
    FOREIGN KEY ("elementId") REFERENCES "canvas_elements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "canvas_comments"
    ADD CONSTRAINT "canvas_comments_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "canvas_comments"
    ADD CONSTRAINT "canvas_comments_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "canvas_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 8. canvas_templates ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "canvas_templates" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organizationId"   TEXT,
  "createdBy"        TEXT,
  "name"             VARCHAR(200) NOT NULL,
  "description"      TEXT,
  "boardType"        "CanvasBoardType" NOT NULL DEFAULT 'WHITEBOARD',
  "thumbnailUrl"     VARCHAR(500),
  "isPublic"         BOOLEAN NOT NULL DEFAULT false,
  "isSystem"         BOOLEAN NOT NULL DEFAULT false,
  "category"         VARCHAR(100),
  "tags"             TEXT[] NOT NULL DEFAULT '{}',
  "elementsSnapshot" JSONB NOT NULL DEFAULT '[]',
  "useCount"         INTEGER NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "canvas_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "canvas_templates_organizationId_idx"    ON "canvas_templates"("organizationId");
CREATE INDEX IF NOT EXISTS "canvas_templates_boardType_idx"         ON "canvas_templates"("boardType");
CREATE INDEX IF NOT EXISTS "canvas_templates_isPublic_isSystem_idx" ON "canvas_templates"("isPublic", "isSystem");

DO $$ BEGIN
  ALTER TABLE "canvas_templates"
    ADD CONSTRAINT "canvas_templates_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 9. canvas_exports ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "canvas_exports" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid(),
  "boardId"       TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "format"        "CanvasExportFormat" NOT NULL,
  "status"        "CanvasExportStatus" NOT NULL DEFAULT 'PENDING',
  "downloadUrl"   VARCHAR(500),
  "fileSizeBytes" INTEGER,
  "pageRange"     VARCHAR(50),
  "options"       JSONB NOT NULL DEFAULT '{}',
  "errorMessage"  TEXT,
  "expiresAt"     TIMESTAMPTZ,
  "processedAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "canvas_exports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "canvas_exports_boardId_idx"       ON "canvas_exports"("boardId");
CREATE INDEX IF NOT EXISTS "canvas_exports_requestedById_idx" ON "canvas_exports"("requestedById");
CREATE INDEX IF NOT EXISTS "canvas_exports_status_idx"        ON "canvas_exports"("status");

DO $$ BEGIN
  ALTER TABLE "canvas_exports"
    ADD CONSTRAINT "canvas_exports_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "canvas_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "canvas_exports"
    ADD CONSTRAINT "canvas_exports_requestedById_fkey"
    FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 10. canvas_shares ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "canvas_shares" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
  "boardId"     TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "shareToken"  VARCHAR(64) NOT NULL,
  "access"      "CanvasShareAccess" NOT NULL DEFAULT 'VIEW',
  "label"       VARCHAR(100),
  "password"    VARCHAR(200),
  "maxUses"     INTEGER,
  "uses"        INTEGER NOT NULL DEFAULT 0,
  "expiresAt"   TIMESTAMPTZ,
  "revokedAt"   TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "canvas_shares_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "canvas_shares_shareToken_key" UNIQUE ("shareToken")
);

CREATE INDEX IF NOT EXISTS "canvas_shares_boardId_idx"    ON "canvas_shares"("boardId");
CREATE INDEX IF NOT EXISTS "canvas_shares_shareToken_idx" ON "canvas_shares"("shareToken");

DO $$ BEGIN
  ALTER TABLE "canvas_shares"
    ADD CONSTRAINT "canvas_shares_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "canvas_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "canvas_shares"
    ADD CONSTRAINT "canvas_shares_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 11. canvas_presences ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "canvas_presences" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
  "boardId"     TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "socketId"    VARCHAR(100) NOT NULL,
  "cursorX"     DOUBLE PRECISION,
  "cursorY"     DOUBLE PRECISION,
  "viewportX"   DOUBLE PRECISION,
  "viewportY"   DOUBLE PRECISION,
  "zoom"        DOUBLE PRECISION NOT NULL DEFAULT 1,
  "isFollowing" TEXT,
  "color"       VARCHAR(7) NOT NULL,
  "lastSeenAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "canvas_presences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "canvas_presences_boardId_userId_key" UNIQUE ("boardId", "userId")
);

CREATE INDEX IF NOT EXISTS "canvas_presences_boardId_idx"    ON "canvas_presences"("boardId");
CREATE INDEX IF NOT EXISTS "canvas_presences_lastSeenAt_idx" ON "canvas_presences"("lastSeenAt");

DO $$ BEGIN
  ALTER TABLE "canvas_presences"
    ADD CONSTRAINT "canvas_presences_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "canvas_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "canvas_presences"
    ADD CONSTRAINT "canvas_presences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 12. canvas_activities ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "canvas_activities" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid(),
  "boardId"    TEXT NOT NULL,
  "actorId"    TEXT NOT NULL,
  "eventType"  VARCHAR(80) NOT NULL,
  "elementId"  TEXT,
  "summary"    VARCHAR(300) NOT NULL,
  "metadata"   JSONB NOT NULL DEFAULT '{}',
  "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "canvas_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "canvas_activities_boardId_idx"            ON "canvas_activities"("boardId");
CREATE INDEX IF NOT EXISTS "canvas_activities_boardId_occurredAt_idx" ON "canvas_activities"("boardId", "occurredAt");
CREATE INDEX IF NOT EXISTS "canvas_activities_actorId_idx"            ON "canvas_activities"("actorId");

DO $$ BEGIN
  ALTER TABLE "canvas_activities"
    ADD CONSTRAINT "canvas_activities_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "canvas_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "canvas_activities"
    ADD CONSTRAINT "canvas_activities_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
