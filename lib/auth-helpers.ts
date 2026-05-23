import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/app/(auth)/auth";
import { hasVisitedInRange } from "@/lib/db/queries";
import { kstDateStamp, kstDayBounds } from "@/lib/geo";

/**
 * Use inside an async server component (always under a <Suspense>) or a
 * server action. Returns the session when the caller is an admin;
 * otherwise redirects (login if anonymous, / if a logged-in customer).
 */
export async function requireAdmin(
  callbackUrl = "/admin/books"
): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}

export type BoardAccess =
  | { kind: "anonymous" }
  | { kind: "needsCheckIn"; session: Session }
  | { kind: "ok"; session: Session; isAdmin: boolean };

/**
 * The records board is in-store only: non-admins need to have checked
 * in via /me today (KST) to read or write. Returns a discriminated
 * union so the page can render anonymous, needs-check-in, or content
 * states without juggling redirects.
 *
 * Admins bypass the geofence so they can moderate from anywhere.
 */
export async function getBoardAccess(): Promise<BoardAccess> {
  const session = await auth();
  if (!session?.user?.id) {
    return { kind: "anonymous" };
  }
  const isAdmin = session.user.role === "admin";
  if (isAdmin) {
    return { kind: "ok", session, isAdmin: true };
  }
  const { start, end } = kstDayBounds(kstDateStamp());
  const visited = await hasVisitedInRange({
    userId: session.user.id,
    start,
    end,
  });
  if (!visited) {
    return { kind: "needsCheckIn", session };
  }
  return { kind: "ok", session, isAdmin: false };
}
