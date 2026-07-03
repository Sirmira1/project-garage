import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId, notFound, unauthorized } from "@/lib/api-helpers";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const existing = await prisma.timelineEvent.findFirst({
    where: { id, vehicle: { userId } },
  });
  if (!existing) return notFound();
  await prisma.timelineEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
