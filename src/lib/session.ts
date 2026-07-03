import { auth } from "@/lib/auth";

export const DEMO_EMAIL = "demo@garage.dev";

/**
 * Returns the current user's id. In development, if there is no active
 * session it falls back to the seeded demo user so the app is browsable
 * out of the box. In production it returns null when unauthenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  return null;
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new Error("Unauthorized");
  return id;
}
