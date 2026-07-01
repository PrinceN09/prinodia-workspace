"use client";

/**
 * Prinodia Drive v1.7.0 — /admin/drive/[id]
 *
 * File/folder detail: metadata, versions, sharing, activity, comments.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost, apiDelete, apiPatch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriveItem {
  id: string;
  name: string;
  type: "FILE" | "FOLDER";
  status: string;
  mimeType?: string;
  extension?: string;
  sizeBytes?: number;
  storageProvider: string;
  checksum?: string;
  currentVersionNum: number;
  parentId?: string;
  organizationId: string;
  description?: string;
  isLocked: boolean;
  isPinned: boolean;
  previewStatus: string;
  thumbnailUrl?: string;
  virusScanStatus: string;
  trashedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  owner: { id: string; displayName: string; avatarUrl?: string };
  tags: { id: string; name: string; color?: string }[];
  lock?: {
    id: string;
    reason?: string;
    expiresAt?: string;
    lockedBy: { id: string; displayName: string };
  };
}

interface DriveVersion {
  id: string;
  versionNum: number;
  sizeBytes?: number;
  checksum?: string;
  changeNote?: string;
  createdAt: string;
  uploadedBy: { id: string; displayName: string };
}

interface DriveShare {
  id: string;
  token: string;
  role: string;
  label?: string;
  maxUses?: number;
  uses: number;
  expiresAt?: string;
  createdAt: string;
  createdBy: { id: string; displayName: string };
}

interface DriveComment {
  id: string;
  content: string;
  resolvedAt?: string;
  createdAt: string;
  author: { id: string; displayName: string; avatarUrl?: string };
  replies: DriveComment[];
}

interface DrivePermission {
  id: string;
  role: string;
  scope: string;
  userId?: string;
  createdAt: string;
  user?: { id: string; displayName: string; email: string; avatarUrl?: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes?: number): string {
  if (!bytes) return "0 o";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    CLEAN: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    INFECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    ERROR: "bg-red-100 text-red-700",
    SKIPPED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function PropertiesTab({ item }: { item: DriveItem }) {
  return (
    <dl className="divide-y divide-gray-100 dark:divide-gray-800">
      {[
        ["Type", item.type === "FOLDER" ? "Dossier" : "Fichier"],
        ["Nom", item.name],
        ["MIME", item.mimeType ?? "—"],
        ["Extension", item.extension ?? "—"],
        ["Taille", formatBytes(item.sizeBytes)],
        ["Stockage", item.storageProvider],
        ["Checksum (SHA-256)", item.checksum ? item.checksum.slice(0, 16) + "…" : "—"],
        ["Version courante", `v${item.currentVersionNum}`],
        ["Propriétaire", item.owner.displayName],
        ["Virus scan", null],
        ["Pinné", item.isPinned ? "Oui" : "Non"],
        ["Verrouillé", item.isLocked ? "Oui" : "Non"],
        ["Créé le", formatDate(item.createdAt)],
        ["Modifié le", formatDate(item.updatedAt)],
        ["Dernier accès", formatDate(item.lastAccessedAt)],
      ].map(([label, value]) => (
        <div key={label as string} className="flex items-center gap-4 py-2 text-sm">
          <dt className="w-40 flex-shrink-0 text-gray-500">{label as string}</dt>
          <dd className="flex-1 text-gray-900 dark:text-gray-100 font-mono break-all">
            {label === "Virus scan" ? (
              <StatusBadge status={item.virusScanStatus} />
            ) : (
              (value as string)
            )}
          </dd>
        </div>
      ))}
      {item.tags.length > 0 && (
        <div className="flex items-center gap-4 py-2 text-sm">
          <dt className="w-40 flex-shrink-0 text-gray-500">Tags</dt>
          <dd className="flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <span
                key={t.id}
                style={{ backgroundColor: t.color ?? "#6366F1" }}
                className="rounded-full px-2 py-0.5 text-xs text-white"
              >
                {t.name}
              </span>
            ))}
          </dd>
        </div>
      )}
      {item.description && (
        <div className="flex gap-4 py-2 text-sm">
          <dt className="w-40 flex-shrink-0 text-gray-500">Description</dt>
          <dd className="flex-1 text-gray-900 dark:text-gray-100">{item.description}</dd>
        </div>
      )}
    </dl>
  );
}

function VersionsTab({ itemId }: { itemId: string }) {
  const [versions, setVersions] = useState<DriveVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<DriveVersion[]>(`/v1/drive/items/${itemId}/versions`)
      .then((data) => setVersions(data ?? []))
      .catch(() => setVersions([]))
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) return <div className="p-4 text-center text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {versions.map((v) => (
        <div key={v.id} className="flex items-center gap-4 py-3 text-sm">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs font-bold text-indigo-700 dark:text-indigo-400">
            v{v.versionNum}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {v.changeNote ?? "Nouvelle version"}
            </p>
            <p className="text-xs text-gray-400">
              {v.uploadedBy.displayName} · {formatDate(v.createdAt)} · {formatBytes(v.sizeBytes)}
            </p>
          </div>
          <a
            href={`/api/v1/drive/items/${itemId}/download?version=${v.versionNum}`}
            className="text-xs text-indigo-500 hover:underline"
          >
            Télécharger
          </a>
        </div>
      ))}
      {versions.length === 0 && (
        <p className="py-4 text-center text-sm text-gray-400">Aucune version</p>
      )}
    </div>
  );
}

function SharingTab({ itemId }: { itemId: string }) {
  const [shares, setShares] = useState<DriveShare[]>([]);
  const [perms, setPerms] = useState<DrivePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingLink, setCreatingLink] = useState(false);

  const fetchData = async () => {
    const [s, p] = await Promise.all([
      apiGet<DriveShare[]>(`/v1/drive/items/${itemId}/shares`),
      apiGet<DrivePermission[]>(`/v1/drive/items/${itemId}/permissions`),
    ]);
    setShares(s ?? []);
    setPerms(p ?? []);
  };

  useEffect(() => {
    fetchData()
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [itemId]);

  const createLink = async () => {
    setCreatingLink(true);
    try {
      await apiPost(`/v1/drive/items/${itemId}/shares`, { role: "VIEWER" });
      await fetchData();
    } catch {
      alert("Erreur lors de la création du lien");
    } finally {
      setCreatingLink(false);
    }
  };

  const revokeLink = async (shareId: string) => {
    await apiDelete(`/v1/drive/items/${itemId}/shares/${shareId}`);
    await fetchData();
  };

  if (loading) return <div className="p-4 text-center text-sm text-gray-400">Chargement…</div>;

  return (
    <div className="space-y-6">
      {/* Share links */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Liens de partage
          </h3>
          <button
            onClick={createLink}
            disabled={creatingLink}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {creatingLink ? "…" : "+ Créer un lien"}
          </button>
        </div>
        {shares.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun lien de partage actif</p>
        ) : (
          <div className="space-y-2">
            {shares.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-mono text-indigo-600 dark:text-indigo-400">
                    {window.location.origin}/drive/share/{s.token}
                  </p>
                  <p className="text-xs text-gray-400">
                    {s.role} · {s.uses} utilisation(s)
                    {s.expiresAt && ` · expire le ${formatDate(s.expiresAt)}`}
                  </p>
                </div>
                <button
                  onClick={() => void revokeLink(s.id)}
                  className="text-xs text-red-500 hover:underline flex-shrink-0"
                >
                  Révoquer
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Permissions */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Accès des membres
        </h3>
        {perms.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune permission explicite</p>
        ) : (
          <div className="space-y-2">
            {perms.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {p.user?.displayName ?? p.scope}
                  </span>
                  {p.user?.email && (
                    <span className="ml-1 text-xs text-gray-400">{p.user.email}</span>
                  )}
                </div>
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CommentsTab({ itemId }: { itemId: string }) {
  const [comments, setComments] = useState<DriveComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    const data = await apiGet<DriveComment[]>(`/v1/drive/items/${itemId}/comments`);
    setComments(data ?? []);
  };

  useEffect(() => {
    fetchComments().catch(() => null);
  }, [itemId]);

  const submit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await apiPost(`/v1/drive/items/${itemId}/comments`, { content: newComment });
      setNewComment("");
      await fetchComments();
    } catch {
      alert("Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <div key={c.id} className={`${c.resolvedAt ? "opacity-50" : ""}`}>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300">
              {c.author.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {c.author.displayName}
                </span>
                <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200">{c.content}</p>
            </div>
          </div>
          {c.replies.map((r) => (
            <div key={r.id} className="ml-11 mt-2 flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                {r.author.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800 p-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {r.author.displayName}
                </span>
                <p className="text-sm text-gray-800 dark:text-gray-200">{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void submit()}
          placeholder="Ajouter un commentaire…"
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={submit}
          disabled={!newComment.trim() || submitting}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DriveItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params["id"] as string;

  const [item, setItem] = useState<DriveItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"properties" | "versions" | "sharing" | "comments">("properties");
  const [trashing, setTrashing] = useState(false);

  useEffect(() => {
    apiGet<DriveItem>(`/v1/drive/items/${id}`)
      .then((data) => setItem(data))
      .catch(() => router.push("/admin/drive"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleTrash = async () => {
    if (!confirm("Déplacer vers la corbeille ?")) return;
    setTrashing(true);
    try {
      await apiDelete(`/v1/drive/items/${id}`);
      router.push(item?.parentId ? `/admin/drive?parentId=${item.parentId}` : "/admin/drive");
    } catch {
      alert("Erreur");
      setTrashing(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/v1/drive/items/${id}/download`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={item.parentId ? `/admin/drive?parentId=${item.parentId}` : "/admin/drive"}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ← Retour
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {item.name}
              {item.isLocked && <span className="text-sm text-amber-500">🔒</span>}
              {item.isPinned && <span className="text-sm text-indigo-500">📌</span>}
            </h1>
            <p className="text-xs text-gray-500">
              {item.type === "FOLDER" ? "Dossier" : (item.mimeType ?? "Fichier")} ·{" "}
              {item.owner.displayName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.type === "FILE" && (
            <button
              onClick={handleDownload}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              ↓ Télécharger
            </button>
          )}
          <button
            onClick={handleTrash}
            disabled={trashing}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            {trashing ? "…" : "🗑 Corbeille"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6">
        {(
          [
            { key: "properties", label: "Propriétés" },
            { key: "versions", label: `Versions (v${item.currentVersionNum})` },
            { key: "sharing", label: "Partage" },
            { key: "comments", label: "Commentaires" },
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "properties" && <PropertiesTab item={item} />}
        {tab === "versions" && <VersionsTab itemId={id} />}
        {tab === "sharing" && <SharingTab itemId={id} />}
        {tab === "comments" && <CommentsTab itemId={id} />}
      </div>
    </div>
  );
}
