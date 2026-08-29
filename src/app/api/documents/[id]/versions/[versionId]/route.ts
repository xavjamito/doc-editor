import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canRead, canWrite } from "@/lib/permissions";

type Params = { params: Promise<{ id: string; versionId: string }> };

const notFound = (what = "Document") =>
  NextResponse.json({ error: `${what} not found` }, { status: 404 });

async function loadDocAndVersion(id: string, versionId: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { shares: { select: { userId: true, role: true } } },
  });
  if (!doc) return { doc: null, version: null };
  const version = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId: id },
  });
  return { doc, version };
}

export async function GET(_req: Request, { params }: Params) {
  const { id, versionId } = await params;
  const user = await getCurrentUser();
  const { doc, version } = await loadDocAndVersion(id, versionId);
  if (!doc || !canRead(user.id, doc)) return notFound();
  if (!version) return notFound("Version");

  return NextResponse.json({
    id: version.id,
    title: version.title,
    content: version.content,
    createdAt: version.createdAt,
  });
}

// POST = restore this version (current state is snapshotted first, so
// restoring is itself undoable).
export async function POST(_req: Request, { params }: Params) {
  const { id, versionId } = await params;
  const user = await getCurrentUser();
  const { doc, version } = await loadDocAndVersion(id, versionId);
  if (!doc || !canRead(user.id, doc)) return notFound();
  if (!canWrite(user.id, doc)) {
    return NextResponse.json(
      { error: "You have read-only access to this document" },
      { status: 403 }
    );
  }
  if (!version) return notFound("Version");

  await prisma.$transaction([
    ...(doc.content !== null
      ? [
          prisma.documentVersion.create({
            data: {
              documentId: id,
              title: doc.title,
              content: doc.content as Prisma.InputJsonValue,
              createdById: doc.lastEditedById ?? doc.ownerId,
            },
          }),
        ]
      : []),
    prisma.document.update({
      where: { id },
      data: {
        title: version.title,
        content: version.content as Prisma.InputJsonValue,
        lastEditedById: user.id,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
