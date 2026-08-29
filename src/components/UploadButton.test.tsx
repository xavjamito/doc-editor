import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UploadButton from "./UploadButton";
import { jsonResponse, mockFetch } from "./test-utils";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("UploadButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads the selected file and navigates to the new document", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ id: "doc-9", title: "notes" }, true, 201));
    const { container } = render(<UploadButton />);

    const file = new File(["# hello"], "notes.md", { type: "text/markdown" });
    await userEvent.upload(getFileInput(container), file);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/doc/doc-9"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/upload");
    expect((init?.body as FormData).get("file")).toBe(file);
  });

  it("shows the server rejection message", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'Unsupported file type ".pdf". Supported: .txt, .md' }, false, 400)
    );
    const { container } = render(<UploadButton />);

    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    // bypass the accept attribute — we are testing the server-side rejection path
    await userEvent.upload(getFileInput(container), file, { applyAccept: false });

    expect(
      await screen.findByText(/Unsupported file type/)
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    // input is reset so the same file can be retried
    expect(getFileInput(container).value).toBe("");
  });
});
