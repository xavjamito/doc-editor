import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserSwitcher from "./UserSwitcher";
import { jsonResponse, mockFetch } from "./test-utils";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const users = [
  { id: "user-alice", name: "Alice Owner", email: "alice@example.com" },
  { id: "user-bob", name: "Bob Editor", email: "bob@example.com" },
];

describe("UserSwitcher", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders all users with the current one selected", () => {
    mockFetch();
    render(<UserSwitcher users={users} currentUserId="user-alice" />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("user-alice");
    expect(screen.getByRole("option", { name: "Bob Editor" })).toBeInTheDocument();
  });

  it("posts the new user and refreshes on change", async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    render(<UserSwitcher users={users} currentUserId="user-alice" />);

    await userEvent.selectOptions(screen.getByRole("combobox"), "user-bob");

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/switch-user",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ userId: "user-bob" }),
      })
    );
  });
});
