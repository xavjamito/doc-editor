"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Spinner from "./Spinner";

interface Props {
  doc: {
    id: string;
    title: string;
    updatedAt: string;
    ownerName?: string;
    role?: "viewer" | "editor";
  };
  isOwned: boolean;
}

export default function DocumentCard({ doc, isOwned }: Props) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [title, setTitle] = useState(doc.title);
  const [error, setError] = useState<string | null>(null);
  const canRename = isOwned || doc.role === "editor";
  const busy = saving || deleting || isRefreshing;

  async function saveTitle() {
    const trimmed = title.trim();
    setRenaming(false);
    if (!trimmed || trimmed === doc.title) {
      setTitle(doc.title);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Rename failed");
        setTitle(doc.title);
        return;
      }
      setError(null);
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  async function deleteDoc() {
    if (!confirm(`Delete “${doc.title}”? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Delete failed");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className={`group flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm transition hover:border-zinc-300 hover:shadow ${
        busy ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        {renaming ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setTitle(doc.title);
                setRenaming(false);
              }
            }}
            className="w-full rounded border border-blue-400 px-1 py-0.5 text-sm font-medium focus:outline-none"
          />
        ) : (
          <span className="flex items-center gap-2">
            <Link
              href={`/doc/${doc.id}`}
              className="block truncate text-sm font-medium text-zinc-900 hover:text-blue-600"
            >
              {doc.title}
            </Link>
            {busy && <Spinner className="h-3 w-3" />}
          </span>
        )}
        <p className="mt-0.5 text-xs text-zinc-500">
          {doc.ownerName && <>Owned by {doc.ownerName} · </>}
          {doc.role && (
            <span className="capitalize">{doc.role} access · </span>
          )}
          Updated {new Date(doc.updatedAt).toLocaleString()}
        </p>
        {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        {canRename && !renaming && (
          <button
            onClick={() => setRenaming(true)}
            disabled={busy}
            className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
          >
            Rename
          </button>
        )}
        {isOwned && (
          <button
            onClick={deleteDoc}
            disabled={busy}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}
