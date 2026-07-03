"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocumentDTO } from "@/types/detail";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { FileText, Download, Plus, Trash2, Loader2, Upload } from "lucide-react";

const TYPE_LABEL = Object.fromEntries(
  DOCUMENT_TYPES.map((t) => [t.value, t.label])
) as Record<string, string>;

function isRealUrl(url: string) {
  return !!url && url !== "#" && url.trim() !== "";
}

export function DocumentsTab({
  vehicleId,
  initialDocuments,
}: {
  vehicleId: string;
  initialDocuments: DocumentDTO[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("RECEIPT");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: documents = initialDocuments } = useQuery<DocumentDTO[]>({
    queryKey: ["documents", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/documents?vehicleId=${vehicleId}`);
      if (!res.ok) return initialDocuments;
      return res.json();
    },
    initialData: initialDocuments,
  });

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to add document");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", vehicleId] });
      toast("Document added", { variant: "success" });
      reset();
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", vehicleId] }),
  });

  function reset() {
    setOpen(false);
    setName("");
    setUrl("");
    setError(null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("File too large", { description: "Max 5 MB.", variant: "error" });
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
    setUrl(dataUrl);
    if (!name) setName(file.name);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!isRealUrl(url)) {
      setError("Upload a file or paste a link.");
      return;
    }
    create.mutate({ vehicleId, name: name.trim() || "Document", type, url });
  }

  const grouped = new Map<string, DocumentDTO[]>();
  for (const d of documents) {
    if (!grouped.has(d.type)) grouped.set(d.type, []);
    grouped.get(d.type)!.push(d);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> Add Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-10" />}
          title="No documents"
          description="Store dyno sheets, receipts, invoices, alignment sheets and manuals."
        >
          <Button className="mt-2" onClick={() => setOpen(true)}>
            <Plus /> Add Document
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([t, docs]) => (
            <div key={t}>
              <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-orange">
                {TYPE_LABEL[t]}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((d) => {
                  const real = isRealUrl(d.url);
                  return (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 rounded-lg border border-[color:var(--border)] bg-asphalt-2 p-3"
                    >
                      <FileText className="size-5 shrink-0 text-orange" />
                      {real ? (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={d.name}
                          className="min-w-0 flex-1 truncate text-sm text-paper hover:text-orange"
                        >
                          {d.name}
                        </a>
                      ) : (
                        <span className="min-w-0 flex-1 truncate text-sm text-steel">
                          {d.name}
                        </span>
                      )}
                      {real && <Download className="size-4 text-steel" />}
                      <button
                        onClick={() => remove.mutate(d.id)}
                        className="text-steel hover:text-red-400"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : reset())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="docname">Name</Label>
              <Input
                id="docname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dyno sheet - 292whp.pdf"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>File</Label>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={onFile}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload /> Upload from device
                </Button>
                {url.startsWith("data:") && (
                  <span className="text-xs text-emerald-400">File attached</span>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="docurl">…or paste a link</Label>
              <Input
                id="docurl"
                type="url"
                value={url.startsWith("data:") ? "" : url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={reset}>
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
