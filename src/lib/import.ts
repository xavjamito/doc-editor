import { generateJSON } from "@tiptap/html/server";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";

export const MAX_UPLOAD_BYTES = 1024 * 1024; // 1 MB
export const SUPPORTED_EXTENSIONS = [".txt", ".md"] as const;

export function markdownToTiptapJson(markdown: string) {
  const html = marked.parse(markdown, { async: false });
  // generateJSON only keeps nodes/marks in the StarterKit schema,
  // so raw HTML in the markdown (scripts etc.) is dropped.
  return generateJSON(html, [StarterKit]);
}

export function plainTextToTiptapJson(text: string) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => ({
      type: "paragraph",
      content: [{ type: "text", text: block.replace(/\n/g, " ") }],
    }));

  return {
    type: "doc",
    content: paragraphs.length
      ? paragraphs
      : [{ type: "paragraph" }],
  };
}
