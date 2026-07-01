"use client";

/**
 * Prinodia Canvas v1.6.0 — /admin/canvas/[id]
 *
 * Board detail with:
 * - Infinite canvas surface (pan + zoom via pointer/wheel)
 * - Full toolbar (Select, Pencil, Highlighter, Eraser, Text, Sticky Note,
 *   Shape, Connector, Arrow, Comment, Code Block, Image, Laser Pointer)
 * - Participants panel (People integration)
 * - Comments panel
 * - Export panel
 * - Presence avatars (live cursor identity placeholders)
 * - Zoom controls + mini-map placeholder
 * - Undo/redo placeholder
 *
 * Phase 5 Meet integration: "Ouvrir dans Meet" button activates the
 * disabled Canvas button in the Meet live sidebar (see meet/page.tsx).
 */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Board {
  id: string;
  title: string;
  boardType: string;
  background: string;
  isLocked: boolean;
  elementCount: number;
  lastActivityAt: string;
  owner: { id: string; displayName: string; avatarUrl?: string };
  participants: Participant[];
  _count: { elements: number; comments: number };
}

interface Participant {
  id: string;
  role: string;
  user: { id: string; displayName: string; avatarUrl?: string };
}

interface Comment {
  id: string;
  content: string;
  posX?: number;
  posY?: number;
  isResolved: boolean;
  createdAt: string;
  author: { id: string; displayName: string; avatarUrl?: string };
  replies: Comment[];
}

interface Element {
  id: string;
  elementType: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  data: Record<string, unknown>;
  style: Record<string, unknown>;
  layerIndex: number;
}

type Tool =
  | "select"
  | "pencil"
  | "highlighter"
  | "eraser"
  | "text"
  | "sticky"
  | "shape"
  | "connector"
  | "arrow"
  | "comment"
  | "code"
  | "image"
  | "laser";

type Panel = "participants" | "comments" | "export" | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOLS: { id: Tool; label: string; icon: string; shortcut?: string }[] = [
  { id: "select", label: "Sélectionner", icon: "↖", shortcut: "V" },
  { id: "pencil", label: "Crayon", icon: "✏️", shortcut: "P" },
  { id: "highlighter", label: "Surligneur", icon: "🖌", shortcut: "H" },
  { id: "eraser", label: "Gomme", icon: "⬜", shortcut: "E" },
  { id: "text", label: "Texte", icon: "T", shortcut: "T" },
  { id: "sticky", label: "Post-it", icon: "🟡", shortcut: "S" },
  { id: "shape", label: "Forme", icon: "⬡", shortcut: "R" },
  { id: "connector", label: "Connecteur", icon: "―" },
  { id: "arrow", label: "Flèche", icon: "→" },
  { id: "comment", label: "Commentaire", icon: "💬", shortcut: "C" },
  { id: "code", label: "Bloc code", icon: "</>", shortcut: "K" },
  { id: "image", label: "Image", icon: "🖼" },
  { id: "laser", label: "Laser", icon: "🔴", shortcut: "L" },
];

const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

// ─── Small helpers ────────────────────────────────────────────────────────────

