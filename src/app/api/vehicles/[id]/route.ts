import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessVehicle, currentUserId, notFound, unauthorized } from "@/lib/api-helpers";
import { vehicleSchema } from "@/lib/validation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!(await canAccessVehicle(id, _req, false))) return unauthorized();
  const userId = await currentUserId();
  const vehicle = await prisma.vehicle.findFirst({
    where: userId ? { id, userId } : { id, shareEnabled: true },
  });
  if (!vehicle) return notFound();
  return NextResponse.json(vehicle);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canAccessVehicle(id, req, true))) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = vehicleSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(vehicle);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!(await canAccessVehicle(id, req, true))) return unauthorized();

  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
