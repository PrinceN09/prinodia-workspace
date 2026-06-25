"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/Tabs";
import { apiGet, apiPost } from "@/lib/api";
import {
  DECISION_COLOR,
  DECISION_LABELS,
  fmtDateTime,
  STEP_STATUS_LABELS,
  WORKFLOW_STATUS_COLOR,
  WORKFLOW_STATUS_LABELS,
  type WorkflowInstance,
} from "@/lib/workflow-types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data: workflow, isLoading } = useQuery<WorkflowInstance>({
    queryKey: ["workflow", params.id],
    queryFn: () => apiGet(`/v1/workflows/${params.id}`),
  });

  const { data: comments } = useQuery({
    queryKey: ["workflow-comments", params.id],
    queryFn: () => apiGet(`/v1/workflows/${params.id}/comments`),
  });

  const { data: history } = useQuery({
    queryKey: ["workflow-history", params.id],
    queryFn: () => apiGet(`/v1/workflows/${params.id}/history`),
  });

  const { data: signatures } = useQuery({
    queryKey: ["workflow-signatures", params.id],
    queryFn: () => apiGet(`/v1/workflows/${params.id}/signatures`),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["workflow", params.id] });

  const approve = useMutation({
    mutationFn: () => apiPost(`/v1/workflows/${params.id}/approve`, { comment: approveComment }),
    onSuccess: () => {
      setShowApproveForm(false);
      setApproveComment("");
      invalidate();
    },
  });

  const reject = useMutation({
    mutationFn: () => apiPost(`/v1/workflows/${params.id}/reject`, { reason: rejectReason }),
    onSuccess: () => {
      setShowRejectForm(false);
      setRejectReason("");
      invalidate();
    },
  });

  const addComment = useMutation({
    mutationFn: () => apiPost(`/v1/workflows/${params.id}/comments`, { content: comment }),
    onSuccess: () => {
      setComment("");
      void qc.invalidateQueries({ queryKey: ["workflow-comments", params.id] });
    },
  });

  if (isLoading) return <PageSpinner />;
  if (!workflow) return <EmptyState title="Workflow introuvable" />;

  const statusClass = WORKFLOW_STATUS_COLOR[workflow.status] ?? "bg-navy-700 text-navy-300";
  const statusLabel = WORKFLOW_STATUS_LABELS[workflow.status] ?? workflow.status;

  return (
    <>
      <AdminTopBar
        title={workflow.title}
        subtitle={workflow.definition.title}
        actions={
          <div className="flex items-center gap-2">
            <span className={`rounded px-2.5 py-1 text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
            {workflow.status === "ACTIVE" && (
              <>
                <Button variant="primary" onClick={() => setShowApproveForm(true)} size="sm">
                  Approuver
                </Button>
                <Button variant="ghost" onClick={() => setShowRejectForm(true)} size="sm">
                  Rejeter
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Approve form */}
        {showApproveForm && (
          <ApprovalForm
            title="Approuver cette étape"
            confirmLabel="Approuver"
            confirmVariant="primary"
            value={approveComment}
            onChange={setApproveComment}
            onSubmit={() => approve.mutate()}
            onCancel={() => setShowApproveForm(false)}
            loading={approve.isPending}
          />
        )}

        {/* Reject form */}
        {showRejectForm && (
          <ApprovalForm
            title="Rejeter cette étape"
            confirmLabel="Rejeter"
            confirmVariant="danger"
            required
            value={rejectReason}
            onChange={setRejectReason}
            onSubmit={() => reject.mutate()}
            onCancel={() => setShowRejectForm(false)}
            loading={reject.isPending}
          />
        )}

        {/* Progress tracker */}
        <ProgressTracker workflow={workflow} />

        {/* Tabs */}
        <Tabs defaultTab="overview">
          <TabList className="bg-navy-900 border-b border-navy-800">
            <Tab value="overview">Vue d'ensemble</Tab>
            <Tab value="comments">Commentaires</Tab>
            <Tab value="history">Historique</Tab>
            <Tab value="signatures">Signatures</Tab>
          </TabList>
          <TabPanel value="overview" className="mt-4">
            <OverviewTab workflow={workflow} />
          </TabPanel>
          <TabPanel value="comments" className="mt-4">
            <CommentsTab
              {...(comments !== undefined
                ? {
                    comments: comments as Array<{
                      id: string;
                      content: string;
                      createdAt: string;
                      author: { id: string; displayName: string | null; email: string };
                    }>,
                  }
                : {})}
              comment={comment}
              setComment={setComment}
              onSubmit={() => addComment.mutate()}
              loading={addComment.isPending}
            />
          </TabPanel>
          <TabPanel value="history" className="mt-4">
            <HistoryTab
              {...(history !== undefined
                ? {
                    history: history as Array<{
                      id: string;
                      action: string;
                      stepOrder: number | null;
                      detail: string | null;
                      createdAt: string;
                      actor: { displayName: string | null; email: string };
                    }>,
                  }
                : {})}
            />
          </TabPanel>
          <TabPanel value="signatures" className="mt-4">
            <SignaturesTab
              {...(signatures !== undefined
                ? {
                    signatures: signatures as Array<{
                      id: string;
                      signedAt: string;
                      revokedAt: string | null;
                      qrToken: string;
                      signer: { displayName: string | null; email: string };
                    }>,
                  }
                : {})}
            />
          </TabPanel>
        </Tabs>
      </div>
    </>
  );
}

// ─── Progress Tracker ─────────────────────────────────────────────────────────

function ProgressTracker({ workflow }: { workflow: WorkflowInstance }) {
  const steps = workflow.assignments ?? [];
  const pct = workflow.totalSteps > 0 ? (workflow.currentStep / workflow.totalSteps) * 100 : 0;

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider">
            Progression
          </span>
          <span className="text-xs text-navy-400">
            Étape {workflow.currentStep} / {workflow.totalSteps}
          </span>
        </div>

        {/* Bar */}
        <div className="h-1.5 rounded-full bg-navy-700 mb-4">
          <div
            className="h-1.5 rounded-full bg-primary-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Steps */}
        {steps.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((a) => {
              const active = a.stepOrder === workflow.currentStep;
              return (
                <div
                  key={a.id}
                  className={`rounded border px-3 py-2 ${
                    active
                      ? "border-primary-600 bg-primary-900/20"
                      : "border-navy-700 bg-navy-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        active ? "bg-primary-600 text-white" : "bg-navy-700 text-navy-400"
                      }`}
                    >
                      {a.stepOrder + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {a.assignee.displayName ?? a.assignee.email}
                      </p>
                      <p className="text-[10px] text-navy-500">
                        {STEP_STATUS_LABELS[a.status] ?? a.status}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ workflow }: { workflow: WorkflowInstance }) {
  const approvals = workflow.approvals ?? [];

  return (
    <div className="space-y-4">
      {/* Meta */}
      <Card>
        <CardBody>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetaField
              label="Initiateur"
              value={workflow.initiator.displayName ?? workflow.initiator.email}
            />
            <MetaField label="Démarré" value={fmtDateTime(workflow.startedAt)} />
            <MetaField label="Échéance" value={fmtDateTime(workflow.dueAt)} />
            <MetaField label="Terminé" value={fmtDateTime(workflow.completedAt)} />
          </dl>
          {workflow.description && (
            <p className="mt-3 text-sm text-navy-300 border-t border-navy-700 pt-3">
              {workflow.description}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Approval timeline */}
      {approvals.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
            Historique des approbations
          </h3>
          <div className="space-y-2">
            {approvals.map((a) => {
              const decClass = DECISION_COLOR[a.decision] ?? "bg-navy-700 text-navy-300";
              const decLabel = DECISION_LABELS[a.decision] ?? a.decision;
              return (
                <Card key={a.id}>
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-navy-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-navy-300">{a.stepOrder + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-white">
                            {a.approver.displayName ?? a.approver.email}
                          </p>
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${decClass}`}>
                            {decLabel}
                          </span>
                        </div>
                        {a.comment && (
                          <p className="mt-1 text-xs text-navy-400 italic">"{a.comment}"</p>
                        )}
                        <p className="mt-0.5 text-[10px] text-navy-500">
                          {fmtDateTime(a.decidedAt)}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-0.5">
        {label}
      </dt>
      <dd className="text-sm text-navy-200">{value}</dd>
    </div>
  );
}

