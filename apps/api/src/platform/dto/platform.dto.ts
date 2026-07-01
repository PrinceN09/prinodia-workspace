/**
 * Platform v1.6.2 — Shared DTOs
 */

import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
  Max,
  MinLength,
  MaxLength,
} from "class-validator";

// ─── Pagination ───────────────────────────────────────────────────────────────

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ─── Subscription Plans ───────────────────────────────────────────────────────

export class CreatePlanDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum([
    "STARTER",
    "BUSINESS",
    "ENTERPRISE",
    "GOVERNMENT",
    "EDUCATION",
    "HEALTHCARE",
    "NGO",
    "CHURCH",
    "CUSTOM",
  ])
  tier?: string = "STARTER";

  @IsOptional()
  priceMonthly?: number;

  @IsOptional()
  priceAnnually?: number;

  @IsOptional()
  @IsInt()
  maxSeats?: number;

  @IsOptional()
  @IsInt()
  trialDays?: number;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  priceMonthly?: number;

  @IsOptional()
  priceAnnually?: number;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  seatCount?: number;

  @IsOptional()
  @IsEnum(["TRIALING", "ACTIVE", "PAST_DUE", "GRACE_PERIOD", "CANCELLED", "EXPIRED"])
  status?: string;

  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;
}

// ─── Org Lifecycle ────────────────────────────────────────────────────────────

export class ProvisionOrgDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code!: string;

  @IsEnum([
    "GOVERNMENT",
    "ENTERPRISE",
    "EDUCATION",
    "HEALTHCARE",
    "NGO",
    "CHURCH",
    "NON_PROFIT",
    "OTHER",
  ])
  type!: string;

  @IsOptional()
  @IsString()
  planSlug?: string;

  @IsOptional()
  @IsEmail()
  billingEmail?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class UpdateOrgStatusDto {
  @IsEnum(["ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED", "PENDING_VERIFICATION"])
  status!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateOrgBrandingDto {
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyTagline?: string;

  @IsOptional()
  @IsEmail()
  billingEmail?: string;

  @IsOptional()
  @IsEmail()
  technicalEmail?: string;

  @IsOptional()
  @IsBoolean()
  whitelabelEnabled?: boolean;
}

// ─── Feature Flags ────────────────────────────────────────────────────────────

export class UpsertFeatureFlagDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  config?: Record<string, unknown>;
}

export class UpsertModuleConfigDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  config?: Record<string, unknown>;
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export class CreateApiKeyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  rateLimitRpm?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  rateLimitRpm?: number;
}

// ─── Support Tickets ──────────────────────────────────────────────────────────

export class CreateTicketDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  subject!: string;

  @IsString()
  @MinLength(20)
  description!: string;

  @IsEnum(["BILLING", "TECHNICAL", "ACCOUNT", "FEATURE_REQUEST", "SECURITY", "OTHER"])
  category!: string;

  @IsEnum(["LOW", "NORMAL", "HIGH", "URGENT"])
  priority?: string = "NORMAL";
}

export class AddTicketMessageDto {
  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class UpdateTicketStatusDto {
  @IsEnum(["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"])
  status!: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

// ─── Billing / Invoices ───────────────────────────────────────────────────────

export class CreateInvoiceDto {
  @IsString()
  organizationId!: string;

  @IsInt()
  subtotalCents!: number;

  @IsOptional()
  @IsInt()
  taxCents?: number;

  @IsOptional()
  @IsInt()
  discountCents?: number;

  @IsDateString()
  billingPeriodStart!: string;

  @IsDateString()
  billingPeriodEnd!: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInvoiceStatusDto {
  @IsEnum(["DRAFT", "OPEN", "PAID", "VOID", "UNCOLLECTIBLE"])
  status!: string;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export class CompleteOnboardingStepDto {
  @IsInt()
  @Min(0)
  step!: number;

  @IsOptional()
  data?: Record<string, unknown>;
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export class CreateEmailTemplateDto {
  @IsString()
  @MaxLength(100)
  slug!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(500)
  subject!: string;

  @IsString()
  htmlBody!: string;

  @IsOptional()
  @IsString()
  textBody?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @IsEnum(["ONBOARDING", "BILLING", "SECURITY", "SYSTEM", "MARKETING", "SUPPORT"])
  category?: string = "SYSTEM";
}

export class UpdateEmailTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  htmlBody?: string;

  @IsOptional()
  @IsString()
  textBody?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
