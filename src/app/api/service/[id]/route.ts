import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  currentUserId,
  invalid,
  notFound,
  unauthorized,
} from "@/lib/api-helpers";
import { serviceUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const existing = await prisma.serviceRecord.findFirst({
    where: { id, vehicle: { userId } },
  });
  if (!existing) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = serviceUpdateSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error.flatten());
  const { vehicleId: _v, ...data } = parsed.data;
  void _v;

  // Marking a planned service done stamps a completion date if none supplied.
  if (data.status === "DONE" && data.date == null) {
    data.date = new Date();
  }

  const row = await prisma.serviceRecord.update({ where: { id }, data });

  if (data.mileage != null) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: existing.vehicleId },
      select: { currentMileage: true },
    });
    if (!vehicle?.currentMileage || data.mileage > vehicle.currentMileage) {
      await prisma.vehicle.update({
        where: { id: existing.vehicleId },
        data: { currentMileage: data.mileage },
      });
    }
  }

  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const existing = await prisma.serviceRecord.findFirst({
    where: { id, vehicle: { userId } },
  });
  if (!existing) return notFound();
  await prisma.serviceRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
