"use client";

import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";

type SaveStatus = "saved" | "saving" | "error";

interface Props {
  docId: string;
  initialContent: unknown;
  readOnly: boolean;
}

const AUTOSAVE_DEBOUNCE_MS = 800;

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm font-medium transition ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-zinc-600 hover:bg-zinc-100"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 px-2 py-1.5">
      <ToolbarButton
        title="Bold (Cmd+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        title="Italic (Cmd+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        title="Underline (Cmd+U)"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-zinc-200" />
      {([1, 2, 3] as const).map((level) => (
        <ToolbarButton
          key={level}
          title={`Heading ${level}`}
          active={editor.isActive("heading", { level })}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          H{level}
        </ToolbarButton>
      ))}
      <ToolbarButton
        title="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        ¶
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-zinc-200" />
      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
    </div>
  );
}

export default function Editor({ docId, initialContent, readOnly }: Props) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (content: unknown) => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error();
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [docId]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent ?? "",
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-[55vh] px-4 py-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => save(editor.getJSON()),
        AUTOSAVE_DEBOUNCE_MS
      );
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/50 rounded-t-lg">
        {readOnly ? (
          <p className="px-3 py-2 text-xs text-zinc-500">
            Read-only — you have viewer access
          </p>
        ) : (
          <div className="flex-1">{editor && <Toolbar editor={editor} />}</div>
        )}
        {!readOnly && (
          <span
            className={`shrink-0 px-3 text-xs ${
              status === "error" ? "text-red-600" : "text-zinc-400"
            }`}
          >
            {status === "saving" && "Saving…"}
            {status === "saved" && "Saved"}
            {status === "error" && "Save failed — retrying on next edit"}
          </span>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
