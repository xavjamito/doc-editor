import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MAX_TITLE_LENGTH } from "@/lib/validation";
import {
  MAX_UPLOAD_BYTES,
  SUPPORTED_EXTENSIONS,
  markdownToTiptapJson,
  plainTextToTiptapJson,
} from "@/lib/import";

const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
  const user = await getCurrentUser();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("Expected multipart form data with a 'file' field");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return err("Expected multipart form data with a 'file' field");
  }

  const name = file.name || "upload";
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext as ".txt" | ".md")) {
    return err(
      `Unsupported file type "${ext || "unknown"}". Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return err(
      `File is too large (${(file.size / 1024).toFixed(0)} KB). Maximum is ${MAX_UPLOAD_BYTES / 1024} KB`
    );
  }

  const text = (await file.text()).trim();
  if (!text) {
    return err("File is empty");
  }

  let content;
  try {
    content =
      ext === ".md" ? markdownToTiptapJson(text) : plainTextToTiptapJson(text);
  } catch {
    return err("Could not parse file contents");
  }

  const title =
    name.replace(/\.(txt|md)$/i, "").trim().slice(0, MAX_TITLE_LENGTH) ||
    "Untitled document";

  const doc = await prisma.document.create({
    data: {
      title,
      ownerId: user.id,
      content: content as Prisma.InputJsonValue,
    },
    select: { id: true, title: true },
  });

  return NextResponse.json(doc, { status: 201 });
}
