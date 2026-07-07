import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  canAccessVehicle,
  invalid,
  unauthorized,
} from "@/lib/api-helpers";
import { expenseSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const vehicleId = new URL(req.url).searchParams.get("vehicleId");
  if (!vehicleId)
    return NextResponse.json({ error: "vehicleId required" }, { status: 400 });
  if (!(await canAccessVehicle(vehicleId, req, false))) return unauthorized();
  const rows = await prisma.expense.findMany({
    where: { vehicleId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error.flatten());
  if (!(await canAccessVehicle(parsed.data.vehicleId, req, true))) return unauthorized();
  const row = await prisma.expense.create({ data: parsed.data });
  return NextResponse.json(row, { status: 201 });
}
