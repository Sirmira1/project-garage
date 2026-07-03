export interface Accent {
  id: string;
  label: string;
  color: string;
  dim: string;
}

export const ACCENTS: Accent[] = [
  { id: "orange", label: "Performance Orange", color: "#FF6A13", dim: "#FF8A45" },
  { id: "amber", label: "Sunset Amber", color: "#F59E0B", dim: "#FBBF24" },
  { id: "yellow", label: "Viper Yellow", color: "#E8C547", dim: "#F0D66E" },
  { id: "lime", label: "Acid Lime", color: "#84CC16", dim: "#A3E635" },
  { id: "green", label: "Nitrous Green", color: "#35C46A", dim: "#5FD98C" },
  { id: "teal", label: "Track Teal", color: "#14B8A6", dim: "#2DD4BF" },
  { id: "cyan", label: "Coolant Cyan", color: "#22D3EE", dim: "#67E8F9" },
  { id: "blue", label: "Electric Blue", color: "#4C8DFF", dim: "#78ABFF" },
  { id: "indigo", label: "Midnight Indigo", color: "#6366F1", dim: "#818CF8" },
  { id: "violet", label: "Deep Violet", color: "#7C3AED", dim: "#9B6BF0" },
  { id: "purple", label: "Royal Purple", color: "#A855F7", dim: "#C084FC" },
  { id: "magenta", label: "Nitro Magenta", color: "#D946EF", dim: "#E879F9" },
  { id: "pink", label: "Hot Pink", color: "#FF4D8D", dim: "#FF77A8" },
  { id: "red", label: "Redline Red", color: "#E5484D", dim: "#F16A6F" },
  { id: "steel", label: "Gunmetal Steel", color: "#9BA6B2", dim: "#B8C0C9" },
];

export const DEFAULT_ACCENT = "orange";
export const ACCENT_STORAGE_KEY = "gbs-accent";

/** Returns a valid accent id, falling back to the default. */
export function normalizeAccent(id: string | null | undefined): string {
  return ACCENTS.some((a) => a.id === id) ? (id as string) : DEFAULT_ACCENT;
}

export function applyAccent(id: string) {
  if (typeof document === "undefined") return;
  const accent = ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
  const root = document.documentElement;
  root.style.setProperty("--color-orange", accent.color);
  root.style.setProperty("--color-orange-dim", accent.dim);
}

/**
 * Inline script (runs before paint) to apply the saved accent without a flash.
 * When `serverId` is provided (the signed-in user's saved preference) it wins
 * over localStorage and is mirrored into localStorage so it syncs across
 * devices. When it's null (signed out) it falls back to localStorage/default.
 */
export function accentInitScript(serverId?: string | null): string {
  const map = Object.fromEntries(ACCENTS.map((a) => [a.id, [a.color, a.dim]]));
  return `(function(){try{var m=${JSON.stringify(map)};var s=${JSON.stringify(
    serverId ?? null
  )};var id=s||localStorage.getItem(${JSON.stringify(
    ACCENT_STORAGE_KEY
  )})||${JSON.stringify(
    DEFAULT_ACCENT
  )};if(s){try{localStorage.setItem(${JSON.stringify(
    ACCENT_STORAGE_KEY
  )},s);}catch(e){}}var c=m[id]||m.orange;var r=document.documentElement;r.style.setProperty('--color-orange',c[0]);r.style.setProperty('--color-orange-dim',c[1]);}catch(e){}})();`;
}

/** Backwards-compatible default script (localStorage only). */
export const ACCENT_INIT_SCRIPT = accentInitScript();
