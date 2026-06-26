-- Prinodia Workspace v1.0.2 — Organization Model Generalization
-- Migration: 20260625300000_v1_0_2_organization_model
--
-- Adds a neutral Organization model that supports governments, enterprises,
-- schools, hospitals, NGOs, churches, and other organization types.
--
-- BACKWARD COMPATIBILITY:
--   - Ministry table is NOT renamed or removed.
--   - All existing ministryId foreign keys are preserved.
--   - New organizationId FKs are nullable — no existing rows are broken.
--   - Data migration: each existing Ministry gets a corresponding Organization
--     record (type = GOVERNMENT), and ministries.organization_id is backfilled.

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "OrganizationType" AS ENUM (
  'GOVERNMENT',
  'ENTERPRISE',
  'EDUCATION',
  'HEALTHCARE',
  'NGO',
  'CHURCH',
  'NON_PROFIT',
  'OTHER'
);

CREATE TYPE "OrganizationStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'ARCHIVED'
);

-- ─── organizations table ──────────────────────────────────────────────────────

CREATE TABLE "organizations" (
  "id"          TEXT        NOT NULL,
  "name"        VARCHAR(255) NOT NULL,
  "code"        VARCHAR(100) NOT NULL,
  "type"        "OrganizationType"   NOT NULL DEFAULT 'OTHER',
  "status"      "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
  "description" TEXT,
  "email"       VARCHAR(255),
  "phone"       VARCHAR(50),
  "website"     VARCHAR(500),
  "address"     TEXT,
  "city"        VARCHAR(100),
  "country"     VARCHAR(100),
  "logoUrl"     VARCHAR(500),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");
CREATE INDEX "organizations_type_idx"   ON "organizations"("type");
CREATE INDEX "organizations_status_idx" ON "organizations"("status");
CREATE INDEX "organizations_code_idx"   ON "organizations"("code");

-- ─── Add organizationId to ministries ────────────────────────────────────────

ALTER TABLE "ministries"
  ADD COLUMN "organizationId" TEXT;

ALTER TABLE "ministries"
  ADD CONSTRAINT "ministries_organizationId_fkey"
  FOREIGN KEY ("organizationId")
  REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ministries_organizationId_idx" ON "ministries"("organizationId");

-- ─── Add organizationId to departments (non-govt direct link) ────────────────

ALTER TABLE "departments"
  ADD COLUMN "organizationId" TEXT;

ALTER TABLE "departments"
  ADD CONSTRAINT "departments_organizationId_fkey"
  FOREIGN KEY ("organizationId")
  REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "departments_organizationId_idx" ON "departments"("organizationId");

-- ─── Add organizationId to users (non-govt direct link) ──────────────────────

ALTER TABLE "users"
  ADD COLUMN "organizationId" TEXT;

ALTER TABLE "users"
  ADD CONSTRAINT "users_organizationId_fkey"
  FOREIGN KEY ("organizationId")
  REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- ─── Data migration: backfill existing Ministries → Organizations ─────────────
-- For each existing ministry, create a matching Organization record (GOVERNMENT)
-- and link ministries.organization_id back to it.

DO $$
DECLARE
  ministry_rec RECORD;
  new_org_id   TEXT;
BEGIN
  FOR ministry_rec IN
    SELECT id, name, code, description, "logoUrl", "createdAt", "updatedAt"
    FROM ministries
    WHERE "organizationId" IS NULL
  LOOP
    -- Generate a cuid-compatible ID (prefixed with 'org_' + ministry id)
    new_org_id := 'org_' || ministry_rec.id;

    INSERT INTO organizations (
      "id", "name", "code", "type", "status",
      "description", "logoUrl", "createdAt", "updatedAt"
    ) VALUES (
      new_org_id,
      ministry_rec.name,
      'ORG-' || LEFT(ministry_rec.code, 90),
      'GOVERNMENT',
      'ACTIVE',
      ministry_rec.description,
      ministry_rec."logoUrl",
      ministry_rec."createdAt",
      ministry_rec."updatedAt"
    )
    ON CONFLICT ("code") DO NOTHING;

    -- Link the ministry to its new organization
    UPDATE ministries
    SET "organizationId" = new_org_id
    WHERE id = ministry_rec.id;
  END LOOP;
END;
$$;
