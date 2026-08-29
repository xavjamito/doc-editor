import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canRead, canWrite, isOwner, resolveAccess } from "@/lib/permissions";
import { MAX_TITLE_LENGTH } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

// 404 (not 403) for both missing and inaccessible docs, so IDs don't leak existence.
const notFound = () =>
  NextResponse.json({ error: "Document not found" }, { status: 404 });

async function loadDoc(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: { shares: { select: { userId: true, role: true } } },
  });
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  const doc = await loadDoc(id);
  if (!doc || !canRead(user.id, doc)) return notFound();

  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    updatedAt: doc.updatedAt,
    access: resolveAccess(user.id, doc),
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  const doc = await loadDoc(id);
  if (!doc || !canRead(user.id, doc)) return notFound();
  if (!canWrite(user.id, doc)) {
    return NextResponse.json(
      { error: "You have read-only access to this document" },
      { status: 403 }
    );
  }

  let body: { title?: unknown; content?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: { title?: string; content?: Prisma.InputJsonValue } = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "Title must be a non-empty string" },
        { status: 400 }
      );
    }
    if (body.title.trim().length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { error: `Title must be at most ${MAX_TITLE_LENGTH} characters` },
        { status: 400 }
      );
    }
    data.title = body.title.trim();
  }

  if (body.content !== undefined) {
    if (typeof body.content !== "object" || body.content === null) {
      return NextResponse.json(
        { error: "Content must be a JSON object" },
        { status: 400 }
      );
    }
    data.content = body.content as Prisma.InputJsonValue;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id },
    data,
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  const doc = await loadDoc(id);
  if (!doc || !canRead(user.id, doc)) return notFound();
  if (!isOwner(user.id, doc)) {
    return NextResponse.json(
      { error: "Only the owner can delete a document" },
      { status: 403 }
    );
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
