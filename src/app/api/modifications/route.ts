import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessVehicle } from "@/lib/api-helpers";
import { modificationSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  if (!vehicleId)
    return NextResponse.json({ error: "vehicleId required" }, { status: 400 });

  if (!(await canAccessVehicle(vehicleId, req, false))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mods = await prisma.modification.findMany({
    where: { vehicleId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(mods);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = modificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  if (!(await canAccessVehicle(parsed.data.vehicleId, req, true))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mod = await prisma.modification.create({ data: parsed.data });

  // Auto-create a timeline event when a mod is installed
  if (mod.status === "INSTALLED") {
    await prisma.timelineEvent.create({
      data: {
        vehicleId: mod.vehicleId,
        type: "MOD_INSTALLED",
        title: `Installed ${mod.name}`,
        description: mod.brand ?? undefined,
        date: mod.installDate ?? new Date(),
        cost: mod.cost ?? undefined,
      },
    });
  }

  return NextResponse.json(mod, { status: 201 });
}
