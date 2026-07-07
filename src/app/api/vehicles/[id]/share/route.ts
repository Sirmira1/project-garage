import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

function makeToken(bytes = 16) {
  return randomBytes(bytes).toString("hex");
}

function buildBaseUrl(req: Request) {
  return new URL(req.url).origin;
}

export async function GET(
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

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId },
    select: {
      id: true,
      shareEnabled: true,
      shareSlug: true,
      shareEditToken: true,
    },
  });
  if (!vehicle)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const base = buildBaseUrl(req);
  const viewUrl =
    vehicle.shareEnabled && vehicle.shareSlug
      ? `${base}/share/${vehicle.shareSlug}`
      : null;
  const editUrl =
    vehicle.shareEnabled && vehicle.shareSlug && vehicle.shareEditToken
      ? `${base}/share/${vehicle.shareSlug}?edit=${vehicle.shareEditToken}`
      : null;

  return NextResponse.json({
    enabled: vehicle.shareEnabled,
    viewUrl,
    editUrl,
  });
}

export async function POST(
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

  const body = (await req.json().catch(() => ({}))) as {
    enabled?: boolean;
    allowEdit?: boolean;
    regenerate?: boolean;
  };

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId },
    select: {
      id: true,
      shareEnabled: true,
      shareSlug: true,
      shareEditToken: true,
    },
  });
  if (!vehicle)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const enabled = body.enabled ?? true;
  const allowEdit = body.allowEdit ?? !!vehicle.shareEditToken;
  const regenerate = body.regenerate ?? false;

  const updated = await prisma.vehicle.update({
    where: { id },
    data: {
      shareEnabled: enabled,
      shareSlug: enabled
        ? regenerate || !vehicle.shareSlug
          ? makeToken(10)
          : vehicle.shareSlug
        : null,
      shareEditToken:
        enabled && allowEdit
          ? regenerate || !vehicle.shareEditToken
            ? makeToken(16)
            : vehicle.shareEditToken
          : null,
    },
    select: {
      shareEnabled: true,
      shareSlug: true,
      shareEditToken: true,
    },
  });

  const base = buildBaseUrl(req);
  const viewUrl =
    updated.shareEnabled && updated.shareSlug
      ? `${base}/share/${updated.shareSlug}`
      : null;
  const editUrl =
    updated.shareEnabled && updated.shareSlug && updated.shareEditToken
      ? `${base}/share/${updated.shareSlug}?edit=${updated.shareEditToken}`
      : null;

  return NextResponse.json({
    enabled: updated.shareEnabled,
    viewUrl,
    editUrl,
  });
}
