import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewDocumentButton from "./NewDocumentButton";
import { jsonResponse, mockFetch } from "./test-utils";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

describe("NewDocumentButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a document and navigates to it", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ id: "doc-1", title: "Untitled document" }, true, 201));
    render(<NewDocumentButton />);

    await userEvent.click(screen.getByRole("button", { name: "New document" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/doc/doc-1"));
    expect(fetchMock).toHaveBeenCalledWith("/api/documents", { method: "POST" });
  });

  it("shows the server error message on failure", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ error: "Database unavailable" }, false, 500));
    render(<NewDocumentButton />);

    await userEvent.click(screen.getByRole("button", { name: "New document" }));

    expect(await screen.findByText("Database unavailable")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "New document" })).toBeEnabled();
  });
});
