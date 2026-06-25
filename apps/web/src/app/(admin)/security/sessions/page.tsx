"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { apiClient, apiGet } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminSession {
  id: string;
  platform: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastUsedAt: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  user: {
    id: string;
    displayName: string;
    email: string;
    matriculeNumber: string | null;
    ministry: { id: string; name: string; code: string } | null;
  };
  device: {
    id: string;
    name: string;
    platform: string;
    trusted: boolean;
  } | null;
}

interface PaginatedSessions {
  data: AdminSession[];
  meta: { total: number; page: number; limit: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sessionAge(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return `< 1h`;
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

function parsePlatform(ua: string | null): { os: string; browser: string } {
  if (!ua) return { os: "—", browser: "—" };
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac")
      ? "macOS"
      : ua.includes("Linux")
        ? "Linux"
        : ua.includes("Android")
          ? "Android"
          : ua.includes("iOS") || ua.includes("iPhone")
            ? "iOS"
            : "—";
  const browser = ua.includes("Chrome")
    ? "Chrome"
    : ua.includes("Firefox")
      ? "Firefox"
      : ua.includes("Safari")
        ? "Safari"
        : ua.includes("Edge")
          ? "Edge"
          : "—";
  return { os, browser };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeUserId, setRevokeUserId] = useState<string | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Debounce search
  const handleSearch = (v: string) => {
    setSearch(v);
    window.clearTimeout(window.__searchTimer);
    window.__searchTimer = window.setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400) as unknown as ReturnType<typeof setTimeout>;
  };

  const params = new URLSearchParams({ page: String(page), limit: "25" });
  if (debouncedSearch) params.set("search", debouncedSearch);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-sessions", page, debouncedSearch],
    queryFn: () => apiGet<PaginatedSessions>(`/v1/security/sessions?${params.toString()}`),
  });

  async function handleRevokeOne() {
    if (!revokeId) return;
    setRevokeLoading(true);
    try {
      await apiClient.delete(`/v1/security/sessions/${revokeId}`);
      await qc.invalidateQueries({ queryKey: ["admin-sessions"] });
    } finally {
      setRevokeLoading(false);
      setRevokeId(null);
    }
  }

  async function handleRevokeAll() {
    if (!revokeUserId) return;
    setRevokeLoading(true);
    try {
      await apiClient.delete(`/v1/security/sessions?userId=${revokeUserId}`);
      await qc.invalidateQueries({ queryKey: ["admin-sessions"] });
    } finally {
      setRevokeLoading(false);
      setRevokeUserId(null);
    }
  }

  const sessions = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <AdminTopBar title="Sessions" subtitle="Gestion des sessions actives" />

      {/* Confirm single revoke */}
      <ConfirmDialog
        open={revokeId !== null}
        title="Révoquer la session"
        message="Cette session sera immédiatement invalidée. L'utilisateur devra se reconnecter."
        confirmLabel="Révoquer"
        loading={revokeLoading}
        onConfirm={handleRevokeOne}
        onClose={() => setRevokeId(null)}
      />

      {/* Confirm revoke all */}
      <ConfirmDialog
        open={revokeUserId !== null}
        title="Révoquer toutes les sessions"
        message="Toutes les sessions actives de cet agent seront invalidées. Il devra se reconnecter."
        confirmLabel="Tout révoquer"
        loading={revokeLoading}
        onConfirm={handleRevokeAll}
        onClose={() => setRevokeUserId(null)}
      />

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="w-72">
            <Input
              placeholder="Rechercher un agent ou email…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          {meta && (
            <span className="text-sm text-slate-500 ml-auto">
              {meta.total} session{meta.total !== 1 ? "s" : ""} active{meta.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardBody>
            {isLoading ? (
              <PageSpinner />
            ) : isError ? (
              <p className="text-sm text-red-600 py-4 text-center">
                Impossible de charger les sessions.
              </p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Aucune session active.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 pl-0 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="pb-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Appareil / OS
                      </th>
                      <th className="pb-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Adresse IP
                      </th>
                      <th className="pb-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Connexion
                      </th>
                      <th className="pb-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Dernière activité
                      </th>
                      <th className="pb-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Âge
                      </th>
                      <th className="pb-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Ministère
                      </th>
                      <th className="pb-3 pl-4 pr-0 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sessions.map((s) => {
                      const { os, browser } = parsePlatform(s.userAgent);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-3 pl-0 pr-4">
                            <div className="font-medium text-slate-900">{s.user.displayName}</div>
                            <div className="text-xs text-slate-400">{s.user.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-700">
                              {s.device?.name ?? s.platform ?? browser}
                            </div>
                            <div className="text-xs text-slate-400">{os}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-600">
                            {s.ipAddress ?? "—"}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            {fmtDate(s.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            {fmtDate(s.lastUsedAt)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="gray">{sessionAge(s.createdAt)}</Badge>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            {s.user.ministry?.code ?? "—"}
                          </td>
                          <td className="py-3 pl-4 pr-0 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setRevokeId(s.id)}>
                                Révoquer
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setRevokeUserId(s.user.id)}
                              >
                                Tout révoquer
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
    __searchTimer: ReturnType<typeof setTimeout> | undefined;
  }
}
