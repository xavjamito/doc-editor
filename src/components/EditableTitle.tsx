"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  docId: string;
  initialTitle: string;
  canEdit: boolean;
}

export default function EditableTitle({ docId, initialTitle, canEdit }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);

  async function saveTitle() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === initialTitle) {
      setTitle(initialTitle);
      return;
    }
    const res = await fetch(`/api/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Rename failed");
      setTitle(initialTitle);
      return;
    }
    setError(null);
    router.refresh();
  }

  if (!canEdit) {
    return <h1 className="text-2xl font-semibold">{title}</h1>;
  }

  return (
    <div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        aria-label="Document title"
        className="w-full rounded-md border border-transparent bg-transparent text-2xl font-semibold focus:border-zinc-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 px-1 -mx-1"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
