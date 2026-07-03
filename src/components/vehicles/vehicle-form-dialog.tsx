"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageField } from "@/components/vehicles/image-field";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export interface VehicleFormInitial {
  id: string;
  name: string;
  nickname?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  generation?: string | null;
  engine?: string | null;
  transmission?: string | null;
  drivetrain?: string | null;
  stockHp?: number | null;
  currentHp?: number | null;
  targetHp?: number | null;
  stockTorque?: number | null;
  currentTorque?: number | null;
  factoryWeight?: number | null;
  currentWeight?: number | null;
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  currentMileage?: number | null;
  vin?: string | null;
  coverImage?: string | null;
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required,
  span,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  span?: boolean;
  defaultValue?: string | number;
}) {
  return (
    <div className={span ? "col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-orange"> *</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
      />
    </div>
  );
}

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  vehicle?: VehicleFormInitial | null;
}) {
  const qc = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!vehicle?.id;

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string | null>) => {
      const res = await fetch(
        isEdit ? `/api/vehicles/${vehicle!.id}` : "/api/vehicles",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save vehicle");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast(isEdit ? "Vehicle updated" : "Vehicle added", {
        variant: "success",
      });
      onOpenChange(false);
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string | null> = {};
    fd.forEach((v, k) => {
      if (typeof v !== "string") return;
      const trimmed = v.trim();
      if (trimmed !== "") {
        data[k] = trimmed;
      } else if (isEdit && k !== "name") {
        // On edit, an emptied field is explicitly cleared (null); "name" is required.
        data[k] = null;
      }
    });
    mutation.mutate(data);
  }

  const dateValue = vehicle?.purchaseDate
    ? vehicle.purchaseDate.slice(0, 10)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the spec sheet for this build."
              : "Drop in the essentials now — you can flesh out the spec sheet later."}
          </DialogDescription>
        </DialogHeader>

        <form
          key={vehicle?.id ?? "new"}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <ImageField
            defaultValue={vehicle?.coverImage ?? ""}
            vehicleId={vehicle?.id}
          />

          <div className="grid grid-cols-2 gap-4">
            <Field name="name" label="Name" required placeholder="Project GTI" span defaultValue={vehicle?.name} />
            <Field name="nickname" label="Nickname" placeholder="Wolfsburg" defaultValue={vehicle?.nickname ?? undefined} />
            <Field name="year" label="Year" type="number" placeholder="2016" defaultValue={vehicle?.year ?? undefined} />
            <Field name="make" label="Make" placeholder="Volkswagen" defaultValue={vehicle?.make ?? undefined} />
            <Field name="model" label="Model" placeholder="Golf GTI" defaultValue={vehicle?.model ?? undefined} />
            <Field name="trim" label="Trim" placeholder="Autobahn" defaultValue={vehicle?.trim ?? undefined} />
            <Field name="generation" label="Generation" placeholder="Mk7" defaultValue={vehicle?.generation ?? undefined} />
            <Field name="engine" label="Engine" placeholder="2.0T EA888" defaultValue={vehicle?.engine ?? undefined} />
            <Field name="transmission" label="Transmission" placeholder="6MT" defaultValue={vehicle?.transmission ?? undefined} />
            <Field name="drivetrain" label="Drivetrain" placeholder="FWD" defaultValue={vehicle?.drivetrain ?? undefined} />
            <Field name="stockHp" label="Stock HP" type="number" placeholder="210" defaultValue={vehicle?.stockHp ?? undefined} />
            <Field name="currentHp" label="Current HP" type="number" placeholder="210" defaultValue={vehicle?.currentHp ?? undefined} />
            <Field name="targetHp" label="Target HP" type="number" placeholder="320" defaultValue={vehicle?.targetHp ?? undefined} />
            <Field name="currentTorque" label="Torque (tq)" type="number" placeholder="350" defaultValue={vehicle?.currentTorque ?? undefined} />
            <Field name="factoryWeight" label="Factory Weight (lb)" type="number" placeholder="3100" defaultValue={vehicle?.factoryWeight ?? undefined} />
            <Field name="currentWeight" label="Current Weight (lb)" type="number" placeholder="3040" defaultValue={vehicle?.currentWeight ?? undefined} />
            <Field name="purchasePrice" label="Purchase Price" type="number" placeholder="24000" defaultValue={vehicle?.purchasePrice ?? undefined} />
            <Field name="purchaseDate" label="Purchase Date" type="date" defaultValue={dateValue} />
            <Field name="currentMileage" label="Mileage" type="number" placeholder="42000" defaultValue={vehicle?.currentMileage ?? undefined} />
            <Field name="vin" label="VIN (optional)" placeholder="WVW…" span defaultValue={vehicle?.vin ?? undefined} />
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
              {isEdit ? "Save changes" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
