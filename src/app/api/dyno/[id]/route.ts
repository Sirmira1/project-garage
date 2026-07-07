import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessVehicle, notFound, unauthorized } from "@/lib/api-helpers";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.dynoRecord.findUnique({
    where: { id },
    select: { id: true, vehicleId: true },
  });
  if (!existing) return notFound();
  if (!(await canAccessVehicle(existing.vehicleId, req, true))) return unauthorized();
  await prisma.dynoRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
