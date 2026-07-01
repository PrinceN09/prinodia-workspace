/**
 * Prinodia Platform v1.6.2 — PlatformModule
 *
 * Business & SaaS commercial engine: subscriptions, licensing, feature flags,
 * module toggles, API keys, support tickets, billing, downloads, email templates,
 * onboarding wizard, and platform admin audit logs.
 *
 * Additive only — no existing modules are modified.
 */

import { Module } from "@nestjs/common";

import { ApiKeysController } from "./api-keys/api-keys.controller";
import { ApiKeysService } from "./api-keys/api-keys.service";
import { AdminAuditController } from "./audit/admin-audit.controller";
import { AdminAuditService } from "./audit/admin-audit.service";
import { BillingController } from "./billing/billing.controller";
import { BillingService } from "./billing/billing.service";
import { DownloadsController } from "./downloads/downloads.controller";
import { DownloadsService } from "./downloads/downloads.service";
import { EmailTemplatesController } from "./email-templates/email-templates.controller";
import { EmailTemplatesService } from "./email-templates/email-templates.service";
import { FeaturesController } from "./features/features.controller";
import { FeaturesService } from "./features/features.service";
import { OnboardingController } from "./onboarding/onboarding.controller";
import { OnboardingService } from "./onboarding/onboarding.service";
import { PlatformOrganizationsController } from "./organizations/platform-organizations.controller";
import { PlatformOrganizationsService } from "./organizations/platform-organizations.service";
import { SubscriptionsController } from "./subscriptions/subscriptions.controller";
import { SubscriptionsService } from "./subscriptions/subscriptions.service";
import { SupportController } from "./support/support.controller";
import { SupportService } from "./support/support.service";

@Module({
  controllers: [
    PlatformOrganizationsController,
    SubscriptionsController,
    FeaturesController,
    ApiKeysController,
    SupportController,
    AdminAuditController,
    BillingController,
    DownloadsController,
    EmailTemplatesController,
    OnboardingController,
  ],
  providers: [
    PlatformOrganizationsService,
    SubscriptionsService,
    FeaturesService,
    ApiKeysService,
    SupportService,
    AdminAuditService,
    BillingService,
    DownloadsService,
    EmailTemplatesService,
    OnboardingService,
  ],
  exports: [
    PlatformOrganizationsService,
    SubscriptionsService,
    FeaturesService,
    ApiKeysService,
    AdminAuditService,
    OnboardingService,
  ],
})
export class PlatformModule {}
