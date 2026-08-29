import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MAX_TITLE_LENGTH } from "@/lib/validation";

export async function GET() {
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

  return NextResponse.json({
    owned,
    shared: shared.map(({ shares, ...doc }) => ({
      ...doc,
      role: shares[0]?.role,
    })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  let title = "Untitled document";
  try {
    const body = await req.json();
    if (typeof body?.title === "string" && body.title.trim()) {
      title = body.title.trim();
    }
  } catch {
    // no/invalid body — use default title
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `Title must be at most ${MAX_TITLE_LENGTH} characters` },
      { status: 400 }
    );
  }

  const doc = await prisma.document.create({
    data: { title, ownerId: user.id },
    select: { id: true, title: true },
  });
  return NextResponse.json(doc, { status: 201 });
}
