"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ShoppingDTO } from "@/types/detail";
import { SHOPPING_STATUSES } from "@/lib/constants";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ShoppingStatus } from "@prisma/client";

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: "text-red-400 border-red-400/40",
  MEDIUM: "text-amber-400 border-amber-400/40",
  LOW: "text-steel border-steel/40",
};

const ORDER = SHOPPING_STATUSES.map((s) => s.value);

export function ShoppingTab({
  vehicleId,
  initialItems,
}: {
  vehicleId: string;
  initialItems: ShoppingDTO[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("RESEARCHING");
  const [error, setError] = useState<string | null>(null);

  const { data: items = initialItems } = useQuery<ShoppingDTO[]>({
    queryKey: ["shopping", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/shopping?vehicleId=${vehicleId}`);
      if (!res.ok) return initialItems;
      return res.json();
    },
    initialData: initialItems,
  });

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to add item");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping", vehicleId] });
      toast("Item added", { variant: "success" });
      setOpen(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ShoppingStatus }) => {
      const res = await fetch(`/api/shopping/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping", vehicleId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shopping/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping", vehicleId] }),
  });

  function shift(item: ShoppingDTO, dir: -1 | 1) {
    const idx = ORDER.indexOf(item.status);
    const next = ORDER[idx + dir];
    if (next) move.mutate({ id: item.id, status: next });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string)?.trim() || undefined;
    create.mutate({
      vehicleId,
      name: get("name"),
      estimatedCost: get("estimatedCost"),
      vendorUrl: get("vendorUrl"),
      availability: get("availability"),
      priority,
      status,
    });
  }

  const total = items
    .filter((i) => i.status !== "INSTALLED")
    .reduce((s, i) => s + (i.estimatedCost ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-steel">
          Wishlist value:{" "}
          <span className="font-mono text-orange">{formatCurrency(total)}</span>
        </p>
        <Button onClick={() => setOpen(true)}>
          <Plus /> Add Item
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SHOPPING_STATUSES.map((col, colIdx) => {
          const colItems = items.filter((i) => i.status === col.value);
          return (
            <div
              key={col.value}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                const item = items.find((x) => x.id === id);
                if (item && item.status !== col.value) {
                  move.mutate({ id, status: col.value });
                }
              }}
              className="rounded-xl border border-[color:var(--border)] bg-asphalt-2/60 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase tracking-widest text-steel">
                  {col.label}
                </h3>
                <span className="rounded bg-asphalt-3 px-1.5 text-xs text-steel">
                  {colItems.length}
                </span>
              </div>
              <div className="space-y-2">
                {colItems.map((i) => (
                  <div
                    key={i.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", i.id)
                    }
                    className="cursor-grab rounded-lg border border-[color:var(--border)] bg-asphalt p-3 active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-paper">{i.name}</p>
                      <div className="flex items-center gap-1">
                        {i.vendorUrl && (
                          <a
                            href={i.vendorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-steel hover:text-orange"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => remove.mutate(i.id)}
                          className="text-steel hover:text-red-400"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-xs text-steel">
                        {formatCurrency(i.estimatedCost)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px]",
                          PRIORITY_STYLE[i.priority]
                        )}
                      >
                        {i.priority}
                      </span>
                    </div>
                    {i.availability && (
                      <Badge variant="secondary" className="mt-2">
                        {i.availability}
                      </Badge>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        disabled={colIdx === 0}
                        onClick={() => shift(i, -1)}
                        className="text-steel hover:text-paper disabled:opacity-30"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        disabled={colIdx === SHOPPING_STATUSES.length - 1}
                        onClick={() => shift(i, 1)}
                        className="text-steel hover:text-paper disabled:opacity-30"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {colItems.length === 0 && (
                  <p className="py-4 text-center text-xs text-steel-dim">Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Wishlist Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required placeholder="IS38 Hybrid Turbo" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estimatedCost">Est. cost</Label>
                <Input id="estimatedCost" name="estimatedCost" type="number" placeholder="1800" />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Column</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOPPING_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="availability">Availability</Label>
                <Input id="availability" name="availability" placeholder="In stock" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="vendorUrl">Vendor link</Label>
                <Input id="vendorUrl" name="vendorUrl" type="url" placeholder="https://…" />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="size-4 animate-spin" />}
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
