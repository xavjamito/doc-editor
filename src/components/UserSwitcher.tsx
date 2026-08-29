"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Spinner from "./Spinner";

interface Props {
  users: { id: string; name: string; email: string }[];
  currentUserId: string;
}

export default function UserSwitcher({ users, currentUserId }: Props) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const busy = switching || isRefreshing;

  async function switchUser(userId: string) {
    setSwitching(true);
    try {
      await fetch("/api/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      startTransition(() => router.refresh());
    } finally {
      setSwitching(false);
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      {busy ? (
        <Spinner />
      ) : (
        <span className="text-zinc-500">Acting as</span>
      )}
      <select
        value={currentUserId}
        disabled={busy}
        onChange={(e) => switchUser(e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm font-medium text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </label>
  );
}
