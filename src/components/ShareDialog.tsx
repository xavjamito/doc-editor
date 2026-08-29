"use client";

import { useCallback, useEffect, useState } from "react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

interface Share {
  role: "viewer" | "editor";
  user: UserInfo;
}

interface Props {
  docId: string;
  allUsers: UserInfo[];
  ownerId: string;
}

export default function ShareDialog({ docId, allUsers, ownerId }: Props) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<Share[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const loadShares = useCallback(async () => {
    const res = await fetch(`/api/documents/${docId}/shares`);
    if (res.ok) {
      const body = await res.json();
      setShares(body.shares);
    } else {
      setError("Failed to load sharing info");
    }
  }, [docId]);

  useEffect(() => {
    if (open) loadShares();
  }, [open, loadShares]);

  async function grant(userId: string, role: "viewer" | "editor") {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${docId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to share");
      }
      await loadShares();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to share");
    } finally {
      setPending(false);
    }
  }

  async function revoke(userId: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${docId}/shares/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to revoke");
      }
      await loadShares();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke");
    } finally {
      setPending(false);
    }
  }

  const candidates = allUsers.filter((u) => u.id !== ownerId);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
      >
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Share document"
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Share document</h2>
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

            {shares === null ? (
              <p className="py-4 text-sm text-zinc-500">Loading…</p>
            ) : (
              <ul className="space-y-2">
                {candidates.map((u) => {
                  const share = shares.find((s) => s.user.id === u.id);
                  return (
                    <li
                      key={u.id}
                      className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.name}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {u.email}
                        </p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        <select
                          value={share?.role ?? ""}
                          disabled={pending}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "viewer" || v === "editor") grant(u.id, v);
                          }}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50"
                        >
                          <option value="" disabled>
                            No access
                          </option>
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        {share && (
                          <button
                            onClick={() => revoke(u.id)}
                            disabled={pending}
                            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="mt-4 text-xs text-zinc-400">
              Viewers can read; editors can also change content and title.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
