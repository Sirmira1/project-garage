import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { accountSchema } from "@/lib/validation";

export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true },
    });
    if (!user)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const { name, email, currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Email uniqueness check
  if (email !== user.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken && taken.id !== userId) {
      return NextResponse.json(
        { error: "That email is already in use." },
        { status: 409 }
      );
    }
  }

  const data: { name: string; email: string; passwordHash?: string } = {
    name,
    email,
  };

  // Password change flow
  if (newPassword) {
    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Enter your current password to set a new one." },
          { status: 422 }
        );
      }
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 422 }
        );
      }
    }
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, image: true },
  });

  return NextResponse.json(updated);
}
