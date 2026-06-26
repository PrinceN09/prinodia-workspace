/**
 * Local Organization type definitions — mirrors the Prisma schema until
 * `prisma generate` is re-run after v1.0.2 migration in the real environment.
 */

export type OrganizationType =
  | "GOVERNMENT"
  | "ENTERPRISE"
  | "EDUCATION"
  | "HEALTHCARE"
  | "NGO"
  | "CHURCH"
  | "NON_PROFIT"
  | "OTHER";

export type OrganizationStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED";

export interface Organization {
  id: string;
  name: string;
  code: string;
  type: OrganizationType;
  status: OrganizationStatus;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  logoUrl: string | null;
  isDemo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationWithCounts extends Organization {
  _count?: {
    ministries: number;
    departments: number;
    users: number;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OrganizationDelegate = Record<string, any>;
