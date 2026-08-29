import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DocumentCard from "./DocumentCard";
import { jsonResponse, mockFetch } from "./test-utils";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const ownedDoc = {
  id: "d1",
  title: "Quarterly plan",
  updatedAt: new Date("2026-08-29T10:00:00Z").toISOString(),
};

describe("DocumentCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("links to the document", () => {
    mockFetch();
    render(<DocumentCard doc={ownedDoc} isOwned />);
    expect(
      screen.getByRole("link", { name: "Quarterly plan" })
    ).toHaveAttribute("href", "/doc/d1");
  });

  it("shows owner and role metadata for shared documents", () => {
    mockFetch();
    render(
      <DocumentCard
        doc={{ ...ownedDoc, ownerName: "Alice Owner", role: "viewer" }}
        isOwned={false}
      />
    );
    expect(screen.getByText(/Owned by Alice Owner/)).toBeInTheDocument();
    expect(screen.getByText(/viewer access/i)).toBeInTheDocument();
  });

  it("hides rename and delete for viewers", () => {
    mockFetch();
    render(
      <DocumentCard doc={{ ...ownedDoc, role: "viewer" }} isOwned={false} />
    );
    expect(screen.queryByRole("button", { name: "Rename" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("allows rename for editors but not delete", () => {
    mockFetch();
    render(
      <DocumentCard doc={{ ...ownedDoc, role: "editor" }} isOwned={false} />
    );
    expect(screen.getByRole("button", { name: "Rename" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("renames via PATCH and refreshes", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ id: "d1", title: "New name" }));
    render(<DocumentCard doc={ownedDoc} isOwned />);

    await userEvent.click(screen.getByRole("button", { name: "Rename" }));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "New name{Enter}");

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents/d1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "New name" }),
      })
    );
  });

  it("deletes after confirmation", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("confirm", vi.fn(() => true));
    render(<DocumentCard doc={ownedDoc} isOwned />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/api/documents/d1", {
      method: "DELETE",
    });
  });

  it("shows a Deleting state while the delete is in flight", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockReturnValue(new Promise(() => {})); // never resolves
    vi.stubGlobal("confirm", vi.fn(() => true));
    render(<DocumentCard doc={ownedDoc} isOwned />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    const button = await screen.findByRole("button", { name: "Deleting…" });
    expect(button).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument(); // spinner
  });

  it("does not delete when confirmation is declined", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("confirm", vi.fn(() => false));
    render(<DocumentCard doc={ownedDoc} isOwned />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
