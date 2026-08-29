import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const USER_COOKIE = "doc-editor-user";
export const DEFAULT_USER_ID = "user-alice";

// Mocked auth (deliberate scope cut, see PRD §2): identity comes from a
// cookie set by the user switcher. Every server route still resolves the
// user against the database so access checks are real.
export async function getCurrentUser() {
  const store = await cookies();
  const userId = store.get(USER_COOKIE)?.value ?? DEFAULT_USER_ID;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) return user;
  return prisma.user.findUniqueOrThrow({ where: { id: DEFAULT_USER_ID } });
}
