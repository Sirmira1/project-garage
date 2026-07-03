"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FitmentDTO } from "@/types/detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { CircleDot, Plus, Trash2, Check, Loader2, Settings2 } from "lucide-react";

function fmt(f: FitmentDTO) {
  const wheels =
    f.wheelDiameter != null && f.wheelWidth != null
      ? `${f.wheelDiameter}x${f.wheelWidth}${
          f.offset != null ? ` ${f.offset > 0 ? "+" : ""}${f.offset}` : ""
        }`
      : "—";
  return { wheels, tires: f.tireSize ?? "—" };
}

export function FitmentManager({
  vehicleId,
  initialFitments,
}: {
  vehicleId: string;
  initialFitments: FitmentDTO[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: fitments = initialFitments } = useQuery<FitmentDTO[]>({
    queryKey: ["fitments", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/fitments?vehicleId=${vehicleId}`);
      if (!res.ok) return initialFitments;
      return res.json();
    },
    initialData: initialFitments,
  });

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/fitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to add fitment");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fitments", vehicleId] });
      toast("Fitment saved", { variant: "success" });
      setOpen(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  const setAsCurrent = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/fitments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: true }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fitments", vehicleId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/fitments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fitments", vehicleId] }),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string)?.trim() || undefined;
    create.mutate({
      vehicleId,
      label: get("label"),
      wheelDiameter: get("wheelDiameter"),
      wheelWidth: get("wheelWidth"),
      offset: get("offset"),
      tireSize: get("tireSize"),
      current,
    });
  }

  const currentFitment = fitments.find((f) => f.current) ?? fitments[0];
  const cur = currentFitment ? fmt(currentFitment) : null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CircleDot className="size-4 text-orange" /> Wheel &amp; Tire Fitment
        </CardTitle>
        <div className="flex items-center gap-1">
          {fitments.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(true)}
              title="Manage setups"
            >
              <Settings2 />
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            <Plus /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {cur ? (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div>
              <p className="font-mono text-xs uppercase text-steel">Wheels</p>
              <p className="font-display text-lg">{cur.wheels}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-steel">Tires</p>
              <p className="font-display text-lg">{cur.tires}</p>
            </div>
            {currentFitment?.label && (
              <div>
                <p className="font-mono text-xs uppercase text-steel">Setup</p>
                <p className="text-sm text-paper">{currentFitment.label}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-steel">No fitment recorded yet.</p>
        )}

        {fitments.length > 1 && (
          <div className="mt-4 space-y-2 border-t border-[color:var(--border)] pt-3">
            {fitments.map((f) => {
              const v = fmt(f);
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-paper">
                      {f.label || `${v.wheels} · ${v.tires}`}
                    </span>
                    {f.current && <Badge variant="success">Current</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {!f.current && (
                      <button
                        onClick={() => setAsCurrent.mutate(f.id)}
                        className="text-steel hover:text-emerald-400"
                        title="Set as current"
                      >
                        <Check className="size-4" />
                      </button>
                    )}
                    <button
                      onClick={() => remove.mutate(f.id)}
                      className="text-steel hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fitment Setup</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="label">Setup name</Label>
                <Input id="label" name="label" placeholder="Summer / Track" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wheelDiameter">Diameter (in)</Label>
                <Input id="wheelDiameter" name="wheelDiameter" type="number" step="0.5" placeholder="18" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wheelWidth">Width (in)</Label>
                <Input id="wheelWidth" name="wheelWidth" type="number" step="0.5" placeholder="9.5" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offset">Offset (mm)</Label>
                <Input id="offset" name="offset" type="number" placeholder="38" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tireSize">Tire size</Label>
                <Input id="tireSize" name="tireSize" placeholder="255/35R18" />
              </div>
              <label className="col-span-2 flex cursor-pointer items-center gap-2 text-sm text-paper">
                <input
                  type="checkbox"
                  checked={current}
                  onChange={(e) => setCurrent(e.target.checked)}
                  className="size-4 accent-orange"
                />
                Set as current setup
              </label>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
