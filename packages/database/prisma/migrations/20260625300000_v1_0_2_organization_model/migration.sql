-- v1.0.2 Organization Model — Neutral parent model for all org types
-- Safe: all FK columns are nullable — existing data unaffected.

-- Create enums
CREATE TYPE "OrganizationType" AS ENUM (
  'GOVERNMENT', 'ENTERPRISE', 'EDUCATION', 'HEALTHCARE',
  'NGO', 'CHURCH', 'NON_PROFIT', 'OTHER'
);

CREATE TYPE "OrganizationStatus" AS ENUM (
  'ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'
);

-- Create organizations table
CREATE TABLE "organizations" (
  "id"          TEXT NOT NULL,
  "name"        VARCHAR(255) NOT NULL,
  "code"        VARCHAR(50) NOT NULL,
  "type"        "OrganizationType" NOT NULL,
  "status"      "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
  "description" TEXT,
  "email"       VARCHAR(255),
  "phone"       VARCHAR(50),
  "website"     VARCHAR(255),
  "address"     VARCHAR(500),
  "city"        VARCHAR(100),
  "country"     VARCHAR(100),
  "logoUrl"     VARCHAR(500),
  "isDemo"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");
CREATE INDEX "organizations_type_idx" ON "organizations"("type");
CREATE INDEX "organizations_status_idx" ON "organizations"("status");
CREATE INDEX "organizations_isDemo_idx" ON "organizations"("isDemo");

-- Add nullable organizationId FK to ministries
ALTER TABLE "ministries" ADD COLUMN "organizationId" TEXT;
CREATE INDEX "ministries_organizationId_idx" ON "ministries"("organizationId");
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add nullable organizationId FK to departments
ALTER TABLE "departments" ADD COLUMN "organizationId" TEXT;
CREATE INDEX "departments_organizationId_idx" ON "departments"("organizationId");
ALTER TABLE "departments" ADD CONSTRAINT "departments_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add nullable organizationId FK to users
ALTER TABLE "users" ADD COLUMN "organizationId" TEXT;
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
