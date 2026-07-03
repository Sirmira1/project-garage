import { Badge } from "@/components/ui/badge";
import { MOD_STATUS_META } from "@/lib/constants";
import type { ModStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export function ModStatusBadge({ status }: { status: ModStatus }) {
  const meta = MOD_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

export { Badge };
