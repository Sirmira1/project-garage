"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { MOD_CATEGORIES, MOD_STATUSES, CAR_AREAS } from "@/lib/constants";
import type { ModDTO } from "@/types/detail";
import { Loader2 } from "lucide-react";

export function AddModDialog({
  vehicleId,
  open,
  onOpenChange,
  mod,
}: {
  vehicleId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mod?: ModDTO | null;
}) {
  const qc = useQueryClient();
  const isEdit = !!mod;
  const [category, setCategory] = useState<string>(mod?.category ?? "MISC");
  const [area, setArea] = useState<string>(mod?.area ?? "ENGINE_BAY");
  const [status, setStatus] = useState<string>(mod?.status ?? "WISHLIST");
  const [error, setError] = useState<string | null>(null);

  // Re-sync the controlled selects whenever the dialog opens or the mod changes.
  useEffect(() => {
    if (open) {
      setCategory(mod?.category ?? "MISC");
      setArea(mod?.area ?? "ENGINE_BAY");
      setStatus(mod?.status ?? "WISHLIST");
      setError(null);
    }
  }, [open, mod]);

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(
        isEdit ? `/api/modifications/${mod!.id}` : "/api/modifications",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error ?? `Failed to ${isEdit ? "update" : "add"} modification`
        );
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mods", vehicleId] });
      toast(isEdit ? "Modification updated" : "Modification added", {
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    // On edit, an emptied optional field is explicitly cleared (null).
    const get = (k: string) => {
      const v = (fd.get(k) as string)?.trim() ?? "";
      if (v !== "") return v;
      return isEdit ? null : undefined;
    };
    mutation.mutate({
      vehicleId,
      name: (fd.get("name") as string)?.trim(),
      brand: get("brand"),
      cost: get("cost"),
      installDate: get("installDate"),
      partNumber: get("partNumber"),
      productUrl: get("productUrl"),
      description: get("description"),
      category,
      area,
      status,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Modification" : "Add Modification"}</DialogTitle>
        </DialogHeader>
        <form key={mod?.id ?? "new"} onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Cobb Stage 2 Tune"
                defaultValue={mod?.name}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOD_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Car Area</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAR_AREAS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" placeholder="Cobb Tuning" defaultValue={mod?.brand ?? undefined} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost">Cost</Label>
              <Input id="cost" name="cost" type="number" placeholder="695" defaultValue={mod?.cost ?? undefined} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="installDate">Install Date</Label>
              <Input id="installDate" name="installDate" type="date" defaultValue={mod?.installDate ? mod.installDate.slice(0, 10) : undefined} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partNumber">Part Number</Label>
              <Input id="partNumber" name="partNumber" placeholder="AP3-VMS-201" defaultValue={mod?.partNumber ?? undefined} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="productUrl">Link (optional)</Label>
              <Input
                id="productUrl"
                name="productUrl"
                type="url"
                placeholder="https://… link to the part"
                defaultValue={mod?.productUrl ?? undefined}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={2} defaultValue={mod?.description ?? undefined} />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
