"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { VehicleWithCount } from "@/types/vehicle";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { VehicleFormDialog } from "@/components/vehicles/vehicle-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Warehouse } from "lucide-react";
import { BUILD_STATUSES } from "@/lib/constants";
import type { BuildStatus } from "@prisma/client";

type SortKey = "recent" | "name" | "hp" | "mods";
type StatusKey = "all" | BuildStatus;

export function GarageClient({
  initialVehicles,
}: {
  initialVehicles: VehicleWithCount[];
}) {
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [makeFilter, setMakeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    if (searchParams.get("new") === "1") setDialogOpen(true);
  }, [searchParams]);

  const { data: vehicles = initialVehicles } = useQuery<VehicleWithCount[]>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles");
      if (!res.ok) return initialVehicles;
      return res.json();
    },
    initialData: initialVehicles,
  });

  const makes = useMemo(
    () =>
      Array.from(
        new Set(vehicles.map((v) => v.make).filter(Boolean) as string[])
      ).sort(),
    [vehicles]
  );

  const filtered = useMemo(() => {
    let list = vehicles.filter((v) => {
      const hay = [v.name, v.nickname, v.make, v.model, v.trim]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query.toLowerCase());
    });
    if (makeFilter !== "all") list = list.filter((v) => v.make === makeFilter);
    if (statusFilter !== "all")
      list = list.filter((v) => v.buildStatus === statusFilter);

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return (a.nickname || a.name).localeCompare(b.nickname || b.name);
        case "hp":
          return (b.currentHp ?? 0) - (a.currentHp ?? 0);
        case "mods":
          return b._count.modifications - a._count.modifications;
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
    return list;
  }, [vehicles, query, makeFilter, statusFilter, sort]);

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">
      <PageHeader title="Garage" subtitle={`${vehicles.length} vehicles`}>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus /> Add Vehicle
        </Button>
      </PageHeader>

      {vehicles.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vehicles…"
              className="pl-9"
            />
          </div>
          <Select value={makeFilter} onValueChange={setMakeFilter}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="All makes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All makes</SelectItem>
              {makes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusKey)}
          >
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {BUILD_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="hp">Horsepower</SelectItem>
              <SelectItem value="mods">Most mods</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="size-10" />}
          title={vehicles.length === 0 ? "No vehicles yet" : "No matches"}
          description={
            vehicles.length === 0
              ? "Add your first project car to get started."
              : "Try a different search or filter."
          }
        >
          {vehicles.length === 0 && (
            <Button className="mt-2" onClick={() => setDialogOpen(true)}>
              <Plus /> Add Vehicle
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}

      <VehicleFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
