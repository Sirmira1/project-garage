import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessVehicle, notFound, unauthorized } from "@/lib/api-helpers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.fitmentRecord.findUnique({
    where: { id },
    select: { id: true, vehicleId: true },
  });
  if (!existing) return notFound();
  if (!(await canAccessVehicle(existing.vehicleId, req, true))) return unauthorized();

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
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.fitmentRecord.findUnique({
    where: { id },
    select: { id: true, vehicleId: true },
  });
  if (!existing) return notFound();
  if (!(await canAccessVehicle(existing.vehicleId, req, true))) return unauthorized();
  await prisma.fitmentRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
