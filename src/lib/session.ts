import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const DEMO_EMAIL = "demo@garage.dev";

/**
 * Returns the current user's id. In development, if there is no active
 * session it falls back to the seeded demo user so the app is browsable
 * out of the box. In production it returns null when unauthenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  if (process.env.NODE_ENV !== "production") {
    // Prefer the seeded demo account, but fall back to the first user in the
    // DB so the app stays browsable even if the demo email was changed.
    const demo = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      select: { id: true },
    });
    if (demo) return demo.id;

    const first = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    return first?.id ?? null;
  }

  return null;
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new Error("Unauthorized");
  return id;
}
