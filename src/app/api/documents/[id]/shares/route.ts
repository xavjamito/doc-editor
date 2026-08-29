import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canRead, isOwner } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

const notFound = () =>
  NextResponse.json({ error: "Document not found" }, { status: 404 });

async function loadDocForOwner(id: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { shares: { select: { userId: true, role: true } } },
  });
  if (!doc || !canRead(userId, doc)) return { error: notFound() };
  if (!isOwner(userId, doc)) {
    return {
      error: NextResponse.json(
        { error: "Only the owner can manage sharing" },
        { status: 403 }
      ),
    };
  }
  return { doc };
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  const result = await loadDocForOwner(id, user.id);
  if (result.error) return result.error;

  const shares = await prisma.documentShare.findMany({
    where: { documentId: id },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ shares });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  const result = await loadDocForOwner(id, user.id);
  if (result.error) return result.error;

  let body: { userId?: unknown; role?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, role } = body;
  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (role !== "viewer" && role !== "editor") {
    return NextResponse.json(
      { error: "role must be 'viewer' or 'editor'" },
      { status: 400 }
    );
  }
  if (userId === user.id) {
    return NextResponse.json(
      { error: "You already own this document" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "Unknown user" }, { status: 400 });
  }

  const share = await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: id, userId } },
    update: { role },
    create: { documentId: id, userId, role },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json(share, { status: 201 });
}
