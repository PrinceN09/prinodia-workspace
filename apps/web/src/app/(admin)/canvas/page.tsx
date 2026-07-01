"use client";

/**
 * Prinodia Canvas v1.6.0 — /admin/canvas
 *
 * Canvas dashboard: recent boards, templates, create flow.
 * Boards are grouped by type: Meeting Boards, Project Boards, Whiteboards.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CanvasBoard {
  id: string;
  title: string;
  description?: string;
  boardType: string;
  status: string;
  isPublic: boolean;
  isLocked: boolean;
  elementCount: number;
  lastActivityAt: string;
  background: string;
  thumbnailUrl?: string;
  owner: { id: string; displayName: string; avatarUrl?: string };
  participants: {
    id: string;
    role: string;
    user: { id: string; displayName: string; avatarUrl?: string };
  }[];
  _count: { elements: number; comments: number; sessions: number };
}

interface CanvasTemplate {
  id: string;
  name: string;
  description?: string;
  boardType: string;
  thumbnailUrl?: string;
  isSystem: boolean;
  category?: string;
  tags: string[];
  useCount: number;
  creator?: { id: string; displayName: string };
}

interface BoardsResponse {
  boards: CanvasBoard[];
  total: number;
  page: number;
  limit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BOARD_TYPE_LABELS: Record<string, string> = {
  WHITEBOARD: "Tableau blanc",
  MEETING_BOARD: "Tableau de réunion",
  PROJECT_BOARD: "Tableau de projet",
  DOCUMENT_BOARD: "Tableau de document",
  WORKFLOW_BOARD: "Tableau de workflow",
  CODE_BOARD: "Espace code",
  DIAGRAM_BOARD: "Diagramme",
  BRAINSTORM_BOARD: "Brainstorming",
};

const BOARD_TYPE_COLORS: Record<string, string> = {
  WHITEBOARD: "bg-blue-500/10 text-blue-400",
  MEETING_BOARD: "bg-violet-500/10 text-violet-400",
  PROJECT_BOARD: "bg-emerald-500/10 text-emerald-400",
  DOCUMENT_BOARD: "bg-amber-500/10 text-amber-400",
  WORKFLOW_BOARD: "bg-cyan-500/10 text-cyan-400",
  CODE_BOARD: "bg-rose-500/10 text-rose-400",
  DIAGRAM_BOARD: "bg-indigo-500/10 text-indigo-400",
  BRAINSTORM_BOARD: "bg-orange-500/10 text-orange-400",
};

const BOARD_TYPE_ICONS: Record<string, string> = {
  WHITEBOARD: "⬜",
  MEETING_BOARD: "📹",
  PROJECT_BOARD: "📋",
  DOCUMENT_BOARD: "📄",
  WORKFLOW_BOARD: "🔄",
  CODE_BOARD: "💻",
  DIAGRAM_BOARD: "🔷",
  BRAINSTORM_BOARD: "💡",
};

function timeAgo(date: string): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

function Avatar({ name, url, size = "sm" }: { name: string; url?: string; size?: "sm" | "xs" }) {
  const cls = size === "xs" ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-xs";
  if (url) return <img src={url} alt={name} className={`${cls} rounded-full object-cover`} />;
  return (
    <div
      className={`${cls} rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold`}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Board card ───────────────────────────────────────────────────────────────

function BoardCard({ board }: { board: CanvasBoard }) {
  const typeColor = BOARD_TYPE_COLORS[board.boardType] ?? "bg-gray-500/10 text-gray-400";
  const typeLabel = BOARD_TYPE_LABELS[board.boardType] ?? board.boardType;
  const typeIcon = BOARD_TYPE_ICONS[board.boardType] ?? "🎨";

  return (
    <Link
      href={`/admin/canvas/${board.id}`}
      className="group relative flex flex-col rounded-xl border border-white/10 bg-gray-900 overflow-hidden hover:border-indigo-500/50 transition-all duration-200"
    >
      {/* Thumbnail / color strip */}
      <div
        className="h-32 w-full flex items-center justify-center text-4xl relative"
        style={{ backgroundColor: board.background }}
      >
        {board.thumbnailUrl ? (
          <img src={board.thumbnailUrl} alt={board.title} className="h-full w-full object-cover" />
        ) : (
          <span className="opacity-20 text-5xl">{typeIcon}</span>
        )}
        {board.isLocked && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                clipRule="evenodd"
              />
            </svg>
            Verrouillé
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
            {board.title}
          </h3>
          <span
            className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColor}`}
          >
            {typeLabel}
          </span>
        </div>

        {board.description && (
          <p className="text-xs text-gray-400 line-clamp-2">{board.description}</p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/5">
          {/* Participants */}
          <div className="flex -space-x-1.5">
            {board.participants.slice(0, 4).map((p) => (
              <Avatar
                key={p.id}
                name={p.user.displayName}
                {...(p.user.avatarUrl ? { url: p.user.avatarUrl } : {})}
                size="xs"
              />
            ))}
            {board.participants.length > 4 && (
              <div className="h-5 w-5 rounded-full bg-gray-700 flex items-center justify-center text-[9px] text-gray-300">
                +{board.participants.length - 4}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span title="Éléments">{board._count.elements} él.</span>
            <span title="Commentaires">{board._count.comments} 💬</span>
            <span>{timeAgo(board.lastActivityAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  tpl,
  onCreate,
}: {
  tpl: CanvasTemplate;
  onCreate: (templateId: string, boardType: string) => void;
}) {
  const typeColor = BOARD_TYPE_COLORS[tpl.boardType] ?? "bg-gray-500/10 text-gray-400";
  const typeIcon = BOARD_TYPE_ICONS[tpl.boardType] ?? "🎨";

  return (
    <button
      onClick={() => onCreate(tpl.id, tpl.boardType)}
      className="text-left flex flex-col gap-2 rounded-xl border border-white/10 bg-gray-900 p-4 hover:border-indigo-500/40 hover:bg-gray-800/60 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center text-xl">
          {typeIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{tpl.name}</div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeColor}`}>
            {BOARD_TYPE_LABELS[tpl.boardType] ?? tpl.boardType}
          </span>
        </div>
        {tpl.isSystem && (
          <span className="text-[10px] bg-indigo-900/50 text-indigo-400 px-1.5 py-0.5 rounded">
            Système
          </span>
        )}
      </div>
      {tpl.description && <p className="text-xs text-gray-400 line-clamp-2">{tpl.description}</p>}
      <div className="text-[11px] text-gray-600">{tpl.useCount} utilisations</div>
    </button>
  );
}

