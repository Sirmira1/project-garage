"use client";

import { create } from "zustand";
import {
  ACCENTS,
  DEFAULT_ACCENT,
  ACCENT_STORAGE_KEY,
  type Accent,
} from "@/lib/appearance";

function accentFor(id: string): Accent {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
}

interface AccentStore {
  id: string;
  color: string;
  dim: string;
  setAccent: (id: string) => void;
  hydrate: () => void;
}

const initial = accentFor(DEFAULT_ACCENT);

export const useAccent = create<AccentStore>((set) => ({
  id: DEFAULT_ACCENT,
  color: initial.color,
  dim: initial.dim,
  setAccent: (id) => {
    const a = accentFor(id);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--color-orange", a.color);
      root.style.setProperty("--color-orange-dim", a.dim);
      try {
        localStorage.setItem(ACCENT_STORAGE_KEY, id);
      } catch {
        /* ignore */
      }
    }
    set({ id, color: a.color, dim: a.dim });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    let id = DEFAULT_ACCENT;
    try {
      id = localStorage.getItem(ACCENT_STORAGE_KEY) || DEFAULT_ACCENT;
    } catch {
      /* ignore */
    }
    const a = accentFor(id);
    set({ id, color: a.color, dim: a.dim });
  },
}));
