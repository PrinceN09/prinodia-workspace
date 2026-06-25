-- GovSphere v0.8.1 — Workflow & Digital Approvals Platform
-- Migration: 20260625000000_v0_8_1_workflows

-- ─── New Enums ─────────────────────────────────────────────────────────────────

CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT','ACTIVE','PAUSED','COMPLETED','CANCELLED','REJECTED');
CREATE TYPE "StepStatus" AS ENUM ('PENDING','IN_PROGRESS','APPROVED','REJECTED','SKIPPED','RETURNED','DELEGATED');
CREATE TYPE "ApprovalDecisionEnum" AS ENUM ('APPROVED','REJECTED','REQUEST_CHANGES','DELEGATED','ESCALATED');
CREATE TYPE "TaskStatus" AS ENUM ('TODO','IN_PROGRESS','BLOCKED','IN_REVIEW','DONE','CANCELLED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW','MEDIUM','HIGH','URGENT');
CREATE TYPE "WorkflowTrigger" AS ENUM ('MANUAL','DOCUMENT_CREATED','DOCUMENT_PUBLISHED','EMPLOYEE_TRANSFERRED','BUDGET_SUBMITTED','CONTRACT_UPLOADED','CUSTOM');

-- ─── Extend AuditAction ────────────────────────────────────────────────────────

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_STARTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_CANCELLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_STEP_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_STEP_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_STEP_RETURNED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_STEP_DELEGATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_STEP_ESCALATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_REASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_TEMPLATE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'WORKFLOW_TEMPLATE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DIGITAL_SIGNATURE_APPLIED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DIGITAL_SIGNATURE_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TASK_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TASK_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TASK_DELETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TASK_OVERDUE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TASK_COMMENT_ADDED';

-- ─── workflow_templates ────────────────────────────────────────────────────────

