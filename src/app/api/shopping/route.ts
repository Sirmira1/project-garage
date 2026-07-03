import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  currentUserId,
  invalid,
  notFound,
  ownsVehicle,
  unauthorized,
} from "@/lib/api-helpers";
import { shoppingSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const vehicleId = new URL(req.url).searchParams.get("vehicleId");
  if (!vehicleId)
    return NextResponse.json({ error: "vehicleId required" }, { status: 400 });
  if (!(await ownsVehicle(vehicleId, userId))) return notFound();
  const rows = await prisma.shoppingItem.findMany({
    where: { vehicleId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = shoppingSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error.flatten());
  if (!(await ownsVehicle(parsed.data.vehicleId, userId))) return notFound();
  const row = await prisma.shoppingItem.create({ data: parsed.data });
  return NextResponse.json(row, { status: 201 });
}
