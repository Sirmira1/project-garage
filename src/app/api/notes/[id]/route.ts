import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  currentUserId,
  invalid,
  notFound,
  unauthorized,
} from "@/lib/api-helpers";
import { noteUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const existing = await prisma.note.findFirst({
    where: { id, vehicle: { userId } },
  });
  if (!existing) return notFound();
  const body = await req.json().catch(() => null);
  const parsed = noteUpdateSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error.flatten());
  const row = await prisma.note.update({ where: { id }, data: parsed.data });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const existing = await prisma.note.findFirst({
    where: { id, vehicle: { userId } },
  });
  if (!existing) return notFound();
  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
