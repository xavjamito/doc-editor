import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canRead, resolveAccess } from "@/lib/permissions";
import AppHeader from "@/components/AppHeader";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: PageProps<"/doc/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { shares: { select: { userId: true, role: true } } },
  });
  if (!doc || !canRead(user.id, doc)) notFound();

  const access = resolveAccess(user.id, doc);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← All documents
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{doc.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your access: <span className="capitalize">{access}</span>
        </p>
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 px-4 py-12 text-center text-sm text-zinc-500">
          Editor coming in the next phase.
        </div>
      </main>
    </>
  );
}
