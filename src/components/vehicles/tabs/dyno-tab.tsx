"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DynoDTO } from "@/types/detail";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynoLineChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Gauge, Plus, Trash2, Loader2 } from "lucide-react";

const todayStr = () => new Date().toISOString().slice(0, 10);

export function DynoTab({
  vehicleId,
  initialRecords,
}: {
  vehicleId: string;
  initialRecords: DynoDTO[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: records = initialRecords } = useQuery<DynoDTO[]>({
    queryKey: ["dyno", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/dyno?vehicleId=${vehicleId}`);
      if (!res.ok) return initialRecords;
      return res.json();
    },
    initialData: initialRecords,
  });

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/dyno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to add record");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dyno", vehicleId] });
      toast("Dyno result added", { variant: "success" });
      setOpen(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dyno/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dyno", vehicleId] }),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string)?.trim() || undefined;
    create.mutate({
      vehicleId,
      date: get("date"),
      hp: get("hp"),
      torque: get("torque"),
      zeroToSixty: get("zeroToSixty"),
      sixtyTo130: get("sixtyTo130"),
      quarterMile: get("quarterMile"),
      notes: get("notes"),
    });
  }

  const chartData = records.map((r) => ({
    date: formatDate(r.date),
    hp: r.hp,
    torque: r.torque,
  }));

  const best = records.reduce<DynoDTO | null>(
    (b, r) => ((r.hp ?? 0) > (b?.hp ?? 0) ? r : b),
    null
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {best?.hp != null ? (
          <p className="text-sm text-steel">
            Best pull:{" "}
            <span className="font-mono text-orange">
              {best.hp} hp{best.torque != null ? ` / ${best.torque} tq` : ""}
            </span>
          </p>
        ) : (
          <span />
        )}
        <Button onClick={() => setOpen(true)}>
          <Plus /> Add Dyno Result
        </Button>
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={<Gauge className="size-10" />}
          title="No dyno results yet"
          description="Log HP, torque, 0–60, and quarter-mile runs to graph your gains over time."
        >
          <Button className="mt-2" onClick={() => setOpen(true)}>
            <Plus /> Add Dyno Result
          </Button>
        </EmptyState>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Power Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <DynoLineChart data={chartData} />
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-xl border border-[color:var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-asphalt-2 text-left font-mono text-xs uppercase tracking-wide text-steel">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">HP</th>
                  <th className="px-4 py-3 text-right">Torque</th>
                  <th className="px-4 py-3 text-right">0–60</th>
                  <th className="px-4 py-3 text-right">1/4 mi</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-[color:var(--border)] hover:bg-asphalt-2"
                  >
                    <td className="px-4 py-3 text-steel">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 text-right font-mono text-paper">
                      {r.hp ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-steel">
                      {r.torque ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-steel">
                      {r.zeroToSixty != null ? `${r.zeroToSixty}s` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-steel">
                      {r.quarterMile != null ? `${r.quarterMile}s` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove.mutate(r.id)}
                        className="text-steel hover:text-red-400"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dyno Result</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={todayStr()} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hp">Horsepower</Label>
                <Input id="hp" name="hp" type="number" step="0.1" placeholder="292" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="torque">Torque</Label>
                <Input id="torque" name="torque" type="number" step="0.1" placeholder="350" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zeroToSixty">0–60 (s)</Label>
                <Input id="zeroToSixty" name="zeroToSixty" type="number" step="0.1" placeholder="5.1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quarterMile">1/4 mile (s)</Label>
                <Input id="quarterMile" name="quarterMile" type="number" step="0.1" placeholder="13.4" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} placeholder="93 octane, cool day" />
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
