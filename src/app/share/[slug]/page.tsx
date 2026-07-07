import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VehicleDetail } from "@/components/vehicles/vehicle-detail";
import type { VehicleDetailData } from "@/types/detail";

export const dynamic = "force-dynamic";

export default async function SharedVehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { slug } = await params;
  const { edit } = await searchParams;

  const vehicle = await prisma.vehicle.findFirst({
    where: { shareEnabled: true, shareSlug: slug },
    include: {
      modifications: { orderBy: { createdAt: "desc" } },
      serviceRecords: { orderBy: { date: "desc" } },
      goals: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { sortOrder: "asc" } },
      timeline: { orderBy: { date: "desc" } },
      shoppingItems: { orderBy: { sortOrder: "asc" } },
      fitments: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { updatedAt: "desc" } },
      dynoRecords: { orderBy: { date: "asc" } },
      expenses: { orderBy: { date: "desc" } },
    },
  });

  if (!vehicle) notFound();

  const canEdit = !!edit && !!vehicle.shareEditToken && edit === vehicle.shareEditToken;

  const data = JSON.parse(
    JSON.stringify({
      vehicle,
      modifications: vehicle.modifications,
      services: vehicle.serviceRecords,
      goals: vehicle.goals,
      documents: vehicle.documents,
      photos: vehicle.photos,
      timeline: vehicle.timeline,
      shopping: vehicle.shoppingItems,
      fitments: vehicle.fitments,
      notes: vehicle.notes,
      dyno: vehicle.dynoRecords,
      expenses: vehicle.expenses,
    })
  ) as VehicleDetailData;

  return (
    <VehicleDetail
      data={data}
      access={canEdit ? "edit" : "view"}
      shareContext={{ shareSlug: slug, shareEdit: canEdit ? edit : undefined }}
    />
  );
}
