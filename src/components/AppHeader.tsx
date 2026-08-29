import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import UserSwitcher from "./UserSwitcher";

export default async function AppHeader() {
  const [user, users] = await Promise.all([
    getCurrentUser(),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
            D
          </span>
          Doc Editor
        </Link>
        <UserSwitcher users={users} currentUserId={user.id} />
      </div>
    </header>
  );
}
