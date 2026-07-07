"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { VehicleDetailData, ModDTO } from "@/types/detail";
import { vehicleTabs } from "@/lib/nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OverviewTab } from "@/components/vehicles/tabs/overview-tab";
import { BuildSheetTab } from "@/components/vehicles/tabs/build-sheet-tab";
import { CarDiagramTab } from "@/components/vehicles/tabs/car-diagram-tab";
import { TimelineTab } from "@/components/vehicles/tabs/timeline-tab";
import { AnalyticsTab } from "@/components/vehicles/tabs/analytics-tab";
import { CostsTab } from "@/components/vehicles/tabs/costs-tab";
import { DynoTab } from "@/components/vehicles/tabs/dyno-tab";
import { GalleryTab } from "@/components/vehicles/tabs/gallery-tab";
import { ServiceTab } from "@/components/vehicles/tabs/service-tab";
import { ShoppingTab } from "@/components/vehicles/tabs/shopping-tab";
import { GoalsTab } from "@/components/vehicles/tabs/goals-tab";
import { DocumentsTab } from "@/components/vehicles/tabs/documents-tab";
import { NotesTab } from "@/components/vehicles/tabs/notes-tab";
import { DeleteVehicleButton } from "@/components/vehicles/delete-vehicle-button";
import { VehicleFormDialog } from "@/components/vehicles/vehicle-form-dialog";
import { exportModsCsv } from "@/lib/export";
import { computeBuildStats } from "@/lib/analytics";
import { formatCurrency, cn } from "@/lib/utils";
import { BUILD_STATUS_META } from "@/lib/constants";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Download, Car, Pencil, FileText, Warehouse, Share2, Copy } from "lucide-react";

type AccessMode = "owner" | "view" | "edit";

