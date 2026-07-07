import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  canAccessVehicle,
  invalid,
  notFound,
  unauthorized,
} from "@/lib/api-helpers";
import { shoppingUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.shoppingItem.findUnique({
    where: { id },
    select: { id: true, vehicleId: true },
  });
  if (!existing) return notFound();
  if (!(await canAccessVehicle(existing.vehicleId, req, true))) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = shoppingUpdateSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error.flatten());
  const { vehicleId: _v, ...data } = parsed.data;
  void _v;
  const row = await prisma.shoppingItem.update({ where: { id }, data });
  return NextResponse.json(row);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.shoppingItem.findUnique({
    where: { id },
    select: { id: true, vehicleId: true },
  });
  if (!existing) return notFound();
  if (!(await canAccessVehicle(existing.vehicleId, req, true))) return unauthorized();
  await prisma.shoppingItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
