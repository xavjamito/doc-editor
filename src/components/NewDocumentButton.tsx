"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewDocumentButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push(`/doc/${doc.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create document");
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={createDocument}
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {pending ? "Creating…" : "New document"}
      </button>
    </div>
  );
}
