import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  currentUserId,
  invalid,
  notFound,
  ownsVehicle,
  unauthorized,
} from "@/lib/api-helpers";
import { serviceSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const vehicleId = new URL(req.url).searchParams.get("vehicleId");
  if (!vehicleId)
    return NextResponse.json({ error: "vehicleId required" }, { status: 400 });
  if (!(await ownsVehicle(vehicleId, userId))) return notFound();
  const rows = await prisma.serviceRecord.findMany({
    where: { vehicleId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error.flatten());
  if (!(await ownsVehicle(parsed.data.vehicleId, userId))) return notFound();

  const data = { ...parsed.data };
  // A completed service always has a date; a planned one does not.
  if (data.status === "DONE" && data.date == null) {
    data.date = new Date();
  }
  if (data.status === "PLANNED") {
    data.date = null;
  }

  const row = await prisma.serviceRecord.create({ data });

  // Keep the vehicle's odometer (Overview) in sync for completed services.
  if (data.status === "DONE" && data.mileage != null) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      select: { currentMileage: true },
    });
    if (!vehicle?.currentMileage || data.mileage > vehicle.currentMileage) {
      await prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { currentMileage: data.mileage },
      });
    }
  }

  return NextResponse.json(row, { status: 201 });
}
