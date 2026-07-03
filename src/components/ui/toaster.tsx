"use client";

import { useToastStore } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon =
          t.variant === "success"
            ? CheckCircle2
            : t.variant === "error"
              ? XCircle
              : Info;
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border border-[color:var(--border)] bg-asphalt-2 p-4 shadow-lg animate-fade-in",
              t.variant === "success" && "border-emerald-500/40",
              t.variant === "error" && "border-red-500/40"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-5 shrink-0",
                t.variant === "success" && "text-emerald-400",
                t.variant === "error" && "text-red-400",
                t.variant === "default" && "text-orange"
              )}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-paper">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs text-steel">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-steel hover:text-paper"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
