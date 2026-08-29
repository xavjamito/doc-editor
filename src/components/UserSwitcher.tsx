"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  users: { id: string; name: string; email: string }[];
  currentUserId: string;
}

export default function UserSwitcher({ users, currentUserId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function switchUser(userId: string) {
    setPending(true);
    try {
      await fetch("/api/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">Acting as</span>
      <select
        value={currentUserId}
        disabled={pending}
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
