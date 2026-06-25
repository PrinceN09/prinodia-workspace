"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { apiGet } from "@/lib/api";
import {
  fmtDate,
  WORKFLOW_STATUS_COLOR,
  WORKFLOW_STATUS_LABELS,
  type WorkflowInstance,
  type WorkflowStatus,
} from "@/lib/workflow-types";

// ─── Page ─────────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: WorkflowStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "ACTIVE", label: "En cours" },
  { value: "COMPLETED", label: "Terminés" },
  { value: "CANCELLED", label: "Annulés" },
  { value: "REJECTED", label: "Rejetés" },
];

export default function WorkflowsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | "ALL">("ALL");

  const { data: workflows, isLoading } = useQuery<WorkflowInstance[]>({
    queryKey: ["workflows", statusFilter],
    queryFn: () => apiGet("/v1/workflows", statusFilter !== "ALL" ? { status: statusFilter } : {}),
  });

  return (
    <>
      <AdminTopBar
        title="Workflows"
        subtitle="Circuits d'approbation gouvernementaux"
        actions={
          <Link
            href="/admin/workflows/new"
            className="inline-flex items-center gap-1.5 rounded bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Nouveau workflow
          </Link>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filter bar */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary-600 text-white"
                  : "bg-navy-800 text-navy-300 hover:bg-navy-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : !workflows?.length ? (
          <EmptyState
            title="Aucun workflow"
            description="Lancez votre premier circuit d'approbation."
            action={{
              label: "Créer un workflow",
              onClick: () => router.push("/admin/workflows/new"),
            }}
          />
        ) : (
          <div className="space-y-2">
            {workflows.map((wf) => (
              <WorkflowRow key={wf.id} workflow={wf} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function WorkflowRow({ workflow }: { workflow: WorkflowInstance }) {
  const statusClass = WORKFLOW_STATUS_COLOR[workflow.status] ?? "bg-navy-700 text-navy-300";
  const statusLabel = WORKFLOW_STATUS_LABELS[workflow.status] ?? workflow.status;

  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-4">
          {/* Progress indicator */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
            <div className="h-8 w-8 rounded-full bg-navy-700 flex items-center justify-center">
              <span className="text-xs font-bold text-navy-300">
                {workflow.currentStep}/{workflow.totalSteps}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/admin/workflows/${workflow.id}`}
                className="text-sm font-semibold text-white hover:text-primary-400 transition-colors"
              >
                {workflow.title}
              </Link>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-navy-400">
              {workflow.definition.title} · Initié par{" "}
              {workflow.initiator.displayName ?? workflow.initiator.email} ·{" "}
              {fmtDate(workflow.createdAt)}
            </p>
          </div>

          {/* Due date */}
          {workflow.dueAt && (
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-navy-500">Échéance</p>
              <p className="text-xs font-medium text-navy-300">{fmtDate(workflow.dueAt)}</p>
            </div>
          )}

          {/* Action */}
          <Link
            href={`/admin/workflows/${workflow.id}`}
            className="flex-shrink-0 rounded bg-navy-700 px-2.5 py-1.5 text-xs font-medium text-navy-300 hover:bg-navy-600 hover:text-white transition-colors"
          >
            Voir
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 rounded-full bg-navy-700">
          <div
            className="h-1 rounded-full bg-primary-500 transition-all"
            style={{
              width:
                workflow.totalSteps > 0
                  ? `${(workflow.currentStep / workflow.totalSteps) * 100}%`
                  : "0%",
            }}
          />
        </div>
      </CardBody>
    </Card>
  );
}
