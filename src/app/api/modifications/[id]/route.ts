import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessVehicle } from "@/lib/api-helpers";
import { modificationUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.modification.findUnique({
    where: { id },
    select: { id: true, vehicleId: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!(await canAccessVehicle(existing.vehicleId, req, true))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = modificationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { vehicleId: _vehicleId, ...data } = parsed.data;
  void _vehicleId;

  const mod = await prisma.modification.update({
    where: { id },
    data,
  });
  return NextResponse.json(mod);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.modification.findUnique({
    where: { id },
    select: { id: true, vehicleId: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!(await canAccessVehicle(existing.vehicleId, req, true))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.modification.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
