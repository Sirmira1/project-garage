"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { mainNav } from "@/lib/nav";
import { Search, Warehouse, Plus, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCommandPalette = create<CommandStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));

type VehicleLite = { id: string; name: string; nickname: string | null };

interface CommandEntry {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const { isOpen, close, toggle } = useCommandPalette();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);

  const { data: vehicles = [] } = useQuery<VehicleLite[]>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen,
  });

  const { data: search } = useQuery<{
    mods: {
      id: string;
      name: string;
      brand: string | null;
      vehicleId: string;
      vehicleName: string;
    }[];
  }>({
    queryKey: ["search", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return { mods: [] };
      return res.json();
    },
    enabled: isOpen && query.trim().length >= 2,
  });

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const go = React.useCallback(
    (href: string) => {
      close();
      setQuery("");
      router.push(href);
    },
    [close, router]
  );

  const entries: CommandEntry[] = React.useMemo(() => {
    const navEntries: CommandEntry[] = mainNav.map((n) => ({
      id: `nav-${n.href}`,
      label: n.label,
      hint: "Page",
      icon: <n.icon className="size-4" />,
      action: () => go(n.href),
    }));

    const vehicleEntries: CommandEntry[] = vehicles.map((v) => ({
      id: `veh-${v.id}`,
      label: v.nickname || v.name,
      hint: "Vehicle",
      icon: <Warehouse className="size-4" />,
      action: () => go(`/garage/${v.id}`),
    }));

    const actionEntries: CommandEntry[] = [
      {
        id: "action-new-vehicle",
        label: "Add new vehicle",
        hint: "Action",
        icon: <Plus className="size-4" />,
        action: () => go("/garage?new=1"),
      },
    ];

    return [...navEntries, ...vehicleEntries, ...actionEntries];
  }, [vehicles, go]);

  const filtered = entries.filter((e) =>
    e.label.toLowerCase().includes(query.toLowerCase())
  );

  const modEntries: CommandEntry[] = (search?.mods ?? []).map((m) => ({
    id: `mod-${m.id}`,
    label: m.name,
    hint: m.vehicleName,
    icon: <Wrench className="size-4" />,
    action: () => go(`/garage/${m.vehicleId}`),
  }));

  const results = [...filtered, ...modEntries];

  React.useEffect(() => setActive(0), [query, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (o ? undefined : close())}>
      <DialogContent className="top-[20%] max-w-xl translate-y-0 gap-0 p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 border-b border-[color:var(--border)] px-4">
          <Search className="size-4 text-steel" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                results[active]?.action();
              }
            }}
            placeholder="Search pages, vehicles, parts…"
            className="h-12 flex-1 bg-transparent text-sm text-paper outline-none placeholder:text-steel-dim"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-steel">
              No results.
            </p>
          )}
          {results.map((e, i) => (
            <button
              key={e.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => e.action()}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm",
                i === active
                  ? "bg-orange/15 text-orange"
                  : "text-paper hover:bg-asphalt-3"
              )}
            >
              <span className="text-steel">{e.icon}</span>
              <span className="flex-1">{e.label}</span>
              {e.hint && (
                <span className="font-mono text-[10px] uppercase text-steel-dim">
                  {e.hint}
                </span>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
