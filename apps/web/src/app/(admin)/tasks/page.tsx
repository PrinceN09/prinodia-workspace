"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { apiGet, apiPost } from "@/lib/api";
import {
  fmtDate,
  TASK_PRIORITY_COLOR,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLOR,
  TASK_STATUS_LABELS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/workflow-types";

// ─── Kanban columns ───────────────────────────────────────────────────────────

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "À faire" },
  { status: "IN_PROGRESS", label: "En cours" },
  { status: "IN_REVIEW", label: "En revue" },
  { status: "DONE", label: "Terminé" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("MEDIUM");

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => apiGet("/v1/tasks"),
  });

  const createTask = useMutation({
    mutationFn: () => apiPost("/v1/tasks", { title: newTitle, priority: newPriority }),
    onSuccess: () => {
      setShowCreate(false);
      setNewTitle("");
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return (
    <>
      <AdminTopBar
        title="Tâches"
        subtitle="Tableau kanban de gestion des tâches"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === "kanban" ? "list" : "kanban")}
              className="rounded bg-navy-700 px-3 py-1.5 text-xs font-medium text-navy-300 hover:bg-navy-600 hover:text-white transition-colors"
            >
              {view === "kanban" ? "Vue liste" : "Vue kanban"}
            </button>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              Nouvelle tâche
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Create form */}
        {showCreate && (
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-white mb-3">Nouvelle tâche</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Titre de la tâche…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTitle.trim()) createTask.mutate();
                    }}
                  />
                </div>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  className="rounded border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgente</option>
                </select>
                <Button
                  onClick={() => createTask.mutate()}
                  disabled={!newTitle.trim() || createTask.isPending}
                  variant="primary"
                  size="sm"
                >
                  Créer
                </Button>
                <Button onClick={() => setShowCreate(false)} variant="ghost" size="sm">
                  Annuler
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {isLoading ? (
          <PageSpinner />
        ) : !tasks?.length ? (
          <EmptyState title="Aucune tâche" description="Créez votre première tâche." />
        ) : view === "kanban" ? (
          <KanbanView tasks={tasks} />
        ) : (
          <ListView tasks={tasks} />
        )}
      </div>
    </>
  );
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

function KanbanView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400">
                {col.label}
              </h3>
              <span className="rounded-full bg-navy-700 px-2 py-0.5 text-xs font-medium text-navy-300">
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {colTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-1">
      {tasks.map((task) => {
        const priorityClass = TASK_PRIORITY_COLOR[task.priority] ?? "bg-navy-700 text-navy-300";
        const priorityLabel = TASK_PRIORITY_LABELS[task.priority] ?? task.priority;
        const statusClass = TASK_STATUS_COLOR[task.status] ?? "bg-navy-700 text-navy-300";
        const statusLabel = TASK_STATUS_LABELS[task.status] ?? task.status;

        return (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded border border-navy-800 bg-navy-900 px-3 py-2 hover:border-navy-700 transition-colors"
          >
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityClass}`}>
              {priorityLabel}
            </span>
            <Link
              href={`/admin/tasks/${task.id}`}
              className="flex-1 text-sm text-white hover:text-primary-400 transition-colors truncate"
            >
              {task.title}
            </Link>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
            {task.dueAt && (
              <span className="text-xs text-navy-500 flex-shrink-0">{fmtDate(task.dueAt)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: Task }) {
  const priorityClass = TASK_PRIORITY_COLOR[task.priority] ?? "bg-navy-700 text-navy-300";
  const priorityLabel = TASK_PRIORITY_LABELS[task.priority] ?? task.priority;

  return (
    <Link href={`/admin/tasks/${task.id}`}>
      <div className="rounded border border-navy-800 bg-navy-900 p-3 hover:border-navy-700 hover:bg-navy-800/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-xs font-medium text-white leading-snug">{task.title}</p>
          <span
            className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityClass}`}
          >
            {priorityLabel}
          </span>
        </div>
        {task.description && (
          <p className="text-[10px] text-navy-500 line-clamp-2 mb-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between">
          {task.assignee ? (
            <span className="text-[10px] text-navy-500 truncate">
              {task.assignee.displayName ?? task.assignee.email}
            </span>
          ) : (
            <span className="text-[10px] text-navy-600">Non assigné</span>
          )}
          {task.dueAt && (
            <span className="text-[10px] text-navy-500 flex-shrink-0">{fmtDate(task.dueAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