function Avatar({
  name,
  url,
  size = "sm",
  color,
}: {
  name: string;
  url?: string;
  size?: "sm" | "xs" | "md";
  color?: string;
}) {
  const cls =
    size === "xs" ? "h-5 w-5 text-[9px]" : size === "md" ? "h-9 w-9 text-sm" : "h-7 w-7 text-xs";
  const bg = color ?? "#6366F1";
  if (url) return <img src={url} alt={name} className={`${cls} rounded-full object-cover`} />;
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ backgroundColor: bg }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({
  activeTool,
  onSelect,
  isLocked,
}: {
  activeTool: Tool;
  onSelect: (t: Tool) => void;
  isLocked: boolean;
}) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 flex items-center gap-1 bg-gray-900 border border-white/10 rounded-2xl px-3 py-2 shadow-2xl">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          disabled={isLocked}
          onClick={() => onSelect(t.id)}
          title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ""}`}
          className={`relative h-9 w-9 flex items-center justify-center rounded-xl text-sm transition-all ${
            activeTool === t.id
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {t.icon}
          {t.shortcut && (
            <span className="absolute -top-1 -right-1 text-[8px] bg-gray-700 text-gray-400 rounded px-0.5 leading-tight">
              {t.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Properties panel (right side) ───────────────────────────────────────────

function ParticipantsPanel({ participants }: { participants: Participant[] }) {
  const roleColors: Record<string, string> = {
    OWNER: "text-amber-400",
    EDITOR: "text-indigo-400",
    PRESENTER: "text-violet-400",
    VIEWER: "text-gray-400",
  };
  const roleLabels: Record<string, string> = {
    OWNER: "Propriétaire",
    EDITOR: "Éditeur",
    PRESENTER: "Présentateur",
    VIEWER: "Observateur",
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Participants ({participants.length})
      </h3>
      {participants.map((p) => (
        <div key={p.id} className="flex items-center gap-3 py-1">
          <Avatar
            name={p.user.displayName}
            {...(p.user.avatarUrl ? { url: p.user.avatarUrl } : {})}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{p.user.displayName}</div>
            <div className={`text-[11px] ${roleColors[p.role] ?? "text-gray-400"}`}>
              {roleLabels[p.role] ?? p.role}
            </div>
          </div>
          {/* Live status placeholder */}
          <div className="h-2 w-2 rounded-full bg-gray-600" title="Hors ligne" />
        </div>
      ))}
      {participants.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">Aucun participant</p>
      )}
    </div>
  );
}

function CommentsPanel({
  comments,
  onResolve,
}: {
  comments: Comment[];
  onResolve: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 overflow-y-auto">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Commentaires ({comments.filter((c) => !c.isResolved).length} ouverts)
      </h3>
      {comments.map((c) => (
        <div
          key={c.id}
          className={`rounded-lg border p-3 ${c.isResolved ? "border-white/5 opacity-50" : "border-white/10 bg-gray-800/40"}`}
        >
          <div className="flex items-start gap-2">
            <Avatar
              name={c.author.displayName}
              {...(c.author.avatarUrl ? { url: c.author.avatarUrl } : {})}
              size="xs"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-white">{c.author.displayName}</div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{c.content}</p>
              {c.replies.length > 0 && (
                <div className="mt-2 pl-2 border-l border-white/10 flex flex-col gap-1">
                  {c.replies.map((r) => (
                    <div key={r.id} className="text-xs text-gray-400">
                      <span className="font-medium text-gray-300">{r.author.displayName}: </span>
                      {r.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!c.isResolved && (
              <button
                onClick={() => onResolve(c.id)}
                className="text-[10px] text-gray-500 hover:text-indigo-400 transition-colors shrink-0"
                title="Résoudre"
              >
                ✓
              </button>
            )}
          </div>
        </div>
      ))}
      {comments.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">Aucun commentaire</p>
      )}
    </div>
  );
}

const EXPORT_FORMATS = [
  { id: "PNG", label: "PNG", desc: "Image haute résolution", icon: "🖼" },
  { id: "PDF", label: "PDF", desc: "Document imprimable", icon: "📄" },
  { id: "SVG", label: "SVG", desc: "Vecteur scalable", icon: "✦" },
  { id: "JSON", label: "JSON", desc: "Données brutes", icon: "{ }" },
];

function ExportPanel({
  boardId,
  onExport,
}: {
  boardId: string;
  onExport: (format: string) => void;
}) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function handleExport(format: string) {
    setExporting(format);
    await onExport(format);
    setExporting(null);
    setDone(format);
    setTimeout(() => setDone(null), 3000);
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Exporter
      </h3>
      {EXPORT_FORMATS.map((f) => (
        <button
          key={f.id}
          onClick={() => handleExport(f.id)}
          disabled={!!exporting}
          className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 border border-white/10 hover:border-indigo-500/30 hover:bg-gray-800 transition-all text-left disabled:opacity-50"
        >
          <span className="text-xl">{f.icon}</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{f.label}</div>
            <div className="text-[11px] text-gray-500">{f.desc}</div>
          </div>
          {done === f.id ? (
            <span className="text-[11px] text-emerald-400">✓ Demandé</span>
          ) : exporting === f.id ? (
            <div className="h-3 w-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      ))}
      <p className="text-[11px] text-gray-600 mt-2 text-center">
        Le rendu réel est disponible dans une prochaine version (v2.0.0 Drive).
      </p>
    </div>
  );
}

// ─── Infinite canvas surface ──────────────────────────────────────────────────

function CanvasSurface({
  boardId,
  background,
  activeTool,
  elements,
  isLocked,
  onAddElement,
}: {
  boardId: string;
  background: string;
  activeTool: Tool;
  elements: Element[];
  isLocked: boolean;
  onAddElement: (el: Partial<Element>) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [vp, setVp] = useState({ x: 0, y: 0, zoom: 1 });
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const [pencilPath, setPencilPath] = useState<string>("");
  const drawing = useRef(false);
  const pathPoints = useRef<{ x: number; y: number }[]>([]);

  // Convert screen coords to canvas coords
  function screenToCanvas(sx: number, sy: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (sx - rect.left - vp.x) / vp.zoom,
      y: (sy - rect.top - vp.y) / vp.zoom,
    };
  }

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Pinch-to-zoom
      const delta = -e.deltaY * 0.002;
      const rect = svgRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setVp((prev) => {
        const newZoom = Math.max(0.05, Math.min(8, prev.zoom * (1 + delta)));
        const scale = newZoom / prev.zoom;
        return {
          zoom: newZoom,
          x: mx - scale * (mx - prev.x),
          y: my - scale * (my - prev.y),
        };
      });
    } else {
      // Pan
      setVp((prev) => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (isLocked) return;
    if (activeTool === "select" || e.button === 1) {
      isPanning.current = true;
      lastPan.current = { x: e.clientX, y: e.clientY };
      (e.target as SVGSVGElement).setPointerCapture?.(e.pointerId);
      return;
    }
    if (activeTool === "pencil" || activeTool === "highlighter") {
      drawing.current = true;
      const pt = screenToCanvas(e.clientX, e.clientY);
      pathPoints.current = [pt];
      setPencilPath(`M ${pt.x} ${pt.y}`);
      (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    }
    if (activeTool === "sticky") {
      const pt = screenToCanvas(e.clientX, e.clientY);
      onAddElement({ elementType: "STICKY_NOTE", x: pt.x, y: pt.y, width: 160, height: 160 });
    }
    if (activeTool === "text") {
      const pt = screenToCanvas(e.clientX, e.clientY);
      onAddElement({ elementType: "TEXT", x: pt.x, y: pt.y });
    }
    if (activeTool === "code") {
      const pt = screenToCanvas(e.clientX, e.clientY);
      onAddElement({ elementType: "CODE_BLOCK", x: pt.x, y: pt.y, width: 360, height: 200 });
    }
    if (activeTool === "shape") {
      const pt = screenToCanvas(e.clientX, e.clientY);
      onAddElement({ elementType: "SHAPE", x: pt.x, y: pt.y, width: 120, height: 80 });
    }
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (isPanning.current) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      setVp((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPan.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (drawing.current) {
      const pt = screenToCanvas(e.clientX, e.clientY);
      pathPoints.current.push(pt);
      setPencilPath((prev) => `${prev} L ${pt.x} ${pt.y}`);
    }
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    if (drawing.current) {
      drawing.current = false;
      if (pathPoints.current.length > 1) {
        onAddElement({
          elementType: activeTool === "highlighter" ? "HIGHLIGHTER_STROKE" : "PENCIL_STROKE",
          data: {
            points: pathPoints.current,
            color: activeTool === "highlighter" ? "#FACC15" : "#FFFFFF",
          },
          x: 0,
          y: 0,
        });
      }
      setPencilPath("");
      pathPoints.current = [];
    }
  }

  // Render element on canvas
  function renderElement(el: Element) {
    const style = (el.style ?? {}) as Record<string, string>;

    if (el.elementType === "PENCIL_STROKE" || el.elementType === "HIGHLIGHTER_STROKE") {
      const pts = ((el.data as Record<string, unknown>)?.["points"] ?? []) as Array<{
        x: number;
        y: number;
      }>;
      if (pts.length < 2) return null;
      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      return (
        <path
          key={el.id}
          d={d}
          stroke={((el.data as Record<string, unknown>)?.["color"] as string) ?? "#fff"}
          strokeWidth={el.elementType === "HIGHLIGHTER_STROKE" ? 16 : 2}
          strokeOpacity={el.elementType === "HIGHLIGHTER_STROKE" ? 0.5 : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );
    }

    if (el.elementType === "STICKY_NOTE") {
      const color = ((el.data as Record<string, unknown>)?.["color"] as string) ?? "#FACC15";
      return (
        <g key={el.id} transform={`translate(${el.x},${el.y})`}>
          <rect
            width={el.width ?? 160}
            height={el.height ?? 160}
            rx={8}
            fill={color}
            opacity={0.9}
          />
          <text x={10} y={28} fontSize={13} fill="#1f2937" fontFamily="system-ui" fontWeight={500}>
            {((el.data as Record<string, unknown>)?.["text"] as string) ?? "Note..."}
          </text>
        </g>
      );
    }

    if (el.elementType === "TEXT") {
      return (
        <g key={el.id} transform={`translate(${el.x},${el.y})`}>
          <text
            fontSize={((el.data as Record<string, unknown>)?.["fontSize"] as number) ?? 16}
            fill={((el.data as Record<string, unknown>)?.["color"] as string) ?? "#fff"}
            fontFamily="system-ui"
          >
            {((el.data as Record<string, unknown>)?.["text"] as string) ?? "Texte..."}
          </text>
        </g>
      );
    }

    if (el.elementType === "SHAPE") {
      return (
        <g key={el.id} transform={`translate(${el.x},${el.y})`}>
          <rect
            width={el.width ?? 120}
            height={el.height ?? 80}
            rx={8}
            fill={((el.style as Record<string, unknown>)?.["fill"] as string) ?? "none"}
            stroke={((el.style as Record<string, unknown>)?.["stroke"] as string) ?? "#6366F1"}
            strokeWidth={2}
          />
        </g>
      );
    }

    if (el.elementType === "CODE_BLOCK") {
      const w = el.width ?? 360;
      const h = el.height ?? 200;
      return (
        <g key={el.id} transform={`translate(${el.x},${el.y})`}>
          <rect width={w} height={h} rx={8} fill="#1e1e2e" stroke="#6366F1" strokeWidth={1.5} />
          <rect width={w} height={28} rx="8 8 0 0" fill="#2d2d44" />
          <circle cx={14} cy={14} r={5} fill="#ef4444" />
          <circle cx={28} cy={14} r={5} fill="#f59e0b" />
          <circle cx={42} cy={14} r={5} fill="#10b981" />
          <text x={12} y={48} fontSize={12} fill="#a5b4fc" fontFamily="monospace" opacity={0.9}>
            {((el.data as Record<string, unknown>)?.["language"] as string) ?? "// Code..."}
          </text>
        </g>
      );
    }

    return null;
  }

  const cursor =
    activeTool === "select"
      ? "default"
      : activeTool === "pencil" || activeTool === "highlighter"
        ? "crosshair"
        : activeTool === "eraser"
          ? "cell"
          : activeTool === "laser"
            ? "crosshair"
            : "crosshair";

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      style={{ cursor, touchAction: "none", background: background }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Dot grid */}
      <defs>
        <pattern
          id="grid"
          x={vp.x % (20 * vp.zoom)}
          y={vp.y % (20 * vp.zoom)}
          width={20 * vp.zoom}
          height={20 * vp.zoom}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={1} cy={1} r={0.5} fill="rgba(255,255,255,0.08)" />
        </pattern>
      </defs>
      <rect x={0} y={0} width="100%" height="100%" fill="url(#grid)" />

      {/* Canvas content */}
      <g transform={`translate(${vp.x},${vp.y}) scale(${vp.zoom})`}>
        {elements.map(renderElement)}

        {/* Active pencil stroke preview */}
        {pencilPath && (
          <path
            d={pencilPath}
            stroke={activeTool === "highlighter" ? "#FACC15" : "#FFFFFF"}
            strokeWidth={activeTool === "highlighter" ? 16 / vp.zoom : 2 / vp.zoom}
            strokeOpacity={activeTool === "highlighter" ? 0.5 : 1}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </g>
    </svg>
  );
}

// ─── Zoom controls ────────────────────────────────────────────────────────────

function ZoomControls({ zoom, onZoom }: { zoom: number; onZoom: (z: number) => void }) {
  function stepZoom(dir: 1 | -1) {
    const idx = ZOOM_LEVELS.findIndex((z) => z >= zoom);
    const next = ZOOM_LEVELS[Math.max(0, Math.min(ZOOM_LEVELS.length - 1, idx + dir))];
    if (next) onZoom(next);
  }

  return (
    <div className="absolute bottom-24 right-5 z-20 flex flex-col items-center gap-1 bg-gray-900 border border-white/10 rounded-xl p-1.5 shadow-xl">
      <button
        onClick={() => stepZoom(1)}
        className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-lg transition-colors"
      >
        +
      </button>
      <span className="text-[11px] text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
      <button
        onClick={() => stepZoom(-1)}
        className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-lg transition-colors"
      >
        −
      </button>
      <div className="w-full h-px bg-white/10 my-0.5" />
      <button
        onClick={() => onZoom(1)}
        className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-[10px] transition-colors"
        title="Réinitialiser"
      >
        1:1
      </button>
      <button
        onClick={() => onZoom(0.5)}
        className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-[10px] transition-colors"
        title="Vue d'ensemble"
      >
        ⊡
      </button>
    </div>
  );
}

// ─── Mini-map placeholder ─────────────────────────────────────────────────────

function MiniMap({ elementCount }: { elementCount: number }) {
  return (
    <div className="absolute bottom-24 left-5 z-20 w-36 h-24 bg-gray-900/90 border border-white/10 rounded-xl overflow-hidden shadow-xl flex items-center justify-center">
      <div className="text-center">
        <div className="text-[10px] text-gray-600 mb-0.5">Mini-map</div>
        <div className="text-[10px] text-gray-700">{elementCount} éléments</div>
      </div>
      {/* Placeholder grid */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <pattern id="mm-grid" width={8} height={8} patternUnits="userSpaceOnUse">
            <circle cx={1} cy={1} r={0.4} fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mm-grid)" />
      </svg>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function CanvasBoardContent() {
  const params = useParams();
  const boardId = params["id"] as string;
  const router = useRouter();

  const [board, setBoard] = useState<Board | null>(null);
  const [elements, setElements] = useState<Element[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [zoom, setZoom] = useState(1);

  // Undo/redo placeholder stacks
  const [undoStack] = useState<unknown[]>([]);
  const [redoStack] = useState<unknown[]>([]);

  useEffect(() => {
    Promise.all([
      apiGet<Board>(`/v1/canvas/${boardId}`),
      apiGet<Element[]>(`/v1/canvas/${boardId}/elements`),
      apiGet<Comment[]>(`/v1/canvas/${boardId}/comments`),
    ])
      .then(([b, els, cms]) => {
        setBoard(b);
        setElements(els);
        setComments(cms);
      })
      .catch(() => setError("Impossible de charger le tableau"))
      .finally(() => setLoading(false));
  }, [boardId]);

  // Keyboard shortcuts for tools
  useEffect(() => {
    const map: Record<string, Tool> = {
      v: "select",
      p: "pencil",
      h: "highlighter",
      e: "eraser",
      t: "text",
      s: "sticky",
      r: "shape",
      c: "comment",
      k: "code",
      l: "laser",
    };
    function onKey(ev: KeyboardEvent) {
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
      const tool = map[ev.key.toLowerCase()];
      if (tool) setActiveTool(tool);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleAddElement(partial: Partial<Element>) {
    try {
      const created = await apiPost<Element>(`/v1/canvas/${boardId}/elements`, {
        elementType: partial.elementType ?? "TEXT",
        x: partial.x ?? 0,
        y: partial.y ?? 0,
        width: partial.width,
        height: partial.height,
        data: partial.data ?? {},
        style: partial.style ?? {},
      });
      setElements((prev) => [...prev, created]);
    } catch {
      // Silent fail — element will re-sync on next load
    }
  }

  async function handleResolveComment(commentId: string) {
    try {
      await apiPost(`/v1/canvas/${boardId}/comments/${commentId}/resolve`);
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, isResolved: true } : c)));
    } catch {
      // ignore
    }
  }

  async function handleExport(format: string) {
    try {
      await apiPost(`/v1/canvas/${boardId}/exports`, { format });
    } catch {
      // ignore
    }
  }

  const panelIcons: Record<Exclude<Panel, null>, string> = {
    participants: "👥",
    comments: "💬",
    export: "⬇",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement du tableau...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-red-400">{error ?? "Tableau introuvable"}</p>
        <Link href="/admin/canvas" className="text-sm text-indigo-400 hover:underline">
          ← Retour aux tableaux
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      {/* Top bar */}
      <div className="h-12 shrink-0 flex items-center gap-3 px-4 bg-gray-900 border-b border-white/10 z-30">
        <Link href="/admin/canvas" className="text-gray-500 hover:text-white transition-colors">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
        </Link>

        <div className="h-4 w-px bg-white/10" />

        <h1 className="text-sm font-semibold text-white truncate max-w-xs">{board.title}</h1>
        {board.isLocked && (
          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
            Verrouillé
          </span>
        )}

        {/* Presence avatars */}
        <div className="flex -space-x-1.5 ml-2">
          {board.participants.slice(0, 5).map((p) => (
            <div key={p.id} title={p.user.displayName}>
              <Avatar
                name={p.user.displayName}
                {...(p.user.avatarUrl ? { url: p.user.avatarUrl } : {})}
                size="xs"
              />
            </div>
          ))}
          {board.participants.length > 5 && (
            <div className="h-5 w-5 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-[9px] text-gray-300">
              +{board.participants.length - 5}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Undo/redo placeholders */}
          <button
            disabled={undoStack.length === 0}
            className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-30 transition-colors rounded-lg hover:bg-gray-800"
            title="Annuler (Ctrl+Z)"
          >
            ↩
          </button>
          <button
            disabled={redoStack.length === 0}
            className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-30 transition-colors rounded-lg hover:bg-gray-800"
            title="Rétablir (Ctrl+Y)"
          >
            ↪
          </button>

          <div className="w-px h-4 bg-white/10" />

          {/* Panel toggles */}
          {(Object.keys(panelIcons) as Exclude<Panel, null>[]).map((p) => (
            <button
              key={p}
              onClick={() => setActivePanel(activePanel === p ? null : p)}
              className={`h-7 w-7 flex items-center justify-center text-sm rounded-lg transition-all ${
                activePanel === p
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
              title={p}
            >
              {panelIcons[p]}
            </button>
          ))}

          <div className="w-px h-4 bg-white/10" />

          {/* Share placeholder */}
          <button className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors">
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" />
            </svg>
            Partager
          </button>
        </div>
      </div>

      {/* Body: canvas + right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="relative flex-1 overflow-hidden">
          <CanvasSurface
            boardId={boardId}
            background={board.background}
            activeTool={activeTool}
            elements={elements}
            isLocked={board.isLocked}
            onAddElement={handleAddElement}
          />

          <Toolbar activeTool={activeTool} onSelect={setActiveTool} isLocked={board.isLocked} />
          <ZoomControls zoom={zoom} onZoom={setZoom} />
          <MiniMap elementCount={board._count.elements} />

          {/* Canvas info strip */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 mb-14 flex items-center gap-3 pointer-events-none">
            {board.isLocked && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3 py-1.5 rounded-full">
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                    clipRule="evenodd"
                  />
                </svg>
                Tableau verrouillé — lecture seule
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        {activePanel && (
          <div className="w-72 shrink-0 border-l border-white/10 bg-gray-900 overflow-y-auto">
            {activePanel === "participants" && (
              <ParticipantsPanel participants={board.participants} />
            )}
            {activePanel === "comments" && (
              <CommentsPanel comments={comments} onResolve={handleResolveComment} />
            )}
            {activePanel === "export" && <ExportPanel boardId={boardId} onExport={handleExport} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CanvasBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-gray-950">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CanvasBoardContent />
    </Suspense>
  );
}
