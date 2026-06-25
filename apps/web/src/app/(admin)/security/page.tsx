"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { apiGet } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayActivity {
  date: string;
  success: number;
  failed: number;
}

interface MinistryCount {
  ministry: string;
  ministryCode: string;
  count: number;
}

interface SecurityDashboard {
  activeSessions: number;
  activeDevices: number;
  mfaEnabledUsers: number;
  totalUsers: number;
  mfaAdoptionPct: number;
  lockedAccounts: number;
  failedLoginsToday: number;
  passwordResetsToday: number;
  newInvitationsToday: number;
  archivedUsers: number;
  loginActivity: DayActivity[];
  failedLoginActivity: DayActivity[];
  sessionsByMinistry: MinistryCount[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  color?: "default" | "red" | "green" | "amber" | "blue";
  href?: string;
  sub?: string;
}

function StatCard({ label, value, color = "default", href, sub }: StatCardProps) {
  const valueClass =
    color === "red"
      ? "text-red-600"
      : color === "green"
        ? "text-emerald-600"
        : color === "amber"
          ? "text-amber-600"
          : color === "blue"
            ? "text-blue-600"
            : "text-slate-900";

  const inner = (
    <div className="p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg border border-slate-200 bg-white hover:shadow-sm transition-shadow"
      >
        {inner}
      </Link>
    );
  }
  return <div className="rounded-lg border border-slate-200 bg-white">{inner}</div>;
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
}

function BarChart({ data, maxValue }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-right text-xs text-slate-500 truncate">
            {d.label}
          </span>
          <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
            <div
              className={`h-full rounded transition-all ${d.color ?? "bg-primary-500"}`}
              style={{ width: `${Math.round((d.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-xs font-medium tabular-nums text-slate-700">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

interface ActivityChartProps {
  data: DayActivity[];
  showFailed?: boolean;
}

function ActivityChart({ data, showFailed = false }: ActivityChartProps) {
  const max = Math.max(...data.map((d) => (showFailed ? d.failed : d.success + d.failed)), 1);
  return (
    <div className="flex items-end gap-1 h-28">
      {data.map((d) => {
        const successH = showFailed ? 0 : Math.round((d.success / max) * 100);
        const failedH = Math.round((d.failed / max) * 100);
        const totalH = showFailed ? failedH : successH + failedH;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: "88px" }}>
              {showFailed ? (
                <div className="w-full rounded-t bg-red-400" style={{ height: `${totalH}%` }} />
              ) : (
                <div
                  className="w-full flex flex-col justify-end rounded-t overflow-hidden"
                  style={{ height: `${totalH}%` }}
                >
                  <div
                    className="bg-red-400"
                    style={{
                      height: `${d.success + d.failed > 0 ? Math.round((d.failed / (d.success + d.failed)) * 100) : 0}%`,
                    }}
                  />
                  <div className="bg-primary-500 flex-1" />
                </div>
              )}
            </div>
            <span className="text-[9px] text-slate-400 truncate">{fmtDay(d.date)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SecurityDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["security-dashboard"],
    queryFn: () => apiGet<SecurityDashboard>("/v1/security/dashboard"),
    refetchInterval: 60_000,
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !data) {
    return (
      <div className="p-8 text-sm text-red-600">
        Impossible de charger le tableau de bord sécurité.
      </div>
    );
  }

  const ministryBarData = data.sessionsByMinistry.map((m) => ({
    label: m.ministryCode,
    value: m.count,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <AdminTopBar title="Sécurité" subtitle="Centre de sécurité gouvernemental" />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Stat Cards — Row 1 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Sessions actives"
            value={data.activeSessions}
            color="blue"
            href="/admin/security/sessions"
          />
          <StatCard label="Appareils connus" value={data.activeDevices} />
          <StatCard
            label="MFA activé"
            value={`${data.mfaAdoptionPct}%`}
            color="green"
            sub={`${data.mfaEnabledUsers} / ${data.totalUsers} agents`}
          />
          <StatCard
            label="Comptes verrouillés"
            value={data.lockedAccounts}
            {...(data.lockedAccounts > 0 ? { color: "red" as const } : {})}
          />
        </div>

        {/* Stat Cards — Row 2 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Échecs connexion (auj.)"
            value={data.failedLoginsToday}
            {...(data.failedLoginsToday > 10 ? { color: "red" as const } : {})}
          />
          <StatCard
            label="Réinitial. mot de passe"
            value={data.passwordResetsToday}
            {...(data.passwordResetsToday > 0 ? { color: "amber" as const } : {})}
          />
          <StatCard label="Nouvelles invitations" value={data.newInvitationsToday} />
          <StatCard label="Agents archivés" value={data.archivedUsers} color="default" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Login Activity */}
          <Card>
            <CardHeader
              title="Activité de connexion — 7 jours"
              actions={
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-sm bg-primary-500" />
                    Succès
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-sm bg-red-400" />
                    Échecs
                  </span>
                </div>
              }
            />
            <CardBody>
              <ActivityChart data={data.loginActivity} />
            </CardBody>
          </Card>

          {/* Failed Logins */}
          <Card>
            <CardHeader title="Tentatives échouées — 7 jours" />
            <CardBody>
              <ActivityChart data={data.failedLoginActivity} showFailed />
            </CardBody>
          </Card>

          {/* MFA Adoption */}
          <Card>
            <CardHeader title="Adoption MFA" />
            <CardBody>
              <div className="flex items-center gap-6">
                {/* Ring-like display */}
                <div className="relative h-24 w-24 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray={`${data.mfaAdoptionPct} ${100 - data.mfaAdoptionPct}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-slate-900">{data.mfaAdoptionPct}%</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">{data.mfaEnabledUsers} avec MFA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-200" />
                    <span className="text-slate-400">
                      {data.totalUsers - data.mfaEnabledUsers} sans MFA
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Sessions by Ministry */}
          <Card>
            <CardHeader title="Sessions par ministère" />
            <CardBody>
              {ministryBarData.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune session active.</p>
              ) : (
                <BarChart data={ministryBarData} />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link
            href="/admin/security/sessions"
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 hover:shadow-sm transition-shadow"
          >
            <span className="text-blue-500">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            Gérer les sessions
          </Link>
          <Link
            href="/admin/audit"
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 hover:shadow-sm transition-shadow"
          >
            <span className="text-slate-500">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5v-3.379a3 3 0 00-.879-2.121l-3.12-3.121a3 3 0 00-1.402-.791V2.988a2.25 2.25 0 012.287.037l.124.082a2.25 2.25 0 001.877.319l.002-.001.02-.004a.75.75 0 01.85.47A1.5 1.5 0 0012.75 3H12a.75.75 0 010-1.5h.75a3 3 0 011.538.42l.012.006.012.007.01.005.003.002.003.001.006.004.003.001a.75.75 0 01.651-.921zm-3.876 1.498A1.5 1.5 0 0114 6.75v.019A1.5 1.5 0 0113.5 9h-9A1.5 1.5 0 013 7.5v-3A1.5 1.5 0 014.5 3h6a1.5 1.5 0 011.612 1.51zM2 11.5a.5.5 0 01.5-.5h8a.5.5 0 010 1h-8a.5.5 0 01-.5-.5zm0 2a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            Journal d&apos;audit
          </Link>
          <Link
            href="/admin/employees"
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 hover:shadow-sm transition-shadow"
          >
            <span className="text-slate-500">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
            </span>
            Agents
          </Link>
        </div>
      </div>
    </div>
  );
}
