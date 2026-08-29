export const SNAPSHOT_WINDOW_MS = 2 * 60 * 1000;

export interface SnapshotInput {
  /** Does the document currently have content worth preserving? */
  hasExistingContent: boolean;
  /** When the most recent version was captured, if any. */
  latestVersionAt: Date | null;
  /** Author of the document's current state (lastEditedBy), if known. */
  currentStateAuthorId: string | null;
  /** User performing the incoming write. */
  editorId: string;
  now: Date;
}

// A version is captured *before* a write overwrites existing content, when
// the state being overwritten is either someone else's work or old enough
// that losing it would hurt. Debounced autosaves within the window collapse
// into one version.
export function shouldSnapshot({
  hasExistingContent,
  latestVersionAt,
  currentStateAuthorId,
  editorId,
  now,
}: SnapshotInput): boolean {
  if (!hasExistingContent) return false;
  if (latestVersionAt === null) return true;
  if (currentStateAuthorId !== null && currentStateAuthorId !== editorId) {
    return true;
  }
  return now.getTime() - latestVersionAt.getTime() >= SNAPSHOT_WINDOW_MS;
}
