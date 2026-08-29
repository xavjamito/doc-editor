import { describe, expect, it } from "vitest";
import { SNAPSHOT_WINDOW_MS, shouldSnapshot } from "./versions";

const now = new Date("2026-08-29T12:00:00Z");

const base = {
  hasExistingContent: true,
  latestVersionAt: null as Date | null,
  currentStateAuthorId: "alice",
  editorId: "alice",
  now,
};

describe("shouldSnapshot", () => {
  it("never snapshots an empty document", () => {
    expect(
      shouldSnapshot({ ...base, hasExistingContent: false })
    ).toBe(false);
  });

  it("snapshots the first time existing content is overwritten", () => {
    expect(shouldSnapshot({ ...base, latestVersionAt: null })).toBe(true);
  });

  it("snapshots when a different user overwrites the current state", () => {
    expect(
      shouldSnapshot({
        ...base,
        latestVersionAt: new Date(now.getTime() - 1000),
        currentStateAuthorId: "alice",
        editorId: "bob",
      })
    ).toBe(true);
  });

  it("collapses same-user saves inside the window into one version", () => {
    expect(
      shouldSnapshot({
        ...base,
        latestVersionAt: new Date(now.getTime() - 1000),
      })
    ).toBe(false);
  });

  it("snapshots again once the window has passed", () => {
    expect(
      shouldSnapshot({
        ...base,
        latestVersionAt: new Date(now.getTime() - SNAPSHOT_WINDOW_MS),
      })
    ).toBe(true);
  });

  it("treats unknown current-state author as same-user (window applies)", () => {
    expect(
      shouldSnapshot({
        ...base,
        currentStateAuthorId: null,
        latestVersionAt: new Date(now.getTime() - 1000),
      })
    ).toBe(false);
  });
});
