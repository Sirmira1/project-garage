import Link from "next/link";
import type { VehicleWithCount } from "@/types/vehicle";
import { formatNumber } from "@/lib/utils";
import { Gauge, Wrench, Car } from "lucide-react";

export function VehicleCard({ vehicle }: { vehicle: VehicleWithCount }) {
  const subtitle =
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
    "Project car";

  return (
    <Link
      href={`/garage/${vehicle.id}`}
      className="group overflow-hidden rounded-xl border border-[color:var(--border)] bg-asphalt-2 transition-colors hover:border-orange/50"
    >
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-asphalt-3">
        {vehicle.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.coverImage}
            alt={vehicle.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Car className="size-12 text-steel-dim" />
        )}
        <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-orange to-transparent" />
      </div>
      <div className="p-4">
        <p className="font-display text-lg leading-tight group-hover:text-orange">
          {vehicle.nickname || vehicle.name}
        </p>
        <p className="mt-0.5 text-xs text-steel">{subtitle}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-steel">
          <span className="flex items-center gap-1">
            <Wrench className="size-3.5" /> {vehicle._count.modifications} mods
          </span>
          {vehicle.currentHp != null && (
            <span className="flex items-center gap-1">
              <Gauge className="size-3.5" /> {vehicle.currentHp} hp
            </span>
          )}
          {vehicle.currentMileage != null && (
            <span>{formatNumber(vehicle.currentMileage)} mi</span>
          )}
        </div>
      </div>
    </Link>
  );
}
