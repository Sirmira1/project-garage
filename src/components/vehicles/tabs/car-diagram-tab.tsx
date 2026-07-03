"use client";

import { useMemo, useState } from "react";
import type { ModDTO } from "@/types/detail";
import type { CarArea } from "@prisma/client";
import { CAR_AREA_LABEL } from "@/lib/constants";
import { ModStatusBadge } from "@/components/vehicles/mod-status-badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAccent } from "@/lib/accent-store";

const HOTSPOTS: {
  area: CarArea;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}[] = [
  { area: "FRONT", label: "Front", x: 34, y: 112, w: 80, h: 44 },
  { area: "ENGINE_BAY", label: "Engine Bay", x: 112, y: 104, w: 88, h: 52 },
  { area: "INTERIOR", label: "Interior", x: 206, y: 72, w: 152, h: 46 },
  { area: "REAR", label: "Rear", x: 416, y: 100, w: 104, h: 56 },
  { area: "UNDERBODY", label: "Underbody", x: 150, y: 158, w: 292, h: 22 },
];

export function CarDiagramTab({ mods }: { mods: ModDTO[] }) {
  const [selected, setSelected] = useState<CarArea | null>(null);
  const [hovered, setHovered] = useState<CarArea | null>(null);
  const accent = useAccent((s) => s.color);

  const countByArea = useMemo(() => {
    const map = new Map<CarArea, number>();
    for (const m of mods) map.set(m.area, (map.get(m.area) ?? 0) + 1);
    return map;
  }, [mods]);

  const installedByArea = useMemo(() => {
    const map = new Map<CarArea, number>();
    for (const m of mods) {
      if (m.status === "INSTALLED")
        map.set(m.area, (map.get(m.area) ?? 0) + 1);
    }
    return map;
  }, [mods]);

  const areaMods = selected
    ? mods.filter((m) => m.area === selected)
    : [];

  const activeArea = hovered ?? selected;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl border border-[color:var(--border)] bg-asphalt-2 p-4">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-steel">
          Interactive Build Map — click a zone
        </p>
        <svg
          viewBox="0 0 560 200"
          className="w-full"
          role="img"
          aria-label="Car diagram — side profile, front facing left"
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34343b" />
              <stop offset="100%" stopColor="#26262a" />
            </linearGradient>
          </defs>

          {/* Ground shadow + line */}
          <ellipse cx="285" cy="183" rx="235" ry="7" fill="#000" opacity="0.35" />
          <line x1="20" y1="182" x2="540" y2="182" stroke="#34343a" strokeWidth="2" />

          {/* Body (side profile, front on the left) */}
          <path
            d="M40 150
               Q38 126 64 124
               L150 116
               L198 84
               Q206 76 226 76
               L350 76
               Q374 76 388 92
               L432 116
               L500 120
               Q518 122 518 140
               L518 150
               Z"
            fill="url(#bodyGrad)"
            stroke="#5f6167"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Beltline + door split + handle */}
          <line x1="150" y1="117" x2="500" y2="121" stroke="#3a3a40" strokeWidth="1.5" />
          <line x1="288" y1="80" x2="288" y2="150" stroke="#3a3a40" strokeWidth="1.5" />
          <rect x="250" y="124" width="16" height="4" rx="2" fill="#55575b" />

          {/* Greenhouse / glass */}
          <path d="M212 96 L233 82 L283 82 L283 96 Z" fill="#141416" stroke="#4a4c50" />
          <path d="M293 82 L346 82 Q366 82 378 96 L293 96 Z" fill="#141416" stroke="#4a4c50" />

          {/* Headlight (front / left) and taillight (rear / right) */}
          <path d="M42 128 L60 126 L60 137 L44 139 Z" fill="#ffd9a0" opacity="0.85" />
          <rect x="505" y="126" width="11" height="12" rx="2" fill="#ff5a4d" opacity="0.85" />

          {/* Wheels */}
          <g>
            <circle cx="150" cy="150" r="30" fill="#141416" stroke="#55575b" strokeWidth="3" />
            <circle cx="150" cy="150" r="12" fill="#26262a" stroke="#8A8D91" strokeWidth="1.5" />
            <circle cx="150" cy="150" r="3" fill="#8A8D91" />
          </g>
          <g>
            <circle cx="430" cy="150" r="30" fill="#141416" stroke="#55575b" strokeWidth="3" />
            <circle cx="430" cy="150" r="12" fill="#26262a" stroke="#8A8D91" strokeWidth="1.5" />
            <circle cx="430" cy="150" r="3" fill="#8A8D91" />
          </g>

          {/* Hotspots */}
          {HOTSPOTS.map((h) => {
            const count = countByArea.get(h.area) ?? 0;
            const isActive = activeArea === h.area || selected === h.area;
            return (
              <g
                key={h.area}
                onClick={() => setSelected(h.area)}
                onMouseEnter={() => setHovered(h.area)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <rect
                  x={h.x}
                  y={h.y}
                  width={h.w}
                  height={h.h}
                  rx={8}
                  fill={isActive ? accent : "rgba(138,141,145,0.10)"}
                  fillOpacity={isActive ? 0.22 : 1}
                  stroke={isActive ? accent : "#55575b"}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={isActive ? "0" : "4 3"}
                />
                {count > 0 && (
                  <>
                    <circle
                      cx={h.x + h.w - 10}
                      cy={h.y + 10}
                      r={9}
                      fill={accent}
                    />
                    <text
                      x={h.x + h.w - 10}
                      y={h.y + 14}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#1b1b1d"
                    >
                      {count}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        <div className="mt-3 flex flex-wrap gap-2">
          {HOTSPOTS.map((h) => {
            const count = countByArea.get(h.area) ?? 0;
            const installed = installedByArea.get(h.area) ?? 0;
            return (
              <button
                key={h.area}
                onClick={() => setSelected(h.area)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs transition-colors",
                  selected === h.area
                    ? "border-orange bg-orange/15 text-orange"
                    : "border-[color:var(--border)] text-steel hover:text-paper"
                )}
              >
                {h.label} · {installed}/{count}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-[color:var(--border)] bg-asphalt-2 p-4">
        <h3 className="font-display text-lg">
          {selected ? CAR_AREA_LABEL[selected] : "Select a zone"}
        </h3>
        <p className="mb-3 text-xs text-steel">
          {selected
            ? `${areaMods.length} modifications in this area`
            : "Click any highlighted zone on the diagram to see its parts."}
        </p>
        <div className="space-y-2">
          {areaMods.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-md border border-[color:var(--border)] bg-asphalt p-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-paper">{m.name}</p>
                <p className="truncate text-xs text-steel">{m.brand ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-steel">
                  {formatCurrency(m.cost)}
                </span>
                <ModStatusBadge status={m.status} />
              </div>
            </div>
          ))}
          {selected && areaMods.length === 0 && (
            <p className="py-6 text-center text-sm text-steel">
              No mods logged here yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
