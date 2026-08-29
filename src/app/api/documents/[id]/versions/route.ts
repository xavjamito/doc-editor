import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canRead } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { shares: { select: { userId: true, role: true } } },
  });
  if (!doc || !canRead(user.id, doc)) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
  });
  return NextResponse.json({ versions });
}
