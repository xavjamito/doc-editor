"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Editor from "./Editor";

interface VersionMeta {
  id: string;
  title: string;
  createdAt: string;
  createdBy: { name: string };
}

interface VersionDetail {
  id: string;
  title: string;
  content: unknown;
}

interface Props {
  docId: string;
  canRestore: boolean;
}

export default function VersionHistoryDialog({ docId, canRestore }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<VersionMeta[] | null>(null);
  const [selected, setSelected] = useState<VersionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function loadVersions() {
    const res = await fetch(`/api/documents/${docId}/versions`);
    if (res.ok) {
      const body = await res.json();
      setVersions(body.versions);
    } else {
      setError("Failed to load version history");
    }
  }

  function openDialog() {
    setVersions(null);
    setSelected(null);
    setError(null);
    setOpen(true);
    loadVersions();
  }

  async function preview(versionId: string) {
    setError(null);
    const res = await fetch(`/api/documents/${docId}/versions/${versionId}`);
    if (res.ok) {
      setSelected(await res.json());
    } else {
      setError("Failed to load version");
    }
  }

  async function restore() {
    if (!selected) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/documents/${docId}/versions/${selected.id}`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to restore version");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to restore version");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
      >
        History
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Version history"
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Version history</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            {error && (
              <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            {versions === null ? (
              <p className="py-4 text-sm text-zinc-500">Loading…</p>
            ) : versions.length === 0 ? (
              <p className="py-4 text-sm text-zinc-500">
                No versions yet. Versions are captured automatically as the
                document is edited over time or by different people.
              </p>
            ) : (
              <div className="flex min-h-0 flex-1 gap-4">
                <ul className="w-56 shrink-0 space-y-1 overflow-y-auto">
                  {versions.map((v) => (
                    <li key={v.id}>
                      <button
                        onClick={() => preview(v.id)}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                          selected?.id === v.id
                            ? "bg-blue-50 text-blue-800"
                            : "hover:bg-zinc-100"
                        }`}
                      >
                        <span className="block font-medium">
                          {new Date(v.createdAt).toLocaleString()}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                          {v.title} · by {v.createdBy.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="min-w-0 flex-1 overflow-y-auto">
                  {selected ? (
                    <>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {selected.title}
                        </p>
                        {canRestore && (
                          <button
                            onClick={restore}
                            disabled={pending}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            {pending ? "Restoring…" : "Restore this version"}
                          </button>
                        )}
                      </div>
                      <Editor
                        key={selected.id}
                        docId={docId}
                        initialContent={selected.content}
                        readOnly
                        readOnlyLabel="Preview — restoring replaces the current content"
                      />
                    </>
                  ) : (
                    <p className="py-4 text-sm text-zinc-500">
                      Select a version to preview it.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
