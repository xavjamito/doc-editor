import { describe, expect, it } from "vitest";
import {
  canRead,
  canWrite,
  isOwner,
  resolveAccess,
  type DocumentLike,
} from "./permissions";

const doc = (overrides: Partial<DocumentLike> = {}): DocumentLike => ({
  ownerId: "owner-1",
  shares: [],
  ...overrides,
});

describe("resolveAccess", () => {
  it("returns owner for the document owner", () => {
    expect(resolveAccess("owner-1", doc())).toBe("owner");
  });

  it("returns owner even if the owner somehow also has a share row", () => {
    const d = doc({ shares: [{ userId: "owner-1", role: "viewer" }] });
    expect(resolveAccess("owner-1", d)).toBe("owner");
  });

  it("returns the share role for shared users", () => {
    const d = doc({
      shares: [
        { userId: "u-editor", role: "editor" },
        { userId: "u-viewer", role: "viewer" },
      ],
    });
    expect(resolveAccess("u-editor", d)).toBe("editor");
    expect(resolveAccess("u-viewer", d)).toBe("viewer");
  });

  it("returns null for users without any share", () => {
    expect(resolveAccess("stranger", doc())).toBeNull();
    expect(
      resolveAccess("stranger", doc({ shares: [{ userId: "u", role: "editor" }] }))
    ).toBeNull();
  });
});

describe("canRead", () => {
  it("allows owner, editor and viewer", () => {
    const d = doc({
      shares: [
        { userId: "u-editor", role: "editor" },
        { userId: "u-viewer", role: "viewer" },
      ],
    });
    expect(canRead("owner-1", d)).toBe(true);
    expect(canRead("u-editor", d)).toBe(true);
    expect(canRead("u-viewer", d)).toBe(true);
  });

  it("denies everyone else", () => {
    expect(canRead("stranger", doc())).toBe(false);
  });
});

describe("canWrite", () => {
  const d = doc({
    shares: [
      { userId: "u-editor", role: "editor" },
      { userId: "u-viewer", role: "viewer" },
    ],
  });

  it("allows owner and editor", () => {
    expect(canWrite("owner-1", d)).toBe(true);
    expect(canWrite("u-editor", d)).toBe(true);
  });

  it("denies viewer and strangers", () => {
    expect(canWrite("u-viewer", d)).toBe(false);
    expect(canWrite("stranger", d)).toBe(false);
  });
});

describe("isOwner", () => {
  it("is true only for the owner regardless of shares", () => {
    const d = doc({ shares: [{ userId: "u-editor", role: "editor" }] });
    expect(isOwner("owner-1", d)).toBe(true);
    expect(isOwner("u-editor", d)).toBe(false);
  });
});
