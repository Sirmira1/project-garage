"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { fileToResizedDataUrl } from "@/lib/image";
import { GalleryPickerDialog } from "@/components/vehicles/gallery-picker-dialog";
import { ImagePlus, Images, Link2, Loader2, X } from "lucide-react";

export function MultiImageField({
  vehicleId,
  value,
  onChange,
  label = "Photos",
}: {
  vehicleId?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addUrls(urls: string[]) {
    const merged = [...value];
    for (const u of urls) {
      const t = u.trim();
      if (t && !merged.includes(t)) merged.push(t);
    }
    onChange(merged);
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      const added: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) {
          toast("Skipped a file", {
            description: `${file.name} is over 10 MB.`,
          });
          continue;
        }
        added.push(await fileToResizedDataUrl(file, 1600, 0.82));
      }
      addUrls(added);
    } catch {
      toast("Could not read image", { variant: "error" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function addUrl() {
    const u = urlValue.trim();
    if (!u) return;
    addUrls([u]);
    setUrlValue("");
    setShowUrl(false);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFiles}
      />

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <div
              key={`${url.slice(0, 24)}-${i}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-[color:var(--border)] bg-asphalt-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-paper opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} Upload
        </Button>
        {vehicleId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setGalleryOpen(true)}
          >
            <Images /> Gallery
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowUrl((s) => !s)}
        >
          <Link2 /> URL
        </Button>
      </div>

      {showUrl && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://…"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <Button type="button" variant="secondary" size="sm" onClick={addUrl}>
            Add
          </Button>
        </div>
      )}

      <p className="text-xs text-steel">
        Upload one or more from your device, paste a URL, or pick from your
        gallery.
      </p>

      {vehicleId && (
        <GalleryPickerDialog
          vehicleId={vehicleId}
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          multiple
          onSelect={addUrls}
        />
      )}
    </div>
  );
}
