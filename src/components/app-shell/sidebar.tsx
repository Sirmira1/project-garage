"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Gauge } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[color:var(--border)] bg-asphalt-2 lg:flex">
      <div className="hazard-stripe" />
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-orange text-asphalt">
          <Gauge className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm">GARAGE</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel">
            Build Sheet
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {mainNav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-orange/15 text-orange"
                  : "text-steel hover:bg-asphalt-3 hover:text-paper"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel-dim">
          v0.1 · MVP
        </p>
      </div>
    </aside>
  );
}
