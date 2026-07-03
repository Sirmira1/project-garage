"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PhotoDTO } from "@/types/detail";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Image as ImageIcon } from "lucide-react";

export function GalleryPickerDialog({
  vehicleId,
  open,
  onOpenChange,
  multiple = false,
  onSelect,
}: {
  vehicleId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  multiple?: boolean;
  onSelect: (urls: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) setSelected([]);
  }, [open]);

  const { data: photos = [] } = useQuery<PhotoDTO[]>({
    queryKey: ["photos", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/photos?vehicleId=${vehicleId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  function toggle(url: string) {
    if (!multiple) {
      onSelect([url]);
      onOpenChange(false);
      return;
    }
    setSelected((s) =>
      s.includes(url) ? s.filter((u) => u !== url) : [...s, url]
    );
  }

  function confirm() {
    onSelect(selected);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose from Gallery</DialogTitle>
        </DialogHeader>

        {photos.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="size-10" />}
            title="No photos yet"
            description="Upload photos in the Gallery tab first, then pick from them here."
          />
        ) : (
          <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto py-1 sm:grid-cols-4">
            {photos.map((p) => {
              const isSel = selected.includes(p.url);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.url)}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-lg border transition",
                    isSel
                      ? "border-orange ring-2 ring-orange"
                      : "border-[color:var(--border)] hover:border-steel"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.caption ?? "Vehicle photo"}
                    className="h-full w-full object-cover"
                  />
                  {multiple && isSel && (
                    <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-orange text-white">
                      <Check className="size-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {multiple && photos.length > 0 && (
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirm}
              disabled={selected.length === 0}
            >
              Add{selected.length > 0 ? ` (${selected.length})` : ""}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
