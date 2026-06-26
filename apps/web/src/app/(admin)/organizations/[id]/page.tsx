"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { PermissionGate } from "@/components/layout/PermissionGate";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { apiGet } from "@/lib/api";
import { PERMS } from "@/lib/permissions";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrganizationType =
  | "GOVERNMENT"
  | "ENTERPRISE"
  | "EDUCATION"
  | "HEALTHCARE"
  | "NGO"
  | "CHURCH"
  | "NON_PROFIT"
  | "OTHER";

type OrganizationStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED";

interface Organization {
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
  createdAt: string;
  _count?: { ministries: number; departments: number; users: number };
  ministries?: Array<{ id: string; name: string; code: string; isActive: boolean }>;
}

interface DashboardData {
  organization: Organization;
  stats: { ministries: number; departments: number; users: number };
}

interface Department {
  id: string;
  name: string;
  _count: { divisions: number; users: number };
}

interface StructureData {
  organization: Organization;
  departments: Department[];
}

interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string;
  role: string;
  status: string;
}

interface UsersData {
  data: UserRecord[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Label helpers ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<OrganizationType, string> = {
  GOVERNMENT: "Gouvernement",
  ENTERPRISE: "Entreprise",
  EDUCATION: "Éducation",
  HEALTHCARE: "Santé",
  NGO: "ONG",
  CHURCH: "Église",
  NON_PROFIT: "Sans but lucratif",
  OTHER: "Autre",
};

const STATUS_VARIANTS: Record<OrganizationStatus, "green" | "gray" | "yellow" | "red"> = {
  ACTIVE: "green",
  INACTIVE: "gray",
  SUSPENDED: "yellow",
  ARCHIVED: "red",
};

const STATUS_LABELS: Record<OrganizationStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  SUSPENDED: "Suspendu",
  ARCHIVED: "Archivé",
};

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "departments" | "users";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "departments", label: "Départements" },
  { id: "users", label: "Agents" },
];

// ─── Page component ───────────────────────────────────────────────────────────

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = params["id"] as string;
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const dashboard = useQuery<DashboardData>({
    queryKey: ["org-dashboard", id],
    queryFn: () => apiGet<DashboardData>(`/v1/organizations/${id}/dashboard`),
    enabled: !!id,
  });

  const structureQuery = useQuery<StructureData>({
    queryKey: ["org-structure", id],
    queryFn: () => apiGet<StructureData>(`/v1/organizations/${id}/structure`),
    enabled: !!id && activeTab === "departments",
  });

  const usersQuery = useQuery<UsersData>({
    queryKey: ["org-users", id],
    queryFn: () => apiGet<UsersData>(`/v1/organizations/${id}/users`),
    enabled: !!id && activeTab === "users",
  });

  if (dashboard.isLoading) return <PageSpinner />;
  if (!dashboard.data) return null;

  const { organization: org, stats } = dashboard.data;

  return (
    <>
      <AdminTopBar
        title={org.name}
        subtitle={`${TYPE_LABELS[org.type] ?? org.type} · ${org.code}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/organizations"
              className="text-sm text-navy-400 hover:text-white transition-colors"
            >
              ← Organisations
            </Link>
            <PermissionGate permission={PERMS.ORGANIZATION_UPDATE}>
              <Button size="sm">
                <Link href={`/admin/organizations/${id}/edit`} className="text-white no-underline">
                  Modifier
                </Link>
              </Button>
            </PermissionGate>
          </div>
        }
      />

      {/* Status + type badges */}
      <div className="mb-4 flex items-center gap-2">
        <Badge variant={STATUS_VARIANTS[org.status]}>{STATUS_LABELS[org.status]}</Badge>
        <Badge variant="blue">{TYPE_LABELS[org.type] ?? org.type}</Badge>
        {org.city && (
          <span className="text-sm text-navy-400">
            {[org.city, org.country].filter(Boolean).join(", ")}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Ministères", value: stats.ministries },
          { label: "Départements", value: stats.departments },
          { label: "Agents", value: stats.users },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-navy-700 bg-navy-800 p-4">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="mt-0.5 text-xs text-navy-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-navy-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary-500 text-primary-400"
                : "text-navy-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-navy-700 bg-navy-800 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Informations</h3>
            <dl className="space-y-2 text-sm">
              {org.description && (
                <div>
                  <dt className="text-navy-400">Description</dt>
                  <dd className="text-navy-200">{org.description}</dd>
                </div>
              )}
              {org.email && (
                <div>
                  <dt className="text-navy-400">Email</dt>
                  <dd>
                    <a href={`mailto:${org.email}`} className="text-primary-400 hover:underline">
                      {org.email}
                    </a>
                  </dd>
                </div>
              )}
              {org.phone && (
                <div>
                  <dt className="text-navy-400">Téléphone</dt>
                  <dd className="text-navy-200">{org.phone}</dd>
                </div>
              )}
              {org.website && (
                <div>
                  <dt className="text-navy-400">Site web</dt>
                  <dd>
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-400 hover:underline"
                    >
                      {org.website}
                    </a>
                  </dd>
                </div>
              )}
              {org.address && (
                <div>
                  <dt className="text-navy-400">Adresse</dt>
                  <dd className="text-navy-200">{org.address}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Ministries (government type) */}
          {org.ministries && org.ministries.length > 0 && (
            <div className="rounded-lg border border-navy-700 bg-navy-800 p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">
                Ministères ({org.ministries.length})
              </h3>
              <ul className="space-y-1">
                {org.ministries.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <Link
                      href={`/admin/ministries/${m.id}`}
                      className="text-sm text-primary-400 hover:underline"
                    >
                      {m.name}
                    </Link>
                    {!m.isActive && (
                      <Badge variant="gray" className="text-[10px]">
                        Inactif
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Departments */}
      {activeTab === "departments" && (
        <>
          {structureQuery.isLoading ? (
            <PageSpinner />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Département</TableHeaderCell>
                  <TableHeaderCell>Divisions</TableHeaderCell>
                  <TableHeaderCell>Agents</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!structureQuery.data || structureQuery.data.departments.length === 0 ? (
                  <TableEmpty message="Aucun département." />
                ) : (
                  structureQuery.data.departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium text-navy-200">{dept.name}</TableCell>
                      <TableCell className="text-navy-400">{dept._count?.divisions ?? 0}</TableCell>
                      <TableCell className="text-navy-400">{dept._count?.users ?? 0}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {/* Users */}
      {activeTab === "users" && (
        <>
          {usersQuery.isLoading ? (
            <PageSpinner />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Agent</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Rôle</TableHeaderCell>
                  <TableHeaderCell>Statut</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!usersQuery.data || usersQuery.data.data.length === 0 ? (
                  <TableEmpty message="Aucun agent." />
                ) : (
                  usersQuery.data.data.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Link
                          href={`/admin/employees/${u.id}`}
                          className="font-medium text-primary-400 hover:underline"
                        >
                          {u.displayName ?? `${u.firstName} ${u.lastName}`}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-navy-300">{u.email}</TableCell>
                      <TableCell>
                        <code className="rounded bg-navy-900 px-1.5 py-0.5 text-xs text-navy-300">
                          {u.role}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === "ACTIVE" ? "green" : "gray"}>{u.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </>
  );
}
