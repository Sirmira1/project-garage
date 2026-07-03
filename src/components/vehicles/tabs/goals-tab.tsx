"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GoalDTO } from "@/types/detail";
import { EmptyState } from "@/components/empty-state";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import { Target, Plus, Trash2, Loader2, Check } from "lucide-react";

export function GoalsTab({
  vehicleId,
  initialGoals,
}: {
  vehicleId: string;
  initialGoals: GoalDTO[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: goals = initialGoals } = useQuery<GoalDTO[]>({
    queryKey: ["goals", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/goals?vehicleId=${vehicleId}`);
      if (!res.ok) return initialGoals;
      return res.json();
    },
    initialData: initialGoals,
  });

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to add goal");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals", vehicleId] });
      toast("Goal added", { variant: "success" });
      setOpen(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", vehicleId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", vehicleId] }),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string)?.trim() || undefined;
    create.mutate({
      vehicleId,
      title: get("title"),
      description: get("description"),
      targetValue: get("targetValue"),
      currentValue: get("currentValue"),
      unit: get("unit"),
      progress: get("progress") ?? 0,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="size-10" />}
          title="No goals set"
          description="Set targets like 400 HP, track-day ready, or an exterior refresh."
        >
          <Button className="mt-2" onClick={() => setOpen(true)}>
            <Plus /> Add Goal
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <div
              key={g.id}
              className="rounded-xl border border-[color:var(--border)] bg-asphalt-2 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg">{g.title}</p>
                  {g.description && (
                    <p className="mt-0.5 text-sm text-steel">{g.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={g.status === "ACHIEVED" ? "success" : "secondary"}>
                    {g.status}
                  </Badge>
                  <button
                    onClick={() => remove.mutate(g.id)}
                    className="text-steel hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between font-mono text-xs">
                  <span className="text-steel">
                    {g.currentValue != null && g.targetValue != null
                      ? `${g.currentValue} / ${g.targetValue} ${g.unit ?? ""}`
                      : "Progress"}
                  </span>
                  <span className="text-orange">{g.progress}%</span>
                </div>
                <Progress value={g.progress} />
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    defaultValue={g.progress}
                    onPointerUp={(e) =>
                      update.mutate({
                        id: g.id,
                        data: { progress: Number(e.currentTarget.value) },
                      })
                    }
                    className="h-1 flex-1 cursor-pointer accent-orange"
                  />
                  {g.status !== "ACHIEVED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        update.mutate({
                          id: g.id,
                          data: { status: "ACHIEVED", progress: 100 },
                        })
                      }
                    >
                      <Check /> Done
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required placeholder="400 whp" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currentValue">Current</Label>
                <Input id="currentValue" name="currentValue" type="number" placeholder="292" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetValue">Target</Label>
                <Input id="targetValue" name="targetValue" type="number" placeholder="400" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" name="unit" placeholder="hp" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="progress">Progress %</Label>
                <Input id="progress" name="progress" type="number" min={0} max={100} defaultValue={0} />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="size-4 animate-spin" />}
                Add Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
