import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditableTitle from "./EditableTitle";
import { jsonResponse, mockFetch } from "./test-utils";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("EditableTitle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a plain heading when not editable", () => {
    mockFetch();
    render(<EditableTitle docId="d1" initialTitle="My doc" canEdit={false} />);
    expect(screen.getByRole("heading", { name: "My doc" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("saves a new title on Enter", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ id: "d1", title: "Renamed" }));
    render(<EditableTitle docId="d1" initialTitle="My doc" canEdit />);

    const input = screen.getByRole("textbox", { name: "Document title" });
    await userEvent.clear(input);
    await userEvent.type(input, "Renamed{Enter}");

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents/d1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "Renamed" }),
      })
    );
  });

  it("does not save when the title is unchanged or empty", async () => {
    const fetchMock = mockFetch();
    render(<EditableTitle docId="d1" initialTitle="My doc" canEdit />);

    const input = screen.getByRole("textbox", { name: "Document title" });
    await userEvent.clear(input);
    await userEvent.type(input, "{Enter}");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(input).toHaveValue("My doc"); // reverted
  });

  it("reverts and shows the error when the server rejects", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(
      jsonResponse({ error: "You have read-only access to this document" }, false, 403)
    );
    render(<EditableTitle docId="d1" initialTitle="My doc" canEdit />);

    const input = screen.getByRole("textbox", { name: "Document title" });
    await userEvent.clear(input);
    await userEvent.type(input, "Nope{Enter}");

    expect(
      await screen.findByText("You have read-only access to this document")
    ).toBeInTheDocument();
    expect(input).toHaveValue("My doc");
    expect(refresh).not.toHaveBeenCalled();
  });
});
