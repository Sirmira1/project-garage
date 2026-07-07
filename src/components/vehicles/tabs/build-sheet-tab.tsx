"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ModDTO } from "@/types/detail";
import { MOD_CATEGORY_LABEL, MOD_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModStatusBadge } from "@/components/vehicles/mod-status-badge";
import { AddModDialog } from "@/components/vehicles/add-mod-dialog";
import { EmptyState } from "@/components/empty-state";
import { Plus, Trash2, Wrench, ExternalLink, Pencil } from "lucide-react";
import type { ModStatus } from "@prisma/client";
import { toast } from "@/components/ui/use-toast";

export function BuildSheetTab({
  vehicleId,
  initialMods,
  canEdit = true,
}: {
  vehicleId: string;
  initialMods: ModDTO[];
  canEdit?: boolean;
}) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMod, setEditingMod] = useState<ModDTO | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: mods = initialMods } = useQuery<ModDTO[]>({
    queryKey: ["mods", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/modifications?vehicleId=${vehicleId}`);
      if (!res.ok) return initialMods;
      return res.json();
    },
    initialData: initialMods,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ModStatus }) => {
      const res = await fetch(`/api/modifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mods", vehicleId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/modifications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mods", vehicleId] });
      toast("Modification removed");
    },
  });

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? mods
        : mods.filter((m) => m.status === statusFilter),
    [mods, statusFilter]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ModDTO[]>();
    for (const m of filtered) {
      const key = m.category;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {MOD_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && (
          <Button onClick={() => { setEditingMod(null); setDialogOpen(true); }}>
            <Plus /> Add Modification
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Wrench className="size-10" />}
          title="No modifications yet"
          description="Log your first mod — from a simple intake to a full engine build."
        >
          {canEdit && (
            <Button className="mt-2" onClick={() => { setEditingMod(null); setDialogOpen(true); }}>
              <Plus /> Add Modification
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-mono text-xs uppercase tracking-widest text-orange">
                  {MOD_CATEGORY_LABEL[items[0].category]}
                </h3>
                <span className="text-xs text-steel">({items.length})</span>
                <div className="h-px flex-1 bg-[color:var(--border)]" />
              </div>
              <div className="space-y-2">
                {items.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col gap-3 rounded-lg border border-[color:var(--border)] bg-asphalt-2 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-paper">{m.name}</p>
                        <ModStatusBadge status={m.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-steel">
                        {[m.brand, m.partNumber].filter(Boolean).join(" · ") ||
                          m.description ||
                          "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      {m.productUrl && (
                        <a
                          href={m.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open link"
                          className="text-steel hover:text-orange"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      )}
                      <div className="text-right">
                        <p className="font-mono text-sm text-paper">
                          {formatCurrency(m.cost)}
                        </p>
                        {m.installDate && (
                          <p className="text-[11px] text-steel">
                            {formatDate(m.installDate)}
                          </p>
                        )}
                      </div>
                      {canEdit && (
                        <Select
                          value={m.status}
                          onValueChange={(v) =>
                            updateStatus.mutate({ id: m.id, status: v as ModStatus })
                          }
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MOD_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-steel hover:text-orange"
                          onClick={() => {
                            setEditingMod(m);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-steel hover:text-red-400"
                          onClick={() => remove.mutate(m.id)}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <AddModDialog
          vehicleId={vehicleId}
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) setEditingMod(null);
          }}
          mod={editingMod}
        />
      )}
    </div>
  );
}