CREATE TABLE "workflow_templates" (
    "id"              TEXT NOT NULL,
    "name"            VARCHAR(255) NOT NULL,
    "description"     TEXT,
    "slug"            VARCHAR(255) NOT NULL,
    "trigger"         "WorkflowTrigger" NOT NULL DEFAULT 'MANUAL',
    "stepDefinitions" JSONB NOT NULL DEFAULT '[]',
    "isSystem"        BOOLEAN NOT NULL DEFAULT false,
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "ministryId"      TEXT,
    "createdById"     TEXT NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "workflow_templates_slug_key" ON "workflow_templates"("slug");
CREATE INDEX "workflow_templates_ministryId_idx" ON "workflow_templates"("ministryId");
CREATE INDEX "workflow_templates_isActive_idx" ON "workflow_templates"("isActive");
ALTER TABLE "workflow_templates"
    ADD CONSTRAINT "workflow_templates_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── workflow_definitions ──────────────────────────────────────────────────────

CREATE TABLE "workflow_definitions" (
    "id"          TEXT NOT NULL,
    "title"       VARCHAR(500) NOT NULL,
    "description" TEXT,
    "templateId"  TEXT,
    "trigger"     "WorkflowTrigger" NOT NULL DEFAULT 'MANUAL',
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "ministryId"  TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "workflow_definitions_ministryId_idx" ON "workflow_definitions"("ministryId");
CREATE INDEX "workflow_definitions_isActive_idx" ON "workflow_definitions"("isActive");
ALTER TABLE "workflow_definitions"
    ADD CONSTRAINT "workflow_definitions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "workflow_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_definitions_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_definitions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── workflow_steps ────────────────────────────────────────────────────────────

CREATE TABLE "workflow_steps" (
    "id"             TEXT NOT NULL,
    "definitionId"   TEXT NOT NULL,
    "order"          INTEGER NOT NULL,
    "name"           VARCHAR(255) NOT NULL,
    "description"    TEXT,
    "roleId"         TEXT,
    "assigneeId"     TEXT,
    "durationHours"  INTEGER,
    "allowDelegate"  BOOLEAN NOT NULL DEFAULT true,
    "allowEscalate"  BOOLEAN NOT NULL DEFAULT true,
    "requireComment" BOOLEAN NOT NULL DEFAULT false,
    "requireSign"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "workflow_steps_definitionId_order_key" ON "workflow_steps"("definitionId","order");
CREATE INDEX "workflow_steps_definitionId_idx" ON "workflow_steps"("definitionId");
ALTER TABLE "workflow_steps"
    ADD CONSTRAINT "workflow_steps_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_steps_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── workflow_instances ────────────────────────────────────────────────────────

CREATE TABLE "workflow_instances" (
    "id"            TEXT NOT NULL,
    "definitionId"  TEXT NOT NULL,
    "title"         VARCHAR(500) NOT NULL,
    "description"   TEXT,
    "status"        "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep"   INTEGER NOT NULL DEFAULT 0,
    "totalSteps"    INTEGER NOT NULL DEFAULT 0,
    "initiatorId"   TEXT NOT NULL,
    "documentId"    TEXT,
    "metadata"      JSONB NOT NULL DEFAULT '{}',
    "startedAt"     TIMESTAMP(3),
    "completedAt"   TIMESTAMP(3),
    "cancelledAt"   TIMESTAMP(3),
    "cancelledById" TEXT,
    "dueAt"         TIMESTAMP(3),
    "deletedAt"     TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances"("status");
CREATE INDEX "workflow_instances_initiatorId_idx" ON "workflow_instances"("initiatorId");
CREATE INDEX "workflow_instances_definitionId_idx" ON "workflow_instances"("definitionId");
CREATE INDEX "workflow_instances_documentId_idx" ON "workflow_instances"("documentId");
CREATE INDEX "workflow_instances_createdAt_idx" ON "workflow_instances"("createdAt");
ALTER TABLE "workflow_instances"
    ADD CONSTRAINT "workflow_instances_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_instances_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_instances_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── workflow_assignments ──────────────────────────────────────────────────────

CREATE TABLE "workflow_assignments" (
    "id"          TEXT NOT NULL,
    "instanceId"  TEXT NOT NULL,
    "stepId"      TEXT NOT NULL,
    "assigneeId"  TEXT NOT NULL,
    "stepOrder"   INTEGER NOT NULL,
    "status"      "StepStatus" NOT NULL DEFAULT 'PENDING',
    "dueAt"       TIMESTAMP(3),
    "notifiedAt"  TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workflow_assignments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "workflow_assignments_instanceId_idx" ON "workflow_assignments"("instanceId");
CREATE INDEX "workflow_assignments_assigneeId_idx" ON "workflow_assignments"("assigneeId");
CREATE INDEX "workflow_assignments_status_idx" ON "workflow_assignments"("status");
ALTER TABLE "workflow_assignments"
    ADD CONSTRAINT "workflow_assignments_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_assignments_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "workflow_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_assignments_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── workflow_approvals ────────────────────────────────────────────────────────

CREATE TABLE "workflow_approvals" (
    "id"            TEXT NOT NULL,
    "instanceId"    TEXT NOT NULL,
    "assignmentId"  TEXT NOT NULL,
    "approverId"    TEXT NOT NULL,
    "decision"      "ApprovalDecisionEnum" NOT NULL,
    "comment"       TEXT,
    "delegatedToId" TEXT,
    "stepOrder"     INTEGER NOT NULL,
    "decidedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workflow_approvals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "workflow_approvals_assignmentId_key" ON "workflow_approvals"("assignmentId");
CREATE INDEX "workflow_approvals_instanceId_idx" ON "workflow_approvals"("instanceId");
CREATE INDEX "workflow_approvals_approverId_idx" ON "workflow_approvals"("approverId");
ALTER TABLE "workflow_approvals"
    ADD CONSTRAINT "workflow_approvals_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_approvals_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "workflow_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_approvals_delegatedToId_fkey" FOREIGN KEY ("delegatedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── workflow_comments ─────────────────────────────────────────────────────────

CREATE TABLE "workflow_comments" (
    "id"         TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "authorId"   TEXT NOT NULL,
    "content"    TEXT NOT NULL,
    "replyToId"  TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt"  TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workflow_comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "workflow_comments_instanceId_idx" ON "workflow_comments"("instanceId");
CREATE INDEX "workflow_comments_authorId_idx" ON "workflow_comments"("authorId");
ALTER TABLE "workflow_comments"
    ADD CONSTRAINT "workflow_comments_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_comments_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "workflow_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── workflow_history ──────────────────────────────────────────────────────────

CREATE TABLE "workflow_history" (
    "id"         TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "actorId"    TEXT NOT NULL,
    "action"     VARCHAR(100) NOT NULL,
    "stepOrder"  INTEGER,
    "detail"     TEXT,
    "metadata"   JSONB NOT NULL DEFAULT '{}',
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workflow_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "workflow_history_instanceId_idx" ON "workflow_history"("instanceId");
CREATE INDEX "workflow_history_createdAt_idx" ON "workflow_history"("createdAt");
ALTER TABLE "workflow_history"
    ADD CONSTRAINT "workflow_history_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "workflow_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── digital_signatures ────────────────────────────────────────────────────────

CREATE TABLE "digital_signatures" (
    "id"             TEXT NOT NULL,
    "instanceId"     TEXT NOT NULL,
    "approvalId"     TEXT,
    "signerId"       TEXT NOT NULL,
    "signedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress"      VARCHAR(45),
    "userAgent"      VARCHAR(500),
    "certificateRef" VARCHAR(255),
    "qrToken"        TEXT NOT NULL,
    "revokedAt"      TIMESTAMP(3),
    "revokedById"    TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "digital_signatures_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "digital_signatures_approvalId_key" ON "digital_signatures"("approvalId");
CREATE UNIQUE INDEX "digital_signatures_qrToken_key" ON "digital_signatures"("qrToken");
CREATE INDEX "digital_signatures_instanceId_idx" ON "digital_signatures"("instanceId");
CREATE INDEX "digital_signatures_signerId_idx" ON "digital_signatures"("signerId");
CREATE INDEX "digital_signatures_qrToken_idx" ON "digital_signatures"("qrToken");
ALTER TABLE "digital_signatures"
    ADD CONSTRAINT "digital_signatures_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "digital_signatures_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "workflow_approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "digital_signatures_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "digital_signatures_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── tasks ─────────────────────────────────────────────────────────────────────

CREATE TABLE "tasks" (
    "id"          TEXT NOT NULL,
    "title"       VARCHAR(500) NOT NULL,
    "description" TEXT,
    "status"      "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority"    "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assigneeId"  TEXT,
    "createdById" TEXT NOT NULL,
    "instanceId"  TEXT,
    "documentId"  TEXT,
    "dueAt"       TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "deletedAt"   TIMESTAMP(3),
    "tags"        TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_instanceId_idx" ON "tasks"("instanceId");
CREATE INDEX "tasks_dueAt_idx" ON "tasks"("dueAt");
CREATE INDEX "tasks_createdAt_idx" ON "tasks"("createdAt");
ALTER TABLE "tasks"
    ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "tasks_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── task_comments ─────────────────────────────────────────────────────────────

CREATE TABLE "task_comments" (
    "id"        TEXT NOT NULL,
    "taskId"    TEXT NOT NULL,
    "authorId"  TEXT NOT NULL,
    "content"   TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "task_comments_taskId_idx" ON "task_comments"("taskId");
ALTER TABLE "task_comments"
    ADD CONSTRAINT "task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "task_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── task_attachments ──────────────────────────────────────────────────────────

CREATE TABLE "task_attachments" (
    "id"           TEXT NOT NULL,
    "taskId"       TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "filename"     VARCHAR(500) NOT NULL,
    "mimeType"     VARCHAR(100) NOT NULL,
    "sizeBytes"    INTEGER NOT NULL,
    "storageKey"   VARCHAR(1000) NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "task_attachments_taskId_idx" ON "task_attachments"("taskId");
ALTER TABLE "task_attachments"
    ADD CONSTRAINT "task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "task_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
