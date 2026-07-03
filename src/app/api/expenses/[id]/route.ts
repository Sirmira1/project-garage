import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  currentUserId,
  invalid,
  notFound,
  unauthorized,
} from "@/lib/api-helpers";
import { expenseUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const existing = await prisma.expense.findFirst({
    where: { id, vehicle: { userId } },
  });
  if (!existing) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = expenseUpdateSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error.flatten());

  const { vehicleId: _vehicleId, ...data } = parsed.data;
  void _vehicleId;

  const row = await prisma.expense.update({ where: { id }, data });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const existing = await prisma.expense.findFirst({
    where: { id, vehicle: { userId } },
  });
  if (!existing) return notFound();
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