export function VehicleDetail({
  data,
  access = "owner",
  shareContext,
}: {
  data: VehicleDetailData;
  access?: AccessMode;
  shareContext?: { shareSlug: string; shareEdit?: string };
}) {
  const { vehicle } = data;
  const qc = useQueryClient();
  const router = useRouter();
  const canEdit = access === "owner" || access === "edit";
  const isOwner = access === "owner";
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);
  const [shareLinks, setShareLinks] = useState<{ viewUrl: string | null; editUrl: string | null } | null>(null);

  useEffect(() => {
    if (!shareContext?.shareSlug) return;
    document.cookie = `garage_share_slug=${encodeURIComponent(shareContext.shareSlug)}; path=/; max-age=604800; samesite=lax`;
    if (shareContext.shareEdit) {
      document.cookie = `garage_share_edit=${encodeURIComponent(shareContext.shareEdit)}; path=/; max-age=604800; samesite=lax`;
    }
  }, [shareContext]);

  const moveToGarage = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildStatus: "OWNED" }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast("Moved to your garage", { variant: "success" });
      router.refresh();
    },
    onError: () => toast("Could not update", { variant: "error" }),
  });

  // Shared mods query — every mod-derived view (header, overview, analytics,
  // diagram, build sheet) reads from this, so changes update live everywhere.
  const { data: mods = data.modifications } = useQuery<ModDTO[]>({
    queryKey: ["mods", vehicle.id],
    queryFn: async () => {
      const res = await fetch(`/api/modifications?vehicleId=${vehicle.id}`);
      if (!res.ok) return data.modifications;
      return res.json();
    },
    initialData: data.modifications,
  });

  const loadShare = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/vehicles/${vehicle.id}/share`);
      if (!res.ok) throw new Error("Failed to load share links");
      return res.json() as Promise<{ enabled: boolean; viewUrl: string | null; editUrl: string | null }>;
    },
    onSuccess: (r) => {
      setShareLinks({ viewUrl: r.viewUrl, editUrl: r.editUrl });
      setAllowEdit(!!r.editUrl);
    },
    onError: () => toast("Could not load share settings", { variant: "error" }),
  });

  const saveShare = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/vehicles/${vehicle.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true, allowEdit }),
      });
      if (!res.ok) throw new Error("Failed to save share settings");
      return res.json() as Promise<{ enabled: boolean; viewUrl: string | null; editUrl: string | null }>;
    },
    onSuccess: (r) => {
      setShareLinks({ viewUrl: r.viewUrl, editUrl: r.editUrl });
      toast("Share link updated", { variant: "success" });
    },
    onError: () => toast("Could not save share settings", { variant: "error" }),
  });

  function copy(text: string | null) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast("Copied link", { variant: "success" });
  }

  const stats = computeBuildStats(mods, data.expenses);
  const modsSpent = computeBuildStats(mods).totalSpent;
  const heroCost =
    vehicle.buildStatus === "OWNED" ? stats.totalSpent : stats.plannedSpending;
  const title = vehicle.nickname || vehicle.name;
  const subtitle =
    [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
      .filter(Boolean)
      .join(" ") || "Project car";

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">
      <Link
        href={isOwner ? "/garage" : "/"}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-steel hover:text-paper"
      >
        <ArrowLeft className="size-4" /> {isOwner ? "Garage" : "Home"}
      </Link>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-asphalt-2">
        <div className="relative h-40 bg-asphalt-3 sm:h-52">
          {vehicle.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.coverImage}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Car className="size-14 text-steel-dim" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-asphalt-2 via-asphalt-2/40 to-transparent" />
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-steel">{subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {vehicle.buildStatus !== "OWNED" && (
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    BUILD_STATUS_META[vehicle.buildStatus].className
                  )}
                >
                  {BUILD_STATUS_META[vehicle.buildStatus].label}
                </span>
              )}
              <Chip label={`${stats.installedCount} installed`} />
              <Chip
                label={`${formatCurrency(heroCost)} ${
                  vehicle.buildStatus === "OWNED" ? "spent" : "planned"
                }`}
                accent
              />
              {vehicle.currentHp && <Chip label={`${vehicle.currentHp} hp`} />}
              {vehicle.drivetrain && <Chip label={vehicle.drivetrain} />}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && vehicle.buildStatus !== "OWNED" && (
              <Button
                onClick={() => moveToGarage.mutate()}
                disabled={moveToGarage.isPending}
              >
                <Warehouse /> Move to Garage
              </Button>
            )}
            {isOwner && (
              <Button
                variant="secondary"
                onClick={() => {
                  setShareOpen(true);
                  loadShare.mutate();
                }}
              >
                <Share2 /> Share
              </Button>
            )}
            {canEdit && (
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil /> Edit
              </Button>
            )}
            <Button asChild variant="secondary">
              <a
                href={`/report/${vehicle.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText /> Report
              </a>
            </Button>
            {canEdit && (
              <Button
              variant="secondary"
              onClick={() => exportModsCsv(title, mods)}
            >
              <Download /> Export CSV
              </Button>
            )}
            {canEdit && <DeleteVehicleButton vehicleId={vehicle.id} vehicleName={title} />}
          </div>
        </div>
      </div>

      {canEdit && (
        <VehicleFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          vehicle={vehicle}
        />
      )}

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Share this build</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-steel">
              Viewers with this link can see this car and all tabs. You can optionally grant edit permission with a separate link.
            </p>
            <label className="flex items-center gap-2 text-sm text-paper">
              <input
                type="checkbox"
                checked={allowEdit}
                onChange={(e) => setAllowEdit(e.target.checked)}
              />
              Allow editing with edit link
            </label>
            <Button onClick={() => saveShare.mutate()} disabled={saveShare.isPending}>
              Save share settings
            </Button>

            {shareLinks?.viewUrl && (
              <div className="space-y-1.5">
                <Label>View-only link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={shareLinks.viewUrl} />
                  <Button type="button" variant="secondary" onClick={() => copy(shareLinks.viewUrl)}>
                    <Copy />
                  </Button>
                </div>
              </div>
            )}

            {allowEdit && shareLinks?.editUrl && (
              <div className="space-y-1.5">
                <Label>Edit link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={shareLinks.editUrl} />
                  <Button type="button" variant="secondary" onClick={() => copy(shareLinks.editUrl)}>
                    <Copy />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="w-full">
          {vehicleTabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              <t.icon className="size-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            vehicle={vehicle}
            mods={mods}
            fitments={data.fitments}
          />
        </TabsContent>
        <TabsContent value="build">
          <BuildSheetTab vehicleId={vehicle.id} initialMods={data.modifications} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="diagram">
          <CarDiagramTab mods={mods} />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineTab vehicleId={vehicle.id} initialEvents={data.timeline} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab mods={mods} expenses={data.expenses} />
        </TabsContent>
        <TabsContent value="costs">
          <CostsTab
            vehicleId={vehicle.id}
            purchasePrice={vehicle.purchasePrice}
            purchaseDate={vehicle.purchaseDate}
            modsSpent={modsSpent}
            initialExpenses={data.expenses}
          />
        </TabsContent>
        <TabsContent value="dyno">
          <DynoTab vehicleId={vehicle.id} initialRecords={data.dyno} />
        </TabsContent>
        <TabsContent value="gallery">
          <GalleryTab vehicleId={vehicle.id} initialPhotos={data.photos} />
        </TabsContent>
        <TabsContent value="service">
          <ServiceTab
            vehicleId={vehicle.id}
            initialServices={data.services}
            currentMileage={vehicle.currentMileage}
          />
        </TabsContent>
        <TabsContent value="shopping">
          <ShoppingTab vehicleId={vehicle.id} initialItems={data.shopping} />
        </TabsContent>
        <TabsContent value="goals">
          <GoalsTab vehicleId={vehicle.id} initialGoals={data.goals} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab vehicleId={vehicle.id} initialDocuments={data.documents} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab vehicleId={vehicle.id} initialNotes={data.notes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={
        accent
          ? "rounded-full bg-orange/15 px-3 py-1 text-xs font-medium text-orange"
          : "rounded-full bg-asphalt-3 px-3 py-1 text-xs text-steel"
      }
    >
      {label}
    </span>
  );
}
