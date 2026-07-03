import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { GarageClient } from "@/components/vehicles/garage-client";
import type { VehicleWithCount } from "@/types/vehicle";

export const dynamic = "force-dynamic";

export default async function GaragePage() {
  const userId = await getCurrentUserId();
  const vehicles = userId
    ? await prisma.vehicle.findMany({
        where: { userId },
        include: { _count: { select: { modifications: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Serialize dates for the client component
  const initial = JSON.parse(JSON.stringify(vehicles)) as VehicleWithCount[];

  return <GarageClient initialVehicles={initial} />;
}
