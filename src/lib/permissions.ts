export type ShareRole = "viewer" | "editor";
export type AccessLevel = "owner" | ShareRole;

export interface ShareLike {
  userId: string;
  role: ShareRole;
}

export interface DocumentLike {
  ownerId: string;
  shares: ShareLike[];
}

export function resolveAccess(
  userId: string,
  doc: DocumentLike
): AccessLevel | null {
  if (doc.ownerId === userId) return "owner";
  const share = doc.shares.find((s) => s.userId === userId);
  return share ? share.role : null;
}

export function canRead(userId: string, doc: DocumentLike): boolean {
  return resolveAccess(userId, doc) !== null;
}

export function canWrite(userId: string, doc: DocumentLike): boolean {
  const access = resolveAccess(userId, doc);
  return access === "owner" || access === "editor";
}

export function isOwner(userId: string, doc: DocumentLike): boolean {
  return doc.ownerId === userId;
}
