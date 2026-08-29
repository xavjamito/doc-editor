"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Spinner from "./Spinner";

export default function NewDocumentButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const busy = pending || isNavigating;

  async function createDocument() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create document");
      }
      const doc = await res.json();
      startTransition(() => {
        router.push(`/doc/${doc.id}`);
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create document");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={createDocument}
        disabled={busy}
        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
      >
        {busy && <Spinner className="border-blue-300 border-t-white" />}
        {busy ? "Creating…" : "New document"}
      </button>
    </div>
  );
}
