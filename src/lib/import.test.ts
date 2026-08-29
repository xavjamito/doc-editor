import { describe, expect, it } from "vitest";
import { markdownToTiptapJson, plainTextToTiptapJson } from "./import";

type Node = {
  type: string;
  content?: Node[];
  text?: string;
  marks?: { type: string }[];
};

describe("plainTextToTiptapJson", () => {
  it("splits blank-line-separated blocks into paragraphs", () => {
    const json = plainTextToTiptapJson("First.\n\nSecond\nwrapped.\n") as {
      content: Node[];
    };
    expect(json.content).toHaveLength(2);
    expect(json.content[0].content?.[0].text).toBe("First.");
    expect(json.content[1].content?.[0].text).toBe("Second wrapped.");
  });

  it("handles CRLF input", () => {
    const json = plainTextToTiptapJson("a\r\n\r\nb") as { content: Node[] };
    expect(json.content).toHaveLength(2);
  });

  it("produces an empty paragraph for whitespace-only text", () => {
    const json = plainTextToTiptapJson("   \n  ") as { content: Node[] };
    expect(json.content).toEqual([{ type: "paragraph" }]);
  });
});

describe("markdownToTiptapJson", () => {
  it("converts headings, marks and lists", () => {
    const json = markdownToTiptapJson(
      "# Title\n\nSome **bold** text.\n\n- one\n- two"
    ) as { content: Node[] };
    expect(json.content[0].type).toBe("heading");
    const bold = json.content[1].content?.find((n) =>
      n.marks?.some((m) => m.type === "bold")
    );
    expect(bold?.text).toBe("bold");
    expect(json.content[2].type).toBe("bulletList");
    expect(json.content[2].content).toHaveLength(2);
  });

  it("drops raw HTML that is not part of the editor schema", () => {
    const json = JSON.stringify(
      markdownToTiptapJson("hello\n\n<script>alert(1)</script>")
    );
    expect(json).not.toContain("script");
    expect(json).not.toContain("alert");
  });
});
