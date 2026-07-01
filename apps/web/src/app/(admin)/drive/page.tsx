"use client";

/**
 * Prinodia Drive v1.7.0 — /admin/drive
 *
 * File explorer with grid/list toggle, folder navigation, upload,
 * search, recent, favorites, recycle bin, and storage quota.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriveOwner {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

interface DriveItem {
  id: string;
  name: string;
  type: "FILE" | "FOLDER";
  status: string;
  mimeType?: string;
  extension?: string;
  sizeBytes?: number;
  parentId?: string;
  thumbnailUrl?: string;
  previewStatus: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  owner: DriveOwner;
  _count?: { children: number };
}

interface Breadcrumb {
  id: string;
  name: string;
  type: string;
  parentId?: string;
}

interface StorageQuota {
  totalBytes: number;
  usedBytes: number;
  fileCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes?: number): string {
  if (!bytes) return "0 o";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMimeIcon(item: DriveItem): string {
  if (item.type === "FOLDER") return "📁";
  const m = item.mimeType ?? "";
  const e = item.extension ?? "";
  if (m.startsWith("image/")) return "🖼️";
  if (m === "application/pdf" || e === "pdf") return "📄";
  if (m.includes("word") || ["doc", "docx"].includes(e)) return "📝";
  if (m.includes("spreadsheet") || m.includes("excel") || ["xls", "xlsx"].includes(e)) return "📊";
  if (m.includes("presentation") || m.includes("powerpoint") || ["ppt", "pptx"].includes(e))
    return "📋";
  if (m.startsWith("video/")) return "🎬";
  if (m.startsWith("audio/")) return "🎵";
  if (m.includes("zip") || m.includes("compressed") || ["zip", "tar", "gz"].includes(e))
    return "🗜️";
  if (["js", "ts", "tsx", "jsx", "py", "java", "go", "rs"].includes(e)) return "💻";
  return "📃";
}

// ─── Upload Zone Component ────────────────────────────────────────────────────

function UploadZone({ parentId, onUploaded }: { parentId?: string; onUploaded: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const url = parentId ? `/v1/drive/upload?parentId=${parentId}` : "/v1/drive/upload";
        await apiPost(url, form);
        onUploaded();
      } catch {
        alert("Échec de l'upload");
      } finally {
        setUploading(false);
      }
    },
    [parentId, onUploaded],
  );

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors ${
        dragging
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
          : "border-gray-300 dark:border-gray-700 hover:border-indigo-400"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        for (const f of files) await uploadFile(f);
      }}
    >
      <div className="text-4xl">☁️</div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Glissez des fichiers ici ou
      </p>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {uploading ? "Upload en cours…" : "Choisir des fichiers"}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          for (const f of files) await uploadFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({ item, view }: { item: DriveItem; view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <Link
        href={`/admin/drive/${item.id}`}
        className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
      >
        <span className="text-2xl flex-shrink-0">{getMimeIcon(item)}</span>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {item.name}
            {item.isLocked && <span className="ml-1 text-xs text-amber-500">🔒</span>}
          </p>
          <p className="text-xs text-gray-500">
            {item.owner.displayName} · {formatDate(item.updatedAt)}
          </p>
        </div>
        <div className="flex-shrink-0 text-right text-xs text-gray-400">
          {item.type === "FOLDER"
            ? `${item._count?.children ?? 0} élément(s)`
            : formatBytes(item.sizeBytes)}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/admin/drive/${item.id}`}
      className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-indigo-400 hover:shadow-md transition-all group"
    >
      <div className="text-4xl">{getMimeIcon(item)}</div>
      <p className="w-full truncate text-center text-sm font-medium text-gray-800 dark:text-gray-200">
        {item.name}
        {item.isLocked && <span className="ml-1 text-xs text-amber-500">🔒</span>}
      </p>
      <p className="text-xs text-gray-400">
        {item.type === "FOLDER"
          ? `${item._count?.children ?? 0} élément(s)`
          : formatBytes(item.sizeBytes)}
      </p>
    </Link>
  );
}

// ─── Quota Bar ────────────────────────────────────────────────────────────────

function QuotaBar({ quota }: { quota: StorageQuota }) {
  const pct = Math.min(100, (quota.usedBytes / quota.totalBytes) * 100);
  const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-indigo-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className={`${color} h-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {formatBytes(quota.usedBytes)} / {formatBytes(quota.totalBytes)}
      </span>
    </div>
  );
}

// ─── New Folder Modal ──────────────────────────────────────────────────────────

function NewFolderModal({
  parentId,
  onCreated,
  onClose,
}: {
  parentId?: string;
  onCreated: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await apiPost("/v1/drive/folders", { name: name.trim(), parentId });
      onCreated();
      onClose();
    } catch {
      alert("Erreur lors de la création du dossier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Nouveau dossier
        </h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Nom du dossier"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Création…" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DrivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parentId") ?? undefined;

  const [items, setItems] = useState<DriveItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [tab, setTab] = useState<"browse" | "recent" | "favorites" | "trash">("browse");
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [search, setSearch] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsData, quotaData] = await Promise.all([
        apiGet<DriveItem[]>(`/v1/drive${parentId ? `?parentId=${parentId}` : ""}`),
        apiGet<StorageQuota>("/v1/drive/quota"),
      ]);
      setItems(itemsData ?? []);
      setQuota(quotaData);

      if (parentId) {
        const crumbs = await apiGet<Breadcrumb[]>(`/v1/drive/folders/${parentId}/breadcrumbs`);
        setBreadcrumbs(crumbs ?? []);
      } else {
        setBreadcrumbs([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  const fetchTabItems = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "recent") {
        const data = await apiGet<{ item: DriveItem }[]>("/v1/drive/recent");
        setItems((data ?? []).map((r) => r.item));
      } else if (tab === "favorites") {
        const data = await apiGet<{ item: DriveItem }[]>("/v1/drive/favorites");
        setItems((data ?? []).map((r) => r.item));
      } else if (tab === "trash") {
        const data = await apiGet<{ item: DriveItem }[]>("/v1/drive/recycle-bin");
        setItems((data ?? []).map((r) => r.item));
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "browse") {
      void fetchItems();
    } else {
      void fetchTabItems();
    }
  }, [tab, fetchItems, fetchTabItems]);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const folders = filteredItems.filter((i) => i.type === "FOLDER");
  const files = filteredItems.filter((i) => i.type === "FILE");

  return (
    <div className="flex h-full flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Prinodia Drive</h1>
          {quota && <QuotaBar quota={quota} />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === "grid" ? "list" : "grid")}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {view === "grid" ? "≡ Liste" : "⊞ Grille"}
          </button>
          <button
            onClick={() => setShowNewFolder(true)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            + Dossier
          </button>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            ↑ Upload
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6">
        {(
          [
            { key: "browse", label: "Fichiers" },
            { key: "recent", label: "Récents" },
            { key: "favorites", label: "Favoris" },
            { key: "trash", label: "Corbeille" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Breadcrumbs */}
        {tab === "browse" && (
          <nav className="flex items-center gap-1 text-sm">
            <button
              onClick={() => router.push("/admin/drive")}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Drive
            </button>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => router.push(`/admin/drive?parentId=${crumb.id}`)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </nav>
        )}

        {/* Upload zone */}
        {showUpload && tab === "browse" && (
          <UploadZone
            {...(parentId !== undefined && { parentId })}
            onUploaded={() => {
              setShowUpload(false);
              void fetchItems();
            }}
          />
        )}

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par nom…"
          className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-400">
            <div className="text-5xl">📂</div>
            <p className="text-sm">Ce dossier est vide</p>
            {tab === "browse" && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-2 text-sm text-indigo-500 hover:underline"
              >
                Importer des fichiers
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Folders */}
            {folders.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Dossiers ({folders.length})
                </h2>
                {view === "grid" ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {folders.map((item) => (
                      <ItemCard key={item.id} item={item} view="grid" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                    {folders.map((item) => (
                      <ItemCard key={item.id} item={item} view="list" />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Files */}
            {files.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fichiers ({files.length})
                </h2>
                {view === "grid" ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {files.map((item) => (
                      <ItemCard key={item.id} item={item} view="grid" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                    {files.map((item) => (
                      <ItemCard key={item.id} item={item} view="list" />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showNewFolder && (
        <NewFolderModal
          {...(parentId !== undefined && { parentId })}
          onCreated={() => void fetchItems()}
          onClose={() => setShowNewFolder(false)}
        />
      )}
    </div>
  );
}
