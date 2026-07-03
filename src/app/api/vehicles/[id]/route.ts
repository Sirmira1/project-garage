import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { vehicleSchema } from "@/lib/validation";

async function ownVehicle(id: string, userId: string) {
  return prisma.vehicle.findFirst({ where: { id, userId } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userId = await requireUserId();
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId },
    });
    if (!vehicle)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await ownVehicle(id, userId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await ownVehicle(id, userId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
