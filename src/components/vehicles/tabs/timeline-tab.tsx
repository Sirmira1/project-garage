"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TimelineDTO } from "@/types/detail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { MultiImageField } from "@/components/vehicles/multi-image-field";
import { Clock, Plus, Trash2, Loader2 } from "lucide-react";

const EVENT_TYPES = [
  { value: "MILESTONE", label: "Milestone" },
  { value: "MOD_INSTALLED", label: "Mod Installed" },
  { value: "SERVICE", label: "Service" },
  { value: "DYNO", label: "Dyno" },
  { value: "JOURNAL", label: "Journal" },
  { value: "PHOTO", label: "Photo" },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

export function TimelineTab({
  vehicleId,
  initialEvents,
}: {
  vehicleId: string;
  initialEvents: TimelineDTO[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("MILESTONE");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: events = initialEvents } = useQuery<TimelineDTO[]>({
    queryKey: ["timeline", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/timeline?vehicleId=${vehicleId}`);
      if (!res.ok) return initialEvents;
      return res.json();
    },
    initialData: initialEvents,
  });

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to add event");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timeline", vehicleId] });
      toast("Event added", { variant: "success" });
      setOpen(false);
      setImages([]);
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/timeline/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timeline", vehicleId] }),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string)?.trim() || undefined;
    create.mutate({
      vehicleId,
      type,
      title: get("title"),
      description: get("description"),
      date: get("date"),
      cost: get("cost"),
      imageUrls: images,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> Add Event
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Clock className="size-10" />}
          title="No timeline events yet"
          description="Milestones, services, and dyno pulls appear here. Installing a mod adds one automatically."
        >
          <Button className="mt-2" onClick={() => setOpen(true)}>
            <Plus /> Add Event
          </Button>
        </EmptyState>
      ) : (
        <div className="relative ml-3 space-y-6 border-l border-[color:var(--border)] pl-6">
          {events.map((e) => (
            <div key={e.id} className="relative animate-fade-in">
              <span className="absolute -left-[31px] top-1 flex size-4 items-center justify-center rounded-full border-2 border-orange bg-asphalt">
                <span className="size-1.5 rounded-full bg-orange" />
              </span>
              <div className="rounded-lg border border-[color:var(--border)] bg-asphalt-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-paper">{e.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-steel">
                      {formatDate(e.date)}
                    </span>
                    <button
                      onClick={() => remove.mutate(e.id)}
                      className="text-steel hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {e.description && (
                  <p className="mt-1 text-sm text-steel">{e.description}</p>
                )}
                {(() => {
                  const imgs = [
                    ...(e.imageUrl ? [e.imageUrl] : []),
                    ...(e.imageUrls ?? []),
                  ];
                  if (imgs.length === 0) return null;
                  return (
                    <div
                      className={
                        imgs.length === 1
                          ? "mt-3"
                          : "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
                      }
                    >
                      {imgs.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${url.slice(0, 24)}-${i}`}
                          src={url}
                          alt={e.title}
                          className={
                            imgs.length === 1
                              ? "max-h-[28rem] w-full rounded-md bg-asphalt-3 object-contain"
                              : "aspect-square w-full rounded-md object-cover"
                          }
                        />
                      ))}
                    </div>
                  );
                })()}
                {e.cost != null && (
                  <p className="mt-2 font-mono text-sm text-orange">
                    {formatCurrency(e.cost)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setImages([]);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Timeline Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required placeholder="First track day" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={todayStr()} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cost">Cost (optional)</Label>
                <Input id="cost" name="cost" type="number" placeholder="0" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={2} />
              </div>
              <div className="col-span-2">
                <MultiImageField
                  vehicleId={vehicleId}
                  value={images}
                  onChange={setImages}
                  label="Photos (optional)"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="size-4 animate-spin" />}
                Add Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
