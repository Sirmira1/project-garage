"use client";

import type { VehicleDTO, ModDTO, FitmentDTO } from "@/types/detail";
import { computeBuildStats } from "@/lib/analytics";
import { formatCurrency, formatNumber, clamp } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FitmentManager } from "@/components/vehicles/fitment-manager";
import { Gauge, Scale, Wallet } from "lucide-react";

function SpecRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between border-b border-[color:var(--border)] py-2 last:border-0">
      <span className="font-mono text-xs uppercase tracking-wide text-steel">
        {label}
      </span>
      <span className="text-sm text-paper">{value ?? "—"}</span>
    </div>
  );
}

export function OverviewTab({
  vehicle,
  mods,
  fitments,
}: {
  vehicle: VehicleDTO;
  mods: ModDTO[];
  fitments: FitmentDTO[];
}) {
  const stats = computeBuildStats(mods);

  // HP tracker
  const stockHp = vehicle.stockHp ?? 0;
  const currentHp = vehicle.currentHp ?? stockHp;
  const targetHp = vehicle.targetHp ?? currentHp;
  const hpSpan = Math.max(targetHp - stockHp, 1);
  const hpProgress = clamp(((currentHp - stockHp) / hpSpan) * 100);
  const hpGain = currentHp - stockHp;

  // Weight tracker
  const factoryWeight = vehicle.factoryWeight ?? 0;
  const currentWeight = vehicle.currentWeight ?? factoryWeight;
  const weightSaved = factoryWeight - currentWeight;

  // Value calculator
  const purchase = vehicle.purchasePrice ?? 0;
  const spent = stats.totalSpent;
  // simple depreciation heuristic: 8% of purchase per year owned
  const estValue = Math.max(purchase + spent * 0.5, 0);
  const netInvested = purchase + spent;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Spec sheet */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Spec Sheet</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SpecRow label="Year" value={vehicle.year} />
          <SpecRow label="Make" value={vehicle.make} />
          <SpecRow label="Model" value={vehicle.model} />
          <SpecRow label="Trim" value={vehicle.trim} />
          <SpecRow label="Generation" value={vehicle.generation} />
          <SpecRow label="Engine" value={vehicle.engine} />
          <SpecRow label="Trans" value={vehicle.transmission} />
          <SpecRow label="Drivetrain" value={vehicle.drivetrain} />
          <SpecRow
            label="Mileage"
            value={
              vehicle.currentMileage != null
                ? `${formatNumber(vehicle.currentMileage)} mi`
                : null
            }
          />
          <SpecRow label="VIN" value={vehicle.vin} />
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        {/* Horsepower tracker */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gauge className="size-4 text-orange" /> Horsepower Progress
            </CardTitle>
            <span className="font-mono text-sm text-emerald-400">
              +{hpGain} hp
            </span>
          </CardHeader>
          <CardContent>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-asphalt-3">
              <div
                className="h-full bg-gradient-to-r from-orange-dim to-orange"
                style={{ width: `${hpProgress}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-xs">
              <span className="text-steel">Stock {stockHp || "—"}</span>
              <span className="text-orange">Current {currentHp || "—"}</span>
              <span className="text-steel">Target {targetHp || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Weight tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="size-4 text-orange" /> Weight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-steel">Factory</span>
                <span className="font-mono">
                  {factoryWeight ? `${formatNumber(factoryWeight)} lb` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-steel">Current</span>
                <span className="font-mono">
                  {currentWeight ? `${formatNumber(currentWeight)} lb` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-steel">Saved</span>
                <span className="font-mono text-emerald-400">
                  {weightSaved > 0 ? `-${formatNumber(weightSaved)} lb` : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Value calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-4 text-orange" /> Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-steel">Purchase</span>
                <span className="font-mono">{formatCurrency(purchase)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-steel">Mods spent</span>
                <span className="font-mono">{formatCurrency(spent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-steel">Invested</span>
                <span className="font-mono">{formatCurrency(netInvested)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-[color:var(--border)] pt-1 text-sm">
                <span className="text-steel">Est. value</span>
                <span className="font-mono text-orange">
                  {formatCurrency(estValue)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fitment */}
        <FitmentManager vehicleId={vehicle.id} initialFitments={fitments} />
      </div>
    </div>
  );
}
