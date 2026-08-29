import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Editor from "./Editor";
import { mockFetch } from "./test-utils";

const sampleContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Hello world" }],
    },
  ],
};

describe("Editor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the read-only banner instead of the toolbar for viewers", async () => {
    mockFetch();
    render(<Editor docId="d1" initialContent={sampleContent} readOnly />);

    expect(
      screen.getByText("Read-only — you have viewer access")
    ).toBeInTheDocument();
    expect(screen.queryByTitle("Bold (Cmd+B)")).not.toBeInTheDocument();
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("shows the toolbar and Saved indicator for writers once mounted", async () => {
    mockFetch();
    render(<Editor docId="d1" initialContent={sampleContent} readOnly={false} />);

    expect(screen.getByText("Saved")).toBeInTheDocument();
    // toolbar renders after TipTap initializes client-side
    expect(await screen.findByTitle("Bold (Cmd+B)")).toBeInTheDocument();
    expect(await screen.findByTitle("Bullet list")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
});
