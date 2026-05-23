import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/app/(auth)/auth";

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
