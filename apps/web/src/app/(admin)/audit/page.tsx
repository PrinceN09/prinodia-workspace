"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageSpinner } from "@/components/ui/Spinner";
import { apiGet } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    displayName: string;
    email: string;
  } | null;
}

interface PaginatedAudit {
  data: AuditEntry[];
  meta: { total: number; page: number; limit: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY: Record<string, "red" | "yellow" | "blue" | "green" | "gray"> = {
  LOGIN_FAILED: "red",
  ACCOUNT_LOCKED: "red",
  MFA_CHALLENGE_FAILED: "red",
  SESSION_REVOKED: "red",
  TOKEN_INVALID: "red",
  PASSWORD_RESET_REQUESTED: "yellow",
  PASSWORD_CHANGED_BY_ADMIN: "yellow",
  ROLE_ASSIGNED: "blue",
  ROLE_REMOVED: "blue",
  EMPLOYEE_TRANSFERRED: "blue",
  LOGIN_SUCCESS: "green",
  EMPLOYEE_ACTIVATED: "green",
  MFA_ENABLED: "green",
};

const CATEGORY_COLORS: Record<string, string> = {
  security: "bg-red-50 text-red-700",
  lifecycle: "bg-blue-50 text-blue-700",
  roles: "bg-purple-50 text-purple-700",
  workforce: "bg-amber-50 text-amber-700",
  session: "bg-slate-100 text-slate-600",
};

const ACTION_CATEGORY: Record<string, string> = {
  LOGIN_SUCCESS: "security",
  LOGIN_FAILED: "security",
  LOGOUT: "security",
  LOGOUT_ALL: "security",
  SESSION_CREATED: "session",
  SESSION_REVOKED: "session",
  MFA_ENABLED: "security",
  MFA_DISABLED: "security",
  MFA_CHALLENGE_SUCCESS: "security",
  MFA_CHALLENGE_FAILED: "security",
  PASSWORD_CHANGED: "security",
  PASSWORD_RESET_REQUESTED: "security",
  ACCOUNT_LOCKED: "security",
  ROLE_ASSIGNED: "roles",
  ROLE_REMOVED: "roles",
  EMPLOYEE_TRANSFERRED: "workforce",
  EMPLOYEE_POSITION_CHANGED: "workforce",
  USER_CREATED: "lifecycle",
  USER_SUSPENDED: "lifecycle",
  USER_DEACTIVATED: "lifecycle",
  EMPLOYEE_ACTIVATED: "lifecycle",
  EMPLOYEE_ARCHIVED: "lifecycle",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function severityBadge(action: string): "red" | "yellow" | "blue" | "green" | "gray" {
  return SEVERITY[action] ?? "gray";
}

function categoryLabel(action: string): string {
  return ACTION_CATEGORY[action] ?? "other";
}

function categoryClass(action: string): string {
  return CATEGORY_COLORS[categoryLabel(action)] ?? "bg-slate-100 text-slate-500";
}

function buildExportUrl(params: {
  search: string;
  action: string;
  entityType: string;
  startDate: string;
  endDate: string;
}): string {
  const p = new URLSearchParams();
  if (params.action) p.set("action", params.action);
  if (params.entityType) p.set("entityType", params.entityType);
  if (params.startDate) p.set("startDate", params.startDate);
  if (params.endDate) p.set("endDate", params.endDate);
  const base = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";
  return `${base}/v1/audit-logs/export?${p.toString()}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditCenterPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSearch = (v: string) => {
    setSearch(v);
    window.clearTimeout(window.__auditSearchTimer);
    window.__auditSearchTimer = window.setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400) as unknown as ReturnType<typeof setTimeout>;
  };

  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (debouncedSearch) params.set("userId", debouncedSearch);
  if (action) params.set("action", action);
  if (entityType) params.set("entityType", entityType);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", page, debouncedSearch, action, entityType, startDate, endDate],
    queryFn: () => apiGet<PaginatedAudit>(`/v1/audit-logs?${params.toString()}`),
  });

  const entries = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  const exportUrl = buildExportUrl({
    search: debouncedSearch,
    action,
    entityType,
    startDate,
    endDate,
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <AdminTopBar title="Journal d'audit" subtitle="Traçabilité complète des actions" />

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Filters */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div className="col-span-2 sm:col-span-1">
                <Input
                  placeholder="ID utilisateur…"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <Select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Toutes les actions" },
                  { value: "LOGIN_SUCCESS", label: "LOGIN_SUCCESS" },
                  { value: "LOGIN_FAILED", label: "LOGIN_FAILED" },
                  { value: "LOGOUT", label: "LOGOUT" },
                  { value: "LOGOUT_ALL", label: "LOGOUT_ALL" },
                  { value: "SESSION_REVOKED", label: "SESSION_REVOKED" },
                  { value: "ACCOUNT_LOCKED", label: "ACCOUNT_LOCKED" },
                  { value: "PASSWORD_CHANGED", label: "PASSWORD_CHANGED" },
                  { value: "PASSWORD_RESET_REQUESTED", label: "PASSWORD_RESET_REQUESTED" },
                  { value: "MFA_ENABLED", label: "MFA_ENABLED" },
                  { value: "MFA_DISABLED", label: "MFA_DISABLED" },
                  { value: "ROLE_ASSIGNED", label: "ROLE_ASSIGNED" },
                  { value: "ROLE_REMOVED", label: "ROLE_REMOVED" },
                  { value: "EMPLOYEE_TRANSFERRED", label: "EMPLOYEE_TRANSFERRED" },
                  { value: "EMPLOYEE_ACTIVATED", label: "EMPLOYEE_ACTIVATED" },
                  { value: "EMPLOYEE_ARCHIVED", label: "EMPLOYEE_ARCHIVED" },
                  { value: "USER_SUSPENDED", label: "USER_SUSPENDED" },
                ]}
              />
              <Select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Tous les types" },
                  { value: "USER", label: "USER" },
                  { value: "SESSION", label: "SESSION" },
                  { value: "ROLE", label: "ROLE" },
                  { value: "MINISTRY", label: "MINISTRY" },
                ]}
              />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setAction("");
                  setEntityType("");
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
              >
                Réinitialiser
              </Button>
              <a
                href={exportUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 3a.75.75 0 01.75.75v7.44l1.47-1.47a.75.75 0 111.06 1.06l-2.75 2.75a.75.75 0 01-1.06 0L6.72 10.78a.75.75 0 111.06-1.06l1.47 1.47V3.75A.75.75 0 0110 3zM3.75 14a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H3.75z"
                    clipRule="evenodd"
                  />
                </svg>
                Exporter CSV
              </a>
              {meta && (
                <span className="text-sm text-slate-400">
                  {meta.total} entrée{meta.total !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Table */}
        <Card>
          <CardBody>
            {isLoading ? (
              <PageSpinner />
            ) : isError ? (
              <p className="text-sm text-red-600 py-4 text-center">
                Impossible de charger le journal.
              </p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Aucune entrée trouvée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 pl-0 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Horodatage
                      </th>
                      <th className="pb-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="pb-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="pb-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Ressource
                      </th>
                      <th className="pb-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        IP
                      </th>
                      <th className="pb-3 pl-4 pr-0 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Sévérité
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {entries.map((e) => (
                      <>
                        <tr
                          key={e.id}
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                        >
                          <td className="py-2.5 pl-0 pr-4 text-xs text-slate-500 whitespace-nowrap">
                            {fmtDate(e.createdAt)}
                          </td>
                          <td className="py-2.5 px-4">
                            {e.user ? (
                              <>
                                <div className="text-slate-800 font-medium">
                                  {e.user.displayName}
                                </div>
                                <div className="text-xs text-slate-400">{e.user.email}</div>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 font-mono">
                                {e.userId ?? "—"}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${categoryClass(e.action)}`}
                            >
                              {e.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-600">
                            {e.entityType ?? "—"}
                            {e.entityId && (
                              <span className="ml-1 font-mono text-slate-400 text-[10px]">
                                {e.entityId.slice(0, 8)}…
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-xs text-slate-500">
                            {e.ipAddress ?? "—"}
                          </td>
                          <td className="py-2.5 pl-4 pr-0">
                            <Badge variant={severityBadge(e.action)}>
                              {severityBadge(e.action) === "red"
                                ? "Critique"
                                : severityBadge(e.action) === "yellow"
                                  ? "Alerte"
                                  : severityBadge(e.action) === "green"
                                    ? "OK"
                                    : "Info"}
                            </Badge>
                          </td>
                        </tr>
                        {expandedId === e.id && e.metadata && (
                          <tr key={`${e.id}-meta`} className="bg-slate-50">
                            <td colSpan={6} className="py-3 px-4">
                              <pre className="text-[11px] text-slate-600 whitespace-pre-wrap break-all font-mono leading-relaxed">
                                {JSON.stringify(e.metadata, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <span className="text-sm text-slate-500">
              Page {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Extend Window for debounce timer
declare global {
  interface Window {
    __auditSearchTimer: ReturnType<typeof setTimeout> | undefined;
  }
}
