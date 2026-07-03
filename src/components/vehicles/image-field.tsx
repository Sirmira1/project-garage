"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { fileToResizedDataUrl } from "@/lib/image";
import { ImagePlus, Link2, Loader2, Trash2, Car } from "lucide-react";

export function ImageField({
  name = "coverImage",
  defaultValue = "",
  label = "Cover Image",
}: {
  name?: string;
  defaultValue?: string;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [showUrl, setShowUrl] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Not an image", { description: "Pick a JPG, PNG or WebP.", variant: "error" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast("Image too large", { description: "Max 8 MB.", variant: "error" });
      return;
    }
    setBusy(true);
    try {
      const resized = await fileToResizedDataUrl(file);
      setValue(resized);
    } catch {
      toast("Could not read image", { variant: "error" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={value} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      <div className="flex gap-3">
        <div className="relative flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[color:var(--border)] bg-asphalt-3">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Cover preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <Car className="size-8 text-steel-dim" />
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="size-5 animate-spin text-paper" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <ImagePlus /> Upload
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUrl((s) => !s)}
            >
              <Link2 /> URL
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-steel hover:text-red-400"
                onClick={() => setValue("")}
              >
                <Trash2 /> Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-steel">
            Upload from your device, or paste an image URL.
          </p>
        </div>
      </div>

      {showUrl && (
        <Input
          type="url"
          placeholder="https://…"
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
    </div>
  );
}
