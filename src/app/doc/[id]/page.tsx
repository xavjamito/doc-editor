import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canRead, canWrite, resolveAccess } from "@/lib/permissions";
import AppHeader from "@/components/AppHeader";
import EditableTitle from "@/components/EditableTitle";
import Editor from "@/components/Editor";
import ShareDialog from "@/components/ShareDialog";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: PageProps<"/doc/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();

  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      shares: { select: { userId: true, role: true } },
      owner: { select: { name: true } },
    },
  });
  if (!doc || !canRead(user.id, doc)) notFound();

  const access = resolveAccess(user.id, doc);
  const writable = canWrite(user.id, doc);
  const allUsers =
    access === "owner"
      ? await prisma.user.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, email: true },
        })
      : [];

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← All documents
          </Link>
          <div className="flex items-center gap-3">
            <p className="text-xs text-zinc-500">
              {access === "owner" ? (
                "You own this document"
              ) : (
                <>
                  Owned by {doc.owner.name} ·{" "}
                  <span className="capitalize">{access}</span> access
                </>
              )}
            </p>
            {access === "owner" && (
              <ShareDialog
                docId={doc.id}
                allUsers={allUsers}
                ownerId={user.id}
              />
            )}
          </div>
        </div>
        <div className="mb-4">
          <EditableTitle
            docId={doc.id}
            initialTitle={doc.title}
            canEdit={writable}
          />
        </div>
        <Editor
          docId={doc.id}
          initialContent={doc.content}
          readOnly={!writable}
        />
      </main>
    </>
  );
}
