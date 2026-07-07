import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { cookies } from "next/headers";

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

async function readShareParams(req?: Request): Promise<{
  shareSlug?: string;
  shareEdit?: string;
}> {
  const fromUrl = (() => {
    if (!req) return { shareSlug: undefined, shareEdit: undefined };
    const sp = new URL(req.url).searchParams;
    return {
      shareSlug: sp.get("shareSlug") ?? undefined,
      shareEdit: sp.get("shareEdit") ?? undefined,
    };
  })();

  const cookieStore = await cookies();

  return {
    shareSlug:
      fromUrl.shareSlug ??
      cookieStore.get("garage_share_slug")?.value ??
      undefined,
    shareEdit:
      fromUrl.shareEdit ??
      cookieStore.get("garage_share_edit")?.value ??
      undefined,
  };
}

export async function canAccessVehicle(
  vehicleId: string,
  req?: Request,
  write = false
): Promise<boolean> {
  const userId = await currentUserId();
  if (userId && (await ownsVehicle(vehicleId, userId))) return true;

  const { shareSlug, shareEdit } = await readShareParams(req);
  if (!shareSlug) return false;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, shareEnabled: true, shareSlug },
    select: { shareEditToken: true },
  });
  if (!vehicle) return false;

  if (!write) return true;
  return !!vehicle.shareEditToken && !!shareEdit && vehicle.shareEditToken === shareEdit;
}