// ─── Create board modal ───────────────────────────────────────────────────────

function CreateBoardModal({
  open,
  onClose,
  onCreate,
  defaultType,
  defaultTemplateId,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; boardType: string; templateId?: string }) => void;
  defaultType?: string;
  defaultTemplateId?: string;
}) {
  const [title, setTitle] = useState("");
  const [boardType, setBoardType] = useState(defaultType ?? "WHITEBOARD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setBoardType(defaultType ?? "WHITEBOARD");
    }
  }, [open, defaultType]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const data: { title: string; boardType: string; templateId?: string } = {
      title: title.trim(),
      boardType,
    };
    if (defaultTemplateId) data.templateId = defaultTemplateId;
    onCreate(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Nouveau tableau</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Titre du tableau
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mon tableau collaboratif..."
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Type de tableau
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BOARD_TYPE_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBoardType(type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    boardType === type
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                      : "border-white/10 bg-gray-800 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <span>{BOARD_TYPE_ICONS[type]}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white disabled:opacity-40 transition-colors"
            >
              {loading ? "Création..." : "Créer le tableau"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function CanvasDashboardContent() {
  const router = useRouter();
  const [boards, setBoards] = useState<CanvasBoard[]>([]);
  const [templates, setTemplates] = useState<CanvasTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createDefaultType, setCreateDefaultType] = useState<string | undefined>();
  const [createDefaultTemplate, setCreateDefaultTemplate] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  useEffect(() => {
    Promise.all([
      apiGet<BoardsResponse>("/v1/canvas"),
      apiGet<CanvasTemplate[]>("/v1/canvas/templates"),
    ])
      .then(([boardsRes, tplRes]) => {
        setBoards(boardsRes.boards);
        setTemplates(tplRes);
      })
      .catch(() => setError("Impossible de charger les tableaux"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(data: { title: string; boardType: string; templateId?: string }) {
    try {
      const board = await apiPost<CanvasBoard>("/v1/canvas", data);
      router.push(`/admin/canvas/${board.id}`);
    } catch {
      setError("Impossible de créer le tableau");
      setShowCreate(false);
    }
  }

  function openCreateWithTemplate(templateId: string, boardType: string) {
    setCreateDefaultTemplate(templateId);
    setCreateDefaultType(boardType);
    setShowCreate(true);
  }

  const filtered = boards.filter((b) => {
    if (activeFilter !== "ALL" && b.boardType !== activeFilter) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filterOptions = [
    { value: "ALL", label: "Tous" },
    { value: "WHITEBOARD", label: "Blancs" },
    { value: "MEETING_BOARD", label: "Réunions" },
    { value: "PROJECT_BOARD", label: "Projets" },
    { value: "CODE_BOARD", label: "Code" },
  ];

  return (
    <div className="flex flex-col gap-8 p-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Canvas</h1>
          <p className="mt-1 text-sm text-gray-400">
            Espace collaboratif — tableaux, diagrammes, brainstorming et code
          </p>
        </div>
        <button
          onClick={() => {
            setCreateDefaultType(undefined);
            setCreateDefaultTemplate(undefined);
            setShowCreate(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Nouveau tableau
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4">
          {error}
        </div>
      )}

      {/* Quick create tiles */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Démarrer rapidement
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {Object.entries(BOARD_TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              onClick={() => {
                setCreateDefaultType(type);
                setCreateDefaultTemplate(undefined);
                setShowCreate(true);
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-900 border border-white/10 hover:border-indigo-500/40 hover:bg-gray-800/60 transition-all text-center"
            >
              <span className="text-2xl">{BOARD_TYPE_ICONS[type]}</span>
              <span className="text-[11px] text-gray-400 leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Templates */}
      {templates.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Modèles ({templates.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {templates.slice(0, 8).map((tpl) => (
              <TemplateCard key={tpl.id} tpl={tpl} onCreate={openCreateWithTemplate} />
            ))}
          </div>
        </section>
      )}

      {/* Boards */}
      <section className="flex-1">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Mes tableaux ({filtered.length})
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter chips */}
            <div className="flex items-center gap-1">
              {filterOptions.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeFilter === f.value
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-8 pr-3 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-52 rounded-xl bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🎨</div>
            <p className="text-gray-400 text-sm">
              {search
                ? "Aucun tableau ne correspond à votre recherche"
                : "Aucun tableau pour l'instant"}
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
            >
              Créer un tableau
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((b) => (
              <BoardCard key={b.id} board={b} />
            ))}
          </div>
        )}
      </section>

      {/* Create modal */}
      <CreateBoardModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        {...(createDefaultType ? { defaultType: createDefaultType } : {})}
        {...(createDefaultTemplate ? { defaultTemplateId: createDefaultTemplate } : {})}
      />
    </div>
  );
}

export default function CanvasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>
      }
    >
      <CanvasDashboardContent />
    </Suspense>
  );
}
