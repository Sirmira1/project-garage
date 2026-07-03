import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, hint, accent, icon }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[color:var(--border)] bg-asphalt-2 p-4",
        accent && "border-orange/40 bg-orange/5"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-widest text-steel">
          {label}
        </p>
        {icon && <span className="text-steel">{icon}</span>}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-2xl",
          accent ? "text-orange" : "text-paper"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-steel">{hint}</p>}
    </div>
  );
}
