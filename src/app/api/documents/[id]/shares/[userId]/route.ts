import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canRead, isOwner } from "@/lib/permissions";

type Params = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { id, userId } = await params;
  const user = await getCurrentUser();

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { shares: { select: { userId: true, role: true } } },
  });
  if (!doc || !canRead(user.id, doc)) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!isOwner(user.id, doc)) {
    return NextResponse.json(
      { error: "Only the owner can manage sharing" },
      { status: 403 }
    );
  }

  await prisma.documentShare.deleteMany({
    where: { documentId: id, userId },
  });
  return NextResponse.json({ ok: true });
}
