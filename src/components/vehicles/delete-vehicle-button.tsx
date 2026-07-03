"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteVehicleButton({
  vehicleId,
  vehicleName,
}: {
  vehicleId: string;
  vehicleName: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete vehicle");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast("Vehicle deleted", { variant: "success" });
      setOpen(false);
      router.push("/garage");
      router.refresh();
    },
    onError: (e: Error) =>
      toast("Could not delete", { description: e.message, variant: "error" }),
  });

  return (
    <>
      <Button
        variant="outline"
        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
        onClick={() => setOpen(true)}
      >
        <Trash2 /> Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete vehicle?</DialogTitle>
            <DialogDescription>
              This permanently removes <strong className="text-paper">{vehicleName}</strong>{" "}
              and all of its mods, photos, service records, goals, and documents.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