// ─── Comments Tab ─────────────────────────────────────────────────────────────

function CommentsTab({
  comments,
  comment,
  setComment,
  onSubmit,
  loading,
}: {
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; displayName: string | null; email: string };
  }>;
  comment: string;
  setComment: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Input */}
      <Card>
        <CardBody>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Ajouter un commentaire…"
            className="w-full rounded border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <div className="mt-2 flex justify-end">
            <Button
              onClick={onSubmit}
              disabled={!comment.trim() || loading}
              variant="primary"
              size="sm"
            >
              {loading ? "Envoi…" : "Commenter"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* List */}
      {!comments?.length ? (
        <EmptyState title="Aucun commentaire" />
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <Card key={c.id}>
              <CardBody>
                <p className="text-xs font-medium text-navy-300">
                  {c.author.displayName ?? c.author.email}
                  <span className="ml-2 text-navy-500 font-normal">{fmtDateTime(c.createdAt)}</span>
                </p>
                <p className="mt-1 text-sm text-white">{c.content}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({
  history,
}: {
  history?: Array<{
    id: string;
    action: string;
    stepOrder: number | null;
    detail: string | null;
    createdAt: string;
    actor: { displayName: string | null; email: string };
  }>;
}) {
  if (!history?.length) return <EmptyState title="Aucun historique" />;

  return (
    <div className="space-y-2">
      {history.map((h) => (
        <div key={h.id} className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-primary-500" />
          <div>
            <p className="text-xs text-navy-300">
              <span className="font-medium text-white">{h.actor.displayName ?? h.actor.email}</span>{" "}
              — {h.action.replace(/_/g, " ").toLowerCase()}
              {h.stepOrder !== null && ` (étape ${h.stepOrder + 1})`}
            </p>
            {h.detail && <p className="text-xs text-navy-500 mt-0.5">{h.detail}</p>}
            <p className="text-[10px] text-navy-600 mt-0.5">{fmtDateTime(h.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Signatures Tab ───────────────────────────────────────────────────────────

function SignaturesTab({
  signatures,
}: {
  signatures?: Array<{
    id: string;
    signedAt: string;
    revokedAt: string | null;
    qrToken: string;
    signer: { displayName: string | null; email: string };
  }>;
}) {
  if (!signatures?.length) return <EmptyState title="Aucune signature numérique" />;

  return (
    <div className="space-y-2">
      {signatures.map((sig) => (
        <Card key={sig.id}>
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-9 w-9 rounded bg-navy-700 flex items-center justify-center">
                <svg className="h-5 w-5 text-gold-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5v-3.379a3 3 0 00-.879-2.121l-3.12-3.121a3 3 0 00-2.121-.879H6.75A2.25 2.25 0 014.5 6.25v-1A2.25 2.25 0 016.75 3h7.5a2.25 2.25 0 011.738.012z"
                    clipRule="evenodd"
                  />
                  <path d="M5 8.25a2.25 2.25 0 00-2.25 2.25v7.5A2.25 2.25 0 005 20.25h7.5A2.25 2.25 0 0014.75 18V10.5a2.25 2.25 0 00-2.25-2.25H5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">
                    {sig.signer.displayName ?? sig.signer.email}
                  </p>
                  {sig.revokedAt ? (
                    <span className="rounded bg-red-900/40 px-2 py-0.5 text-xs text-red-400">
                      Révoquée
                    </span>
                  ) : (
                    <span className="rounded bg-green-900/40 px-2 py-0.5 text-xs text-green-400">
                      Valide
                    </span>
                  )}
                </div>
                <p className="text-xs text-navy-400 mt-0.5">
                  Signée le {fmtDateTime(sig.signedAt)}
                  {sig.revokedAt && ` · Révoquée le ${fmtDateTime(sig.revokedAt)}`}
                </p>
                <p className="mt-1 text-[10px] font-mono text-navy-600 truncate">
                  Token: {sig.qrToken}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

// ─── Approval Form ────────────────────────────────────────────────────────────

function ApprovalForm({
  title,
  confirmLabel,
  confirmVariant,
  required = false,
  value,
  onChange,
  onSubmit,
  onCancel,
  loading,
}: {
  title: string;
  confirmLabel: string;
  confirmVariant: "primary" | "danger";
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <Card>
      <CardBody>
        <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={required ? "Motif obligatoire…" : "Commentaire (optionnel)…"}
          className="w-full rounded border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <div className="mt-3 flex gap-2">
          <Button
            onClick={onSubmit}
            disabled={(required && !value.trim()) || loading}
            variant={confirmVariant}
            size="sm"
          >
            {loading ? "En cours…" : confirmLabel}
          </Button>
          <Button onClick={onCancel} variant="ghost" size="sm">
            Annuler
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
