-- Migration: v1.6.2 — Platform Foundation
-- Additive only. No existing tables are altered.

-- Enums

CREATE TYPE "PlanTier" AS ENUM (
  'STARTER', 'BUSINESS', 'ENTERPRISE', 'GOVERNMENT',
  'EDUCATION', 'HEALTHCARE', 'NGO', 'CHURCH', 'CUSTOM'
);

CREATE TYPE "SubscriptionStatus" AS ENUM (
  'TRIALING', 'ACTIVE', 'PAST_DUE', 'GRACE_PERIOD', 'CANCELLED', 'EXPIRED'
);

CREATE TYPE "InvoiceStatus" AS ENUM (
  'DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'
);

CREATE TYPE "TicketCategory" AS ENUM (
  'BILLING', 'TECHNICAL', 'ACCOUNT', 'FEATURE_REQUEST', 'SECURITY', 'OTHER'
);

CREATE TYPE "TicketPriority" AS ENUM (
  'LOW', 'NORMAL', 'HIGH', 'URGENT'
);

CREATE TYPE "TicketStatus" AS ENUM (
  'OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'
);

CREATE TYPE "DownloadPlatform" AS ENUM (
  'WINDOWS', 'MAC', 'LINUX', 'IOS', 'ANDROID',
  'CHROME_EXTENSION', 'FIREFOX_EXTENSION', 'ALL'
);

CREATE TYPE "DownloadCategory" AS ENUM (
  'DESKTOP_APP', 'MOBILE_APP', 'BROWSER_EXTENSION', 'CLI_TOOL', 'SDK', 'OTHER'
);

CREATE TYPE "EmailTemplateCategory" AS ENUM (
  'ONBOARDING', 'BILLING', 'SECURITY', 'SYSTEM', 'MARKETING', 'SUPPORT'
);

-- Tables

CREATE TABLE "subscription_plans" (
  "id"               TEXT NOT NULL,
  "name"             VARCHAR(100) NOT NULL,
  "slug"             VARCHAR(50) NOT NULL,
  "description"      TEXT,
  "tier"             "PlanTier" NOT NULL DEFAULT 'STARTER',
  "priceMonthly"     DECIMAL(10,2),
  "priceAnnually"    DECIMAL(10,2),
  "currency"         VARCHAR(3) NOT NULL DEFAULT 'USD',
  "maxSeats"         INTEGER,
  "minSeats"         INTEGER NOT NULL DEFAULT 1,
  "storagePerSeatGb" INTEGER NOT NULL DEFAULT 5,
  "maxStorageGb"     INTEGER,
  "trialDays"        INTEGER NOT NULL DEFAULT 14,
  "features"         JSONB NOT NULL DEFAULT '{}',
  "modules"          JSONB NOT NULL DEFAULT '{}',
  "isActive"         BOOLEAN NOT NULL DEFAULT true,
  "isPublic"         BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"        INTEGER NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");
CREATE INDEX "subscription_plans_tier_idx" ON "subscription_plans"("tier");
CREATE INDEX "subscription_plans_isActive_idx" ON "subscription_plans"("isActive");

