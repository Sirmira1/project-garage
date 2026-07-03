import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId, notFound, unauthorized } from "@/lib/api-helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const existing = await prisma.fitmentRecord.findFirst({
    where: { id, vehicle: { userId } },
  });
  if (!existing) return notFound();

  const body = await req.json().catch(() => ({}));
  // Supports marking a setup as the current one.
  if (body?.current === true) {
    await prisma.fitmentRecord.updateMany({
      where: { vehicleId: existing.vehicleId, current: true },
      data: { current: false },
    });
    const row = await prisma.fitmentRecord.update({
      where: { id },
      data: { current: true },
    });
    return NextResponse.json(row);
  }
  return NextResponse.json(existing);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const existing = await prisma.fitmentRecord.findFirst({
    where: { id, vehicle: { userId } },
  });
  if (!existing) return notFound();
  await prisma.fitmentRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
