import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { modificationUpdateSchema } from "@/lib/validation";

async function ownMod(id: string, userId: string) {
  return prisma.modification.findFirst({
    where: { id, vehicle: { userId } },
  });
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

  const existing = await ownMod(id, userId);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = modificationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { vehicleId: _vehicleId, ...data } = parsed.data;
  void _vehicleId;

  const mod = await prisma.modification.update({
    where: { id },
    data,
  });
  return NextResponse.json(mod);
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

  const existing = await ownMod(id, userId);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.modification.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
