import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { ACCENTS } from "@/lib/appearance";

export async function PATCH(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const accentColor = body?.accentColor;
  if (
    typeof accentColor !== "string" ||
    !ACCENTS.some((a) => a.id === accentColor)
  ) {
    return NextResponse.json({ error: "Invalid accent" }, { status: 422 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { accentColor },
  });

  return NextResponse.json({ accentColor });
}