CREATE TABLE "org_subscriptions" (
  "id"                  TEXT NOT NULL,
  "organizationId"      TEXT NOT NULL,
  "planId"              TEXT NOT NULL,
  "status"              "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  "seatCount"           INTEGER NOT NULL DEFAULT 1,
  "maxSeats"            INTEGER,
  "trialStartsAt"       TIMESTAMP(3),
  "trialEndsAt"         TIMESTAMP(3),
  "currentPeriodStart"  TIMESTAMP(3),
  "currentPeriodEnd"    TIMESTAMP(3),
  "cancelledAt"         TIMESTAMP(3),
  "externalId"          VARCHAR(255),
  "metadata"            JSONB NOT NULL DEFAULT '{}',
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "org_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "org_subscriptions_organizationId_key" ON "org_subscriptions"("organizationId");
CREATE INDEX "org_subscriptions_organizationId_idx" ON "org_subscriptions"("organizationId");
CREATE INDEX "org_subscriptions_status_idx" ON "org_subscriptions"("status");
ALTER TABLE "org_subscriptions" ADD CONSTRAINT "org_subscriptions_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "org_platform_profiles" (
  "id"                      TEXT NOT NULL,
  "organizationId"          TEXT NOT NULL,
  "primaryColor"            VARCHAR(7),
  "accentColor"             VARCHAR(7),
  "faviconUrl"              VARCHAR(500),
  "companyTagline"          VARCHAR(255),
  "billingEmail"            VARCHAR(255),
  "technicalEmail"          VARCHAR(255),
  "customDomain"            VARCHAR(255),
  "customDomainVerified"    BOOLEAN NOT NULL DEFAULT false,
  "customDomainVerifiedAt"  TIMESTAMP(3),
  "onboardingCompleted"     BOOLEAN NOT NULL DEFAULT false,
  "onboardingStep"          INTEGER NOT NULL DEFAULT 0,
  "activatedAt"             TIMESTAMP(3),
  "seatsUsed"               INTEGER NOT NULL DEFAULT 0,
  "whitelabelEnabled"       BOOLEAN NOT NULL DEFAULT false,
  "taxId"                   VARCHAR(100),
  "billingAddress"          JSONB,
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               TIMESTAMP(3) NOT NULL,
  CONSTRAINT "org_platform_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "org_platform_profiles_organizationId_key" ON "org_platform_profiles"("organizationId");
CREATE UNIQUE INDEX "org_platform_profiles_customDomain_key" ON "org_platform_profiles"("customDomain");

CREATE TABLE "org_feature_flags" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "featureKey"     VARCHAR(100) NOT NULL,
  "enabled"        BOOLEAN NOT NULL DEFAULT true,
  "config"         JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "org_feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "org_feature_flags_organizationId_featureKey_key" ON "org_feature_flags"("organizationId", "featureKey");
CREATE INDEX "org_feature_flags_organizationId_idx" ON "org_feature_flags"("organizationId");

CREATE TABLE "org_module_configs" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "moduleKey"      VARCHAR(100) NOT NULL,
  "enabled"        BOOLEAN NOT NULL DEFAULT true,
  "config"         JSONB,
  "enabledAt"      TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "org_module_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "org_module_configs_organizationId_moduleKey_key" ON "org_module_configs"("organizationId", "moduleKey");
CREATE INDEX "org_module_configs_organizationId_idx" ON "org_module_configs"("organizationId");

CREATE TABLE "api_keys" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdById"    TEXT NOT NULL,
  "name"           VARCHAR(255) NOT NULL,
  "keyHash"        VARCHAR(255) NOT NULL,
  "keyPrefix"      VARCHAR(16) NOT NULL,
  "scopes"         TEXT[] NOT NULL DEFAULT '{}',
  "rateLimitRpm"   INTEGER NOT NULL DEFAULT 60,
  "lastUsedAt"     TIMESTAMP(3),
  "expiresAt"      TIMESTAMP(3),
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");
CREATE INDEX "api_keys_organizationId_idx" ON "api_keys"("organizationId");
CREATE INDEX "api_keys_isActive_idx" ON "api_keys"("isActive");

CREATE TABLE "support_tickets" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "submittedById"  TEXT NOT NULL,
  "ticketNumber"   VARCHAR(20) NOT NULL,
  "subject"        VARCHAR(500) NOT NULL,
  "description"    TEXT NOT NULL,
  "category"       "TicketCategory" NOT NULL DEFAULT 'TECHNICAL',
  "priority"       "TicketPriority" NOT NULL DEFAULT 'NORMAL',
  "status"         "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "assignedToId"   TEXT,
  "resolvedAt"     TIMESTAMP(3),
  "closedAt"       TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_tickets_ticketNumber_key" ON "support_tickets"("ticketNumber");
CREATE INDEX "support_tickets_organizationId_idx" ON "support_tickets"("organizationId");
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");
CREATE INDEX "support_tickets_ticketNumber_idx" ON "support_tickets"("ticketNumber");

CREATE TABLE "support_ticket_messages" (
  "id"         TEXT NOT NULL,
  "ticketId"   TEXT NOT NULL,
  "authorId"   TEXT NOT NULL,
  "message"    TEXT NOT NULL,
  "isInternal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_ticket_messages_ticketId_idx" ON "support_ticket_messages"("ticketId");
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "admin_audit_logs" (
  "id"             TEXT NOT NULL,
  "actorId"        TEXT,
  "actorEmail"     VARCHAR(255),
  "organizationId" TEXT,
  "action"         VARCHAR(200) NOT NULL,
  "targetType"     VARCHAR(100),
  "targetId"       VARCHAR(100),
  "changes"        JSONB,
  "metadata"       JSONB,
  "ipAddress"      VARCHAR(50),
  "userAgent"      VARCHAR(500),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_actorId_idx" ON "admin_audit_logs"("actorId");
CREATE INDEX "admin_audit_logs_organizationId_idx" ON "admin_audit_logs"("organizationId");
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");

CREATE TABLE "invoices" (
  "id"                 TEXT NOT NULL,
  "organizationId"     TEXT NOT NULL,
  "invoiceNumber"      VARCHAR(30) NOT NULL,
  "status"             "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "subtotalCents"      INTEGER NOT NULL,
  "taxCents"           INTEGER NOT NULL DEFAULT 0,
  "discountCents"      INTEGER NOT NULL DEFAULT 0,
  "totalCents"         INTEGER NOT NULL,
  "currency"           VARCHAR(3) NOT NULL DEFAULT 'USD',
  "billingPeriodStart" TIMESTAMP(3) NOT NULL,
  "billingPeriodEnd"   TIMESTAMP(3) NOT NULL,
  "dueDate"            TIMESTAMP(3) NOT NULL,
  "paidAt"             TIMESTAMP(3),
  "externalId"         VARCHAR(255),
  "externalUrl"        VARCHAR(500),
  "notes"              TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
CREATE INDEX "invoices_organizationId_idx" ON "invoices"("organizationId");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

CREATE TABLE "invoice_line_items" (
  "id"             TEXT NOT NULL,
  "invoiceId"      TEXT NOT NULL,
  "description"    VARCHAR(500) NOT NULL,
  "quantity"       INTEGER NOT NULL DEFAULT 1,
  "unitPriceCents" INTEGER NOT NULL,
  "totalCents"     INTEGER NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invoice_line_items_invoiceId_idx" ON "invoice_line_items"("invoiceId");
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "download_assets" (
  "id"              TEXT NOT NULL,
  "name"            VARCHAR(255) NOT NULL,
  "description"     TEXT,
  "platform"        "DownloadPlatform" NOT NULL,
  "category"        "DownloadCategory" NOT NULL,
  "version"         VARCHAR(50) NOT NULL,
  "fileUrl"         VARCHAR(500) NOT NULL,
  "fileSizeBytes"   BIGINT NOT NULL,
  "fileHash"        VARCHAR(64),
  "minimumPlanTier" "PlanTier",
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "isFeatured"      BOOLEAN NOT NULL DEFAULT false,
  "releaseNotes"    TEXT,
  "publishedAt"     TIMESTAMP(3),
  "downloadCount"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "download_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "download_assets_platform_idx" ON "download_assets"("platform");
CREATE INDEX "download_assets_category_idx" ON "download_assets"("category");
CREATE INDEX "download_assets_isActive_idx" ON "download_assets"("isActive");

CREATE TABLE "email_templates" (
  "id"        TEXT NOT NULL,
  "slug"      VARCHAR(100) NOT NULL,
  "name"      VARCHAR(255) NOT NULL,
  "subject"   VARCHAR(500) NOT NULL,
  "htmlBody"  TEXT NOT NULL,
  "textBody"  TEXT,
  "variables" TEXT[] NOT NULL DEFAULT '{}',
  "category"  "EmailTemplateCategory" NOT NULL DEFAULT 'SYSTEM',
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_templates_slug_key" ON "email_templates"("slug");
CREATE INDEX "email_templates_slug_idx" ON "email_templates"("slug");
CREATE INDEX "email_templates_category_idx" ON "email_templates"("category");

CREATE TABLE "onboarding_progress" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "currentStep"    INTEGER NOT NULL DEFAULT 0,
  "completedSteps" JSONB NOT NULL DEFAULT '[]',
  "isCompleted"    BOOLEAN NOT NULL DEFAULT false,
  "completedAt"    TIMESTAMP(3),
  "data"           JSONB NOT NULL DEFAULT '{}',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "onboarding_progress_organizationId_key" ON "onboarding_progress"("organizationId");
