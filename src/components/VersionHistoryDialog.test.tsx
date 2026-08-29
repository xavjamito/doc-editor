import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VersionHistoryDialog from "./VersionHistoryDialog";
import { jsonResponse, mockFetch } from "./test-utils";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const versionMeta = {
  id: "v1",
  title: "Old title",
  createdAt: new Date("2026-08-29T10:00:00Z").toISOString(),
  createdBy: { name: "Alice Owner" },
};

const versionDetail = {
  id: "v1",
  title: "Old title",
  content: {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Old body" }] },
    ],
  },
};

describe("VersionHistoryDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens and lists versions with author and timestamp", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ versions: [versionMeta] }));
    render(<VersionHistoryDialog docId="d1" canRestore />);

    await userEvent.click(screen.getByRole("button", { name: "History" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/documents/d1/versions");
    expect(screen.getByText(/Old title · by Alice Owner/)).toBeInTheDocument();
  });

  it("shows the empty state when there are no versions", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ versions: [] }));
    render(<VersionHistoryDialog docId="d1" canRestore />);

    await userEvent.click(screen.getByRole("button", { name: "History" }));

    expect(await screen.findByText(/No versions yet/)).toBeInTheDocument();
  });

  it("previews a version and restores it", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ versions: [versionMeta] }));
    render(<VersionHistoryDialog docId="d1" canRestore />);

    await userEvent.click(screen.getByRole("button", { name: "History" }));
    fetchMock.mockResolvedValueOnce(jsonResponse(versionDetail));
    await userEvent.click(await screen.findByText(/Old title · by Alice Owner/));

    expect(await screen.findByText("Old body")).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await userEvent.click(
      screen.getByRole("button", { name: "Restore this version" })
    );

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/api/documents/d1/versions/v1", {
      method: "POST",
    });
  });

  it("hides the restore button for read-only users", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ versions: [versionMeta] }));
    render(<VersionHistoryDialog docId="d1" canRestore={false} />);

    await userEvent.click(screen.getByRole("button", { name: "History" }));
    fetchMock.mockResolvedValueOnce(jsonResponse(versionDetail));
    await userEvent.click(await screen.findByText(/Old title · by Alice Owner/));

    expect(await screen.findByText("Old body")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Restore this version" })
    ).not.toBeInTheDocument();
  });
});
