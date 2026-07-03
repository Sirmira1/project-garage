import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function currentUserId(): Promise<string | null> {
  try {
    return await requireUserId();
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function invalid(issues: unknown) {
  return NextResponse.json({ error: "Invalid input", issues }, { status: 422 });
}

export async function ownsVehicle(
  vehicleId: string,
  userId: string
): Promise<boolean> {
  const v = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId },
    select: { id: true },
  });
  return !!v;
}
