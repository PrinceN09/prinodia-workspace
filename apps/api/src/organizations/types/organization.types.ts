/**
 * Local Organization type definitions — mirrors the Prisma schema (v1.0.2).
 * Used until `prisma generate` is run in the real environment to regenerate
 * the Prisma client with the new Organization model.
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
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationWithCounts extends Organization {
  _count?: {
    ministries: number;
    departments: number;
    users: number;
  };
  ministries?: Array<{ id: string; name: string; code: string; isActive: boolean }>;
}

// ─── Prisma delegate interface ─────────────────────────────────────────────────
// Mirrors the Prisma-generated delegate shape for type safety before regeneration.

interface FindManyArgs {
  where?: Partial<Record<keyof Organization, unknown>>;
  orderBy?: Partial<Record<keyof Organization, "asc" | "desc">>;
  skip?: number;
  take?: number;
  include?: Record<string, boolean | object>;
}

interface FindUniqueArgs {
  where: { id: string } | { code: string };
  include?: Record<string, boolean | object>;
}

interface FindFirstArgs {
  where?: Partial<Record<keyof Organization, unknown>>;
  orderBy?: Partial<Record<keyof Organization, "asc" | "desc">>;
}

interface CreateArgs {
  data: Omit<Organization, "id" | "createdAt" | "updatedAt"> & Partial<Pick<Organization, "id">>;
}

interface UpdateArgs {
  where: { id: string };
  data: Partial<Omit<Organization, "id" | "createdAt" | "updatedAt">>;
}

interface DeleteArgs {
  where: { id: string };
}

interface CountArgs {
  where?: Partial<Record<keyof Organization, unknown>>;
}

export interface OrganizationDelegate {
  findMany(args?: FindManyArgs): Promise<OrganizationWithCounts[]>;
  findFirst(args?: FindFirstArgs): Promise<Organization | null>;
  findUnique(args: FindUniqueArgs): Promise<OrganizationWithCounts | null>;
  create(args: CreateArgs): Promise<Organization>;
  update(args: UpdateArgs): Promise<Organization>;
  delete(args: DeleteArgs): Promise<Organization>;
  count(args?: CountArgs): Promise<number>;
}
