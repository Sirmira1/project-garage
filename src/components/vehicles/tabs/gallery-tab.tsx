"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PhotoDTO } from "@/types/detail";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { fileToResizedDataUrl } from "@/lib/image";
import { Image as ImageIcon, X, Upload, Trash2, Loader2 } from "lucide-react";

export function GalleryTab({
  vehicleId,
  initialPhotos,
}: {
  vehicleId: string;
  initialPhotos: PhotoDTO[];
}) {
  const qc = useQueryClient();
  const [lightbox, setLightbox] = useState<PhotoDTO | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: photos = initialPhotos } = useQuery<PhotoDTO[]>({
    queryKey: ["photos", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/photos?vehicleId=${vehicleId}`);
      if (!res.ok) return initialPhotos;
      return res.json();
    },
    initialData: initialPhotos,
  });

  const addPhoto = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, url }),
      });
      if (!res.ok) throw new Error("Failed to upload");
      return res.json();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos", vehicleId] }),
  });

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) {
          toast("Skipped a file", { description: `${file.name} is over 10 MB.` });
          continue;
        }
        const url = await fileToResizedDataUrl(file, 1600, 0.82);
        await addPhoto.mutateAsync(url);
      }
      qc.invalidateQueries({ queryKey: ["photos", vehicleId] });
      toast("Photos uploaded", { variant: "success" });
    } catch {
      toast("Upload failed", { variant: "error" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFiles}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
          Upload Photos
        </Button>
      </div>

      {photos.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="size-10" />}
          title="No photos yet"
          description="Build progress shots, install pics and glamour shots live here."
        >
          <Button className="mt-2" onClick={() => fileRef.current?.click()}>
            <Upload /> Upload Photos
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-[color:var(--border)] bg-asphalt-3"
            >
              <button
                onClick={() => setLightbox(p)}
                className="h-full w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption ?? "Vehicle photo"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
              <button
                onClick={() => remove.mutate(p.id)}
                className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-paper opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
              {p.caption && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left text-xs text-paper">
                  {p.caption}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute right-5 top-5 text-steel hover:text-paper">
            <X className="size-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt={lightbox.caption ?? "Vehicle photo"}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
