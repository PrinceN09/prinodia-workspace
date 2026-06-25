"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  fmtDate,
  fmtDateTime,
  TASK_PRIORITY_COLOR,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLOR,
  TASK_STATUS_LABELS,
  type Task,
  type TaskComment,
  type TaskStatus,
} from "@/lib/workflow-types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ["task", params.id],
    queryFn: () => apiGet(`/v1/tasks/${params.id}`),
  });

  const { data: comments } = useQuery<TaskComment[]>({
    queryKey: ["task-comments", params.id],
    queryFn: () => apiGet(`/v1/tasks/${params.id}/comments`),
  });

  const updateStatus = useMutation({
    mutationFn: (status: TaskStatus) => apiPatch(`/v1/tasks/${params.id}`, { status }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["task", params.id] }),
  });

  const addComment = useMutation({
    mutationFn: () => apiPost(`/v1/tasks/${params.id}/comments`, { content: comment }),
    onSuccess: () => {
      setComment("");
      void qc.invalidateQueries({ queryKey: ["task-comments", params.id] });
    },
  });

  if (isLoading) return <PageSpinner />;
  if (!task) return <EmptyState title="Tâche introuvable" />;

  const statusClass = TASK_STATUS_COLOR[task.status] ?? "bg-navy-700 text-navy-300";
  const statusLabel = TASK_STATUS_LABELS[task.status] ?? task.status;
  const priorityClass = TASK_PRIORITY_COLOR[task.priority] ?? "bg-navy-700 text-navy-300";
  const priorityLabel = TASK_PRIORITY_LABELS[task.priority] ?? task.priority;

  return (
    <>
      <AdminTopBar
        title={task.title}
        subtitle="Détail de la tâche"
        actions={
          <div className="flex items-center gap-2">
            <span className={`rounded px-2.5 py-1 text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
            <span className={`rounded px-2.5 py-1 text-xs font-medium ${priorityClass}`}>
              {priorityLabel}
            </span>
          </div>
        }
      />

      <div className="p-6 grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <Card>
            <CardBody>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-3">
                Description
              </h3>
              {task.description ? (
                <p className="text-sm text-navy-200 leading-relaxed">{task.description}</p>
              ) : (
                <p className="text-sm text-navy-500 italic">Aucune description</p>
              )}
            </CardBody>
          </Card>

          {/* Status change */}
          <Card>
            <CardBody>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-3">
                Mettre à jour le statut
              </h3>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    "TODO",
                    "IN_PROGRESS",
                    "IN_REVIEW",
                    "BLOCKED",
                    "DONE",
                    "CANCELLED",
                  ] as TaskStatus[]
                ).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus.mutate(s)}
                    disabled={task.status === s || updateStatus.isPending}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      task.status === s
                        ? (TASK_STATUS_COLOR[s] ?? "bg-navy-700 text-navy-300") +
                          " ring-1 ring-primary-500"
                        : "bg-navy-800 text-navy-400 hover:bg-navy-700 hover:text-white"
                    }`}
                  >
                    {TASK_STATUS_LABELS[s] ?? s}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Comments */}
          <Card>
            <CardBody>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-3">
                Commentaires
              </h3>

              <div className="space-y-3 mb-4">
                {!comments?.length ? (
                  <p className="text-xs text-navy-500">Aucun commentaire</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="border-l-2 border-navy-700 pl-3">
                      <p className="text-xs font-medium text-navy-300">
                        {c.author.displayName ?? c.author.email}
                        <span className="ml-2 font-normal text-navy-500">
                          {fmtDateTime(c.createdAt)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-white">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Ajouter un commentaire…"
                className="w-full rounded border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  onClick={() => addComment.mutate()}
                  disabled={!comment.trim() || addComment.isPending}
                  variant="primary"
                  size="sm"
                >
                  {addComment.isPending ? "Envoi…" : "Commenter"}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar meta */}
        <div className="space-y-4">
          <Card>
            <CardBody>
              <dl className="space-y-3">
                <MetaField
                  label="Assigné à"
                  value={task.assignee?.displayName ?? task.assignee?.email ?? "Non assigné"}
                />
                <MetaField
                  label="Créé par"
                  value={task.createdBy.displayName ?? task.createdBy.email}
                />
                <MetaField label="Créé le" value={fmtDateTime(task.createdAt)} />
                <MetaField label="Échéance" value={fmtDate(task.dueAt)} />
                {task.completedAt && (
                  <MetaField label="Terminé le" value={fmtDateTime(task.completedAt)} />
                )}
                {task.instance && (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-0.5">
                      Workflow lié
                    </dt>
                    <dd className="text-xs text-primary-400 truncate">{task.instance.title}</dd>
                  </div>
                )}
                {task.tags.length > 0 && (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-1.5">
                      Tags
                    </dt>
                    <dd className="flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-navy-700 px-2 py-0.5 text-xs text-navy-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
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
