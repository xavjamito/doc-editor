import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ShareDialog from "./ShareDialog";
import { jsonResponse, mockFetch } from "./test-utils";

const allUsers = [
  { id: "user-alice", name: "Alice Owner", email: "alice@example.com" },
  { id: "user-bob", name: "Bob Editor", email: "bob@example.com" },
  { id: "user-carol", name: "Carol Viewer", email: "carol@example.com" },
];

const bobShare = {
  role: "editor" as const,
  user: allUsers[1],
};

function renderDialog() {
  return render(
    <ShareDialog docId="d1" allUsers={allUsers} ownerId="user-alice" />
  );
}

describe("ShareDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens, loads shares, and lists everyone except the owner", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ shares: [] }));
    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/documents/d1/shares");
    expect(screen.getByText("Bob Editor")).toBeInTheDocument();
    expect(screen.getByText("Carol Viewer")).toBeInTheDocument();
    // owner is not a share candidate
    expect(screen.queryByText("Alice Owner")).not.toBeInTheDocument();
  });

  it("shows existing shares with their role and a revoke button", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ shares: [bobShare] }));
    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    await screen.findByRole("dialog");
    const selects = await screen.findAllByRole("combobox");
    await waitFor(() => expect(selects[0]).toHaveValue("editor"));
    expect(screen.getByRole("button", { name: "Revoke" })).toBeInTheDocument();
  });

  it("grants access via POST when a role is chosen", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ shares: [] }));
    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Share" }));
    await screen.findByRole("dialog");

    const [bobSelect] = screen.getAllByRole("combobox");
    fetchMock.mockResolvedValueOnce(jsonResponse(bobShare, true, 201));
    await userEvent.selectOptions(bobSelect, "editor");

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/documents/d1/shares",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ userId: "user-bob", role: "editor" }),
        })
      )
    );
  });

  it("revokes access via DELETE", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ shares: [bobShare] }));
    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Share" }));
    const revoke = await screen.findByRole("button", { name: "Revoke" });

    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ shares: [] }));
    await userEvent.click(revoke);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/documents/d1/shares/user-bob", {
        method: "DELETE",
      })
    );
  });

  it("surfaces server errors when granting fails", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ shares: [] }));
    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Share" }));
    await screen.findByRole("dialog");

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Unknown user" }, false, 400));
    const [bobSelect] = screen.getAllByRole("combobox");
    await userEvent.selectOptions(bobSelect, "viewer");

    expect(await screen.findByText("Unknown user")).toBeInTheDocument();
  });
});
