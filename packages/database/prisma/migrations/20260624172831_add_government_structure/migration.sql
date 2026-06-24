-- GovSphere v0.3.0 — Government Structure Migration
-- Adds: Province, Office, Position, EmployeeAssignment, PositionLevel enum
-- Extends: Division (nameTranslations, description), AuditAction enum

-- ============================================================================
-- 1. Extend AuditAction enum
-- ============================================================================
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM (
  'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'LOGOUT_ALL',
  'TOKEN_REFRESH', 'TOKEN_INVALID',
  'MFA_ENABLED', 'MFA_DISABLED', 'MFA_CHALLENGE_SUCCESS', 'MFA_CHALLENGE_FAILED', 'MFA_BACKUP_CODE_USED',
  'PASSWORD_CHANGED', 'PASSWORD_CHANGED_BY_ADMIN', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET', 'PASSWORD_EXPIRED',
  'USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'USER_SUSPENDED', 'USER_REACTIVATED', 'USER_UNLOCKED', 'ACCOUNT_LOCKED',
  'ROLE_ASSIGNED', 'ROLE_REMOVED', 'PERMISSION_CHANGED',
  'SESSION_CREATED', 'SESSION_REVOKED',
  'FILE_UPLOADED', 'FILE_DOWNLOADED', 'FILE_DELETED',
  'MESSAGE_SENT', 'MESSAGE_DELETED',
  'CHANNEL_CREATED', 'CHANNEL_DELETED',
  -- Government Structure
  'MINISTRY_CREATED', 'MINISTRY_UPDATED', 'MINISTRY_DEACTIVATED',
  'DEPARTMENT_CREATED', 'DEPARTMENT_UPDATED', 'DEPARTMENT_DEACTIVATED',
  'DIVISION_CREATED', 'DIVISION_UPDATED', 'DIVISION_DEACTIVATED',
  'PROVINCE_CREATED', 'PROVINCE_UPDATED',
  'OFFICE_CREATED', 'OFFICE_UPDATED',
  'POSITION_CREATED', 'POSITION_UPDATED', 'POSITION_DEACTIVATED',
  'EMPLOYEE_ASSIGNED', 'EMPLOYEE_ASSIGNMENT_ENDED'
);
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

-- ============================================================================
-- 2. Create PositionLevel enum
-- ============================================================================
CREATE TYPE "PositionLevel" AS ENUM (
  'EXECUTIVE',
  'DIRECTOR',
  'MANAGER',
  'SPECIALIST',
  'OFFICER',
  'SUPPORT'
);

-- ============================================================================
-- 3. Extend divisions table
-- ============================================================================
ALTER TABLE "divisions"
  ADD COLUMN "nameTranslations" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "description"      TEXT;

-- ============================================================================
-- 4. Create provinces table
-- ============================================================================
CREATE TABLE "provinces" (
  "id"               TEXT         NOT NULL,
  "name"             VARCHAR(255) NOT NULL,
  "nameTranslations" JSONB        NOT NULL DEFAULT '{}',
  "code"             VARCHAR(10)  NOT NULL,
  "capital"          VARCHAR(255),
  "isActive"         BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");
CREATE INDEX "provinces_code_idx" ON "provinces"("code");

-- ============================================================================
-- 5. Create offices table
-- ============================================================================
CREATE TABLE "offices" (
  "id"         TEXT         NOT NULL,
  "provinceId" TEXT         NOT NULL,
  "ministryId" TEXT,
  "name"       VARCHAR(255) NOT NULL,
  "code"       VARCHAR(50)  NOT NULL,
  "address"    TEXT,
  "isActive"   BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,

  CONSTRAINT "offices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "offices_provinceId_code_key" ON "offices"("provinceId", "code");
CREATE INDEX "offices_provinceId_idx" ON "offices"("provinceId");
CREATE INDEX "offices_ministryId_idx" ON "offices"("ministryId");

ALTER TABLE "offices"
  ADD CONSTRAINT "offices_provinceId_fkey"
    FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "offices"
  ADD CONSTRAINT "offices_ministryId_fkey"
    FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- 6. Create positions table
-- ============================================================================
CREATE TABLE "positions" (
  "id"               TEXT            NOT NULL,
  "title"            VARCHAR(255)    NOT NULL,
  "titleTranslations" JSONB          NOT NULL DEFAULT '{}',
  "code"             VARCHAR(50)     NOT NULL,
  "level"            "PositionLevel" NOT NULL DEFAULT 'OFFICER',
  "headcount"        INTEGER         NOT NULL DEFAULT 1,
  "ministryId"       TEXT,
  "departmentId"     TEXT,
  "divisionId"       TEXT,
  "officeId"         TEXT,
  "isActive"         BOOLEAN         NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3)    NOT NULL,

  CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "positions_ministryId_code_key" ON "positions"("ministryId", "code");
CREATE INDEX "positions_ministryId_idx" ON "positions"("ministryId");
CREATE INDEX "positions_departmentId_idx" ON "positions"("departmentId");
CREATE INDEX "positions_divisionId_idx" ON "positions"("divisionId");
CREATE INDEX "positions_level_idx" ON "positions"("level");

ALTER TABLE "positions"
  ADD CONSTRAINT "positions_ministryId_fkey"
    FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "positions"
  ADD CONSTRAINT "positions_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "positions"
  ADD CONSTRAINT "positions_divisionId_fkey"
    FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "positions"
  ADD CONSTRAINT "positions_officeId_fkey"
    FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- 7. Create employee_assignments table
-- ============================================================================
CREATE TABLE "employee_assignments" (
  "id"           TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "positionId"   TEXT         NOT NULL,
  "startDate"    TIMESTAMP(3) NOT NULL,
  "endDate"      TIMESTAMP(3),
  "isPrimary"    BOOLEAN      NOT NULL DEFAULT true,
  "isActive"     BOOLEAN      NOT NULL DEFAULT true,
  "notes"        TEXT,
  "assignedById" TEXT         NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "employee_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "employee_assignments_userId_idx" ON "employee_assignments"("userId");
CREATE INDEX "employee_assignments_positionId_idx" ON "employee_assignments"("positionId");
CREATE INDEX "employee_assignments_isActive_idx" ON "employee_assignments"("isActive");

ALTER TABLE "employee_assignments"
  ADD CONSTRAINT "employee_assignments_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_assignments"
  ADD CONSTRAINT "employee_assignments_positionId_fkey"
    FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
