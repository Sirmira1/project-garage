"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NoteDTO } from "@/types/detail";
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
import { toast } from "@/components/ui/use-toast";
import { StickyNote, Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";

function renderInline(text: string, key: number) {
  // **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span key={key}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="text-paper">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  );
}

function Markdown({
  content,
  onToggle,
}: {
  content: string;
  onToggle: (lineIndex: number) => void;
}) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1 text-sm text-steel">
      {lines.map((line, i) => {
        const heading = line.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
          const level = heading[1].length;
          const cls =
            level === 1
              ? "font-display text-lg text-paper mt-2"
              : level === 2
                ? "font-display text-base text-paper mt-2"
                : "font-medium text-paper mt-1";
          return (
            <p key={i} className={cls}>
              {heading[2]}
            </p>
          );
        }
        const check = line.match(/^- \[( |x|X)\]\s+(.*)$/);
        if (check) {
          const done = check[1].toLowerCase() === "x";
          return (
            <label
              key={i}
              className="flex cursor-pointer items-start gap-2 py-0.5"
            >
              <input
                type="checkbox"
                checked={done}
                onChange={() => onToggle(i)}
                className="mt-0.5 size-4 accent-orange"
              />
              <span className={done ? "text-steel-dim line-through" : "text-paper"}>
                {check[2]}
              </span>
            </label>
          );
        }
        const bullet = line.match(/^[-*]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-orange">•</span>
              {renderInline(bullet[1], i)}
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i}>{renderInline(line, i)}</p>;
      })}
    </div>
  );
}

function NoteCard({
  note,
  vehicleId,
}: {
  note: NoteDTO;
  vehicleId: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title ?? "");
  const [content, setContent] = useState(note.content);

  const save = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", vehicleId] });
      setEditing(false);
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", vehicleId] }),
  });

  function toggleLine(lineIndex: number) {
    const lines = note.content.split("\n");
    const line = lines[lineIndex];
    const m = line.match(/^- \[( |x|X)\]\s+/);
    if (!m) return;
    lines[lineIndex] =
      m[1].toLowerCase() === "x"
        ? line.replace(/^- \[[xX]\]/, "- [ ]")
        : line.replace(/^- \[ \]/, "- [x]");
    save.mutate({ title: note.title ?? "", content: lines.join("\n") });
  }

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-asphalt-2 p-4">
      {editing ? (
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="font-mono text-xs"
            placeholder={"## Heading\n- [ ] a checklist item\n- [x] done item\n- a bullet\n**bold** text"}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => save.mutate({ title, content })}
              disabled={save.isPending}
            >
              <Check /> Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="font-display text-base">{note.title || "Untitled note"}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setTitle(note.title ?? "");
                  setContent(note.content);
                  setEditing(true);
                }}
                className="text-steel hover:text-paper"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => remove.mutate()}
                className="text-steel hover:text-red-400"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          {note.content.trim() ? (
            <Markdown content={note.content} onToggle={toggleLine} />
          ) : (
            <p className="text-sm text-steel-dim">Empty — click edit to write.</p>
          )}
        </>
      )}
    </div>
  );
}

export function NotesTab({
  vehicleId,
  initialNotes,
}: {
  vehicleId: string;
  initialNotes: NoteDTO[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: notes = initialNotes } = useQuery<NoteDTO[]>({
    queryKey: ["notes", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/notes?vehicleId=${vehicleId}`);
      if (!res.ok) return initialNotes;
      return res.json();
    },
    initialData: initialNotes,
  });

  const create = useMutation({
    mutationFn: async (payload: { title: string; content: string }) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, ...payload }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to add note");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", vehicleId] });
      toast("Note added", { variant: "success" });
      setOpen(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    create.mutate({
      title: ((fd.get("title") as string) ?? "").trim(),
      content: ((fd.get("content") as string) ?? "").trim(),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus /> New Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<StickyNote className="size-10" />}
          title="No notes yet"
          description="Keep build notes, to-do checklists, and reminders. Supports markdown and checkboxes."
        >
          <Button className="mt-2" onClick={() => setOpen(true)}>
            <Plus /> New Note
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} vehicleId={vehicleId} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="note-title">Title</Label>
              <Input id="note-title" name="title" placeholder="Build notes" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                name="content"
                rows={8}
                className="font-mono text-xs"
                placeholder={"## To-do\n- [ ] Order IS38\n- [x] Fresh alignment\n**Note:** running great on 93 octane"}
              />
              <p className="text-xs text-steel">
                Supports markdown: <code>##</code> headings, <code>- [ ]</code>{" "}
                checklists, <code>**bold**</code>.
              </p>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="size-4 animate-spin" />}
                Add Note
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
