import { getSession, SessionPayload } from "./session";
import { prisma } from "./db";

export interface AdminOrTeacherSession {
  session: SessionPayload;
  isTeacher: boolean;
  isAdmin: boolean;
  /** Prisma `where` fragment to scope queries to the caller's own content */
  scopeWhere: { createdById: string } | Record<string, never>;
}

/**
 * Checks that the caller is either an admin or a teacher.
 * Returns null (with no Response) so the caller can return a 401 themselves,
 * or returns the session info with scoping helpers.
 */
export async function getAdminOrTeacherSession(): Promise<AdminOrTeacherSession | null> {
  const session = await getSession();
  if (!session) return null;

  if (session.isAdmin) {
    return { session, isAdmin: true, isTeacher: false, scopeWhere: {} };
  }

  if (session.accountType === "TEACHER") {
    return {
      session,
      isAdmin: false,
      isTeacher: true,
      scopeWhere: { createdById: session.userId },
    };
  }

  return null;
}

/**
 * Verify that a teacher owns a specific resource.
 * Admins always pass. Teachers must match createdById.
 */
export function canAccess(
  auth: AdminOrTeacherSession,
  resourceCreatedById: string | null
): boolean {
  if (auth.isAdmin) return true;
  return resourceCreatedById === auth.session.userId;
}

/**
 * Verify deck ownership for admin/teacher. Returns the deck or null.
 */
export async function verifyDeckAccess(
  auth: AdminOrTeacherSession,
  deckId: string
) {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { id: true, createdById: true },
  });
  if (!deck) return null;
  if (!canAccess(auth, deck.createdById)) return null;
  return deck;
}
