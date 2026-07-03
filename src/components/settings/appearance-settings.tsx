"use client";

import { useEffect } from "react";
import { ACCENTS } from "@/lib/appearance";
import { useAccent } from "@/lib/accent-store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function AppearanceSettings() {
  const activeId = useAccent((s) => s.id);
  const setAccent = useAccent((s) => s.setAccent);
  const hydrate = useAccent((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function selectAccent(id: string) {
    setAccent(id);
    // Persist per-account so the choice syncs across devices.
    fetch("/api/account/appearance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accentColor: id }),
    }).catch(() => {
      /* non-blocking — local change already applied */
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-steel">
          Garage Build Sheet runs in a dark, industrial theme. Pick the accent
          color used across buttons, charts, and highlights. Your choice is
          saved to your account and syncs across devices.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACCENTS.map((accent) => {
          const isActive = activeId === accent.id;
          return (
            <button
              key={accent.id}
              type="button"
              onClick={() => selectAccent(accent.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                isActive
                  ? "border-[color:var(--border)] bg-asphalt-3"
                  : "border-[color:var(--border)] bg-asphalt hover:bg-asphalt-2"
              )}
              style={isActive ? { borderColor: accent.color } : undefined}
            >
              <span
                className="relative flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: accent.color }}
              >
                {isActive && <Check className="size-4 text-asphalt" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-paper">
                  {accent.label}
                </span>
                <span className="block font-mono text-[11px] uppercase text-steel">
                  {accent.color}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
