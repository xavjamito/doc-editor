import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import DocumentCard from "@/components/DocumentCard";
import NewDocumentButton from "@/components/NewDocumentButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId: user.id } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        owner: { select: { name: true } },
        shares: { where: { userId: user.id }, select: { role: true } },
      },
    }),
  ]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Documents</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Signed in as {user.name}
            </p>
          </div>
          <NewDocumentButton />
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Owned by me
          </h2>
          {owned.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
              No documents yet. Create one to get started.
            </p>
          ) : (
            <div className="grid gap-2">
              {owned.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  isOwned
                  doc={{ ...doc, updatedAt: doc.updatedAt.toISOString() }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Shared with me
          </h2>
          {shared.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
              Nothing shared with you yet.
            </p>
          ) : (
            <div className="grid gap-2">
              {shared.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  isOwned={false}
                  doc={{
                    id: doc.id,
                    title: doc.title,
                    updatedAt: doc.updatedAt.toISOString(),
                    ownerName: doc.owner.name,
                    role: doc.shares[0]?.role,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
