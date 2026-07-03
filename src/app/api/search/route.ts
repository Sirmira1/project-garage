import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId, unauthorized } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ vehicles: [], mods: [] });
  }

  const [vehicles, mods] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { nickname: { contains: q, mode: "insensitive" } },
          { make: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, nickname: true },
      take: 5,
    }),
    prisma.modification.findMany({
      where: {
        vehicle: { userId },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { partNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        brand: true,
        vehicleId: true,
        vehicle: { select: { name: true, nickname: true } },
      },
      take: 8,
    }),
  ]);

  return NextResponse.json({
    vehicles: vehicles.map((v) => ({
      id: v.id,
      label: v.nickname || v.name,
    })),
    mods: mods.map((m) => ({
      id: m.id,
      name: m.name,
      brand: m.brand,
      vehicleId: m.vehicleId,
      vehicleName: m.vehicle.nickname || m.vehicle.name,
    })),
  });
}
