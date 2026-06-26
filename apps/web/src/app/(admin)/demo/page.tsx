"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgType = "GOVERNMENT" | "ENTERPRISE" | "EDUCATION" | "HEALTHCARE" | "NGO";
type OrgSize = "SMALL" | "MEDIUM" | "LARGE" | "GOVERNMENT_MINISTRY";

interface DemoStatus {
  organisations: number;
  users: number;
  documents: number;
  notifications: number;
  auditLogs: number;
}

interface GenerateResult {
  success?: boolean;
  alreadyExists?: boolean;
  message: string;
  organization?: string;
  summary?: {
    organization: string;
    departments: number;
    divisions: number;
    positions: number;
    users: number;
    adminEmail: string;
    demoPassword: string;
  };
}

interface ResetResult {
  deleted: boolean;
  message: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ORG_TYPES: Array<{ value: OrgType; label: string; description: string }> = [
  {
    value: "GOVERNMENT",
    label: "Ministère gouvernemental",
    description: "Structure administrative d'un ministère avec directions et divisions",
  },
  {
    value: "ENTERPRISE",
    label: "Entreprise privée",
    description: "Organisation d'entreprise avec départements fonctionnels",
  },
  {
    value: "EDUCATION",
    label: "Établissement d'enseignement",
    description: "Université ou école avec facultés et administration",
  },
  {
    value: "HEALTHCARE",
    label: "Établissement de santé",
    description: "Hôpital ou clinique avec services médicaux",
  },
  {
    value: "NGO",
    label: "ONG / Association",
    description: "Organisation à but non lucratif avec programmes et partenariats",
  },
];

const ORG_SIZES: Array<{ value: OrgSize; label: string; users: string }> = [
  { value: "SMALL", label: "Petite organisation", users: "~10 utilisateurs" },
  { value: "MEDIUM", label: "Organisation moyenne", users: "~25 utilisateurs" },
  { value: "LARGE", label: "Grande organisation", users: "~50 utilisateurs" },
  {
    value: "GOVERNMENT_MINISTRY",
    label: "Ministère (structure complète)",
    users: "~35 utilisateurs",
  },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoDataPage() {
  const [orgType, setOrgType] = useState<OrgType>("GOVERNMENT");
  const [orgSize, setOrgSize] = useState<OrgSize>("MEDIUM");
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [summary, setSummary] = useState<GenerateResult["summary"] | null>(null);
  const [loading, setLoading] = useState<"generate" | "reset" | "export" | "status" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearFeedback = () => {
    setResult(null);
    setSummary(null);
    setError(null);
  };

  const loadStatus = useCallback(async () => {
    setLoading("status");
    try {
      const data = await apiFetch<DemoStatus>("/v1/demo/status");
      setStatus(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }, []);

  const handleGenerate = async () => {
    clearFeedback();
    setLoading("generate");
    try {
      const data = await apiFetch<GenerateResult>("/v1/demo/generate", {
        method: "POST",
        body: JSON.stringify({ orgType, size: orgSize }),
      });
      setResult(data.message);
      if (data.summary) setSummary(data.summary);
      await loadStatus();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleReset = async () => {
    if (!confirm("Supprimer toutes les données de démonstration ? Cette action est irréversible.")) {
      return;
    }
    clearFeedback();
    setLoading("reset");
    try {
      const data = await apiFetch<ResetResult>("/v1/demo/reset", { method: "POST" });
      setResult(data.message);
      setSummary(null);
      await loadStatus();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleExport = async () => {
    clearFeedback();
    setLoading("export");
    try {
      const data = await apiFetch<unknown>("/v1/demo/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prinodia-demo-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setResult("Export téléchargé.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            DEV ONLY
          </span>
          <span className="text-xs text-navy-400">Environnement de développement</span>
        </div>
        <h1 className="text-2xl font-bold text-navy-900">Données de démonstration</h1>
        <p className="mt-1 text-sm text-navy-500">
          Génère des organisations, utilisateurs, documents et activités réalistes pour les
          démonstrations produit. Bloqué en production.
        </p>
      </div>

      {/* Warning banner */}
      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Attention :</strong> Cette fonctionnalité est réservée aux environnements de
        développement. Les utilisateurs créés utilisent le domaine{" "}
        <code className="rounded bg-amber-100 px-1 font-mono text-xs">@demo.prinodia.app</code> et
        le mot de passe <code className="rounded bg-amber-100 px-1 font-mono text-xs">Demo@2024!</code>.
      </div>

      {/* Status card */}
      <div className="rounded-lg border border-navy-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-700 uppercase tracking-wide">
            État actuel
          </h2>
          <button
            onClick={loadStatus}
            disabled={loading === "status"}
            className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {loading === "status" ? "Chargement…" : "Actualiser"}
          </button>
        </div>
        {status ? (
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Organisations", value: status.organisations },
              { label: "Utilisateurs", value: status.users },
              { label: "Documents", value: status.documents },
              { label: "Notifications", value: status.notifications },
              { label: "Audit logs", value: status.auditLogs },
            ].map((item) => (
              <div key={item.label} className="rounded border border-navy-100 bg-navy-50 p-3 text-center">
                <div className="text-xl font-bold text-navy-900">{item.value}</div>
                <div className="text-[11px] text-navy-500 leading-tight">{item.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-navy-400">
            Cliquez sur «&nbsp;Actualiser&nbsp;» pour charger l&apos;état.
          </p>
        )}
      </div>

      {/* Configuration */}
      <div className="rounded-lg border border-navy-200 bg-white p-5 space-y-5">
        <h2 className="text-sm font-semibold text-navy-700 uppercase tracking-wide">
          Configuration
        </h2>

        {/* Org type */}
        <div>
          <p className="mb-2 text-sm font-medium text-navy-700">Type d&apos;organisation</p>
          <div className="space-y-2">
            {ORG_TYPES.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors ${
                  orgType === opt.value
                    ? "border-primary-400 bg-primary-50"
                    : "border-navy-200 hover:border-navy-300"
                }`}
              >
                <input
                  type="radio"
                  name="orgType"
                  value={opt.value}
                  checked={orgType === opt.value}
                  onChange={() => setOrgType(opt.value)}
                  className="mt-0.5 accent-primary-600"
                />
                <div>
                  <div className="text-sm font-medium text-navy-800">{opt.label}</div>
                  <div className="text-xs text-navy-500">{opt.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Org size */}
        <div>
          <p className="mb-2 text-sm font-medium text-navy-700">Taille</p>
          <div className="grid grid-cols-2 gap-2">
            {ORG_SIZES.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors ${
                  orgSize === opt.value
                    ? "border-primary-400 bg-primary-50"
                    : "border-navy-200 hover:border-navy-300"
                }`}
              >
                <input
                  type="radio"
                  name="orgSize"
                  value={opt.value}
                  checked={orgSize === opt.value}
                  onChange={() => setOrgSize(opt.value)}
                  className="accent-primary-600"
                />
                <div>
                  <div className="text-sm font-medium text-navy-800">{opt.label}</div>
                  <div className="text-xs text-navy-500">{opt.users}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <strong>Erreur :</strong> {error}
        </div>
      )}
      {result && !error && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {result}
        </div>
      )}

      {/* Generated summary */}
      {summary && (
        <div className="rounded-lg border border-navy-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-navy-700 uppercase tracking-wide">
            Résultat de la génération
          </h2>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { label: "Organisation", value: summary.organization },
              { label: "Départements", value: summary.departments },
              { label: "Divisions", value: summary.divisions },
              { label: "Positions", value: summary.positions },
              { label: "Utilisateurs", value: summary.users },
            ].map((item) => (
              <div key={item.label} className="rounded border border-navy-100 bg-navy-50 p-2">
                <div className="text-[11px] text-navy-500">{item.label}</div>
                <div className="font-semibold text-navy-800 truncate">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="rounded bg-navy-50 border border-navy-200 p-3 text-xs font-mono space-y-1">
            <div>
              <span className="text-navy-500">Email admin :</span>{" "}
              <span className="text-navy-800">{summary.adminEmail}</span>
            </div>
            <div>
              <span className="text-navy-500">Mot de passe :</span>{" "}
              <span className="text-navy-800">{summary.demoPassword}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleGenerate}
          disabled={loading !== null}
          className="rounded bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading === "generate" ? "Génération en cours…" : "Générer les données de démo"}
        </button>

        <button
          onClick={handleReset}
          disabled={loading !== null}
          className="rounded border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {loading === "reset" ? "Réinitialisation…" : "Réinitialiser"}
        </button>

        <button
          onClick={handleExport}
          disabled={loading !== null}
          className="rounded border border-navy-300 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 disabled:opacity-50 transition-colors"
        >
          {loading === "export" ? "Export…" : "Exporter (JSON)"}
        </button>
      </div>
    </div>
  );
}
