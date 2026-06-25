"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { apiGet } from "@/lib/api";
import { fmtDate, fmtDateTime, type WorkflowInstance } from "@/lib/workflow-types";

export default function ApprovalsPage() {
  const { data: pending, isLoading } = useQuery<WorkflowInstance[]>({
    queryKey: ["my-approvals"],
    queryFn: () => apiGet("/v1/workflows/my-approvals"),
  });

  return (
    <>
      <AdminTopBar title="Mes approbations" subtitle="Actions en attente de votre décision" />

      <div className="p-6 space-y-4">
        {isLoading ? (
          <PageSpinner />
        ) : !pending?.length ? (
          <EmptyState
            title="Aucune approbation en attente"
            description="Toutes vos actions sont à jour."
          />
        ) : (
          <>
            <p className="text-sm text-navy-400">
              {pending.length} workflow{pending.length !== 1 ? "s" : ""} nécessitent votre action
            </p>
            <div className="space-y-2">
              {pending.map((wf) => (
                <ApprovalCard key={wf.id} workflow={wf} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ApprovalCard({ workflow }: { workflow: WorkflowInstance }) {
  const currentAssignment = workflow.assignments?.find((a) => a.stepOrder === workflow.currentStep);

  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-4">
          {/* Urgency indicator */}
          <div className="flex-shrink-0">
            {workflow.dueAt && new Date(workflow.dueAt) < new Date() ? (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-900/40">
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-900/40">
                <svg className="h-4 w-4 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
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
              <span className="rounded bg-primary-900/30 px-2 py-0.5 text-xs font-medium text-primary-400">
                Étape {workflow.currentStep + 1}/{workflow.totalSteps}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-navy-400">
              {workflow.definition.title} · Initié par{" "}
              {workflow.initiator.displayName ?? workflow.initiator.email} ·{" "}
              {fmtDate(workflow.createdAt)}
            </p>
            {currentAssignment?.dueAt && (
              <p className="mt-1 text-xs text-navy-500">
                Échéance: {fmtDateTime(currentAssignment.dueAt)}
              </p>
            )}
          </div>

          {/* CTA */}
          <Link
            href={`/admin/workflows/${workflow.id}`}
            className="flex-shrink-0 rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-500 transition-colors"
          >
            Traiter
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
