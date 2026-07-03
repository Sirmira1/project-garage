import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { computeBuildStats } from "@/lib/analytics";
import { MOD_CATEGORY_LABEL, MOD_STATUS_META } from "@/lib/constants";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { PrintButton } from "@/components/print-button";
import { ArrowLeft } from "lucide-react";
import type { ModCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) notFound();

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId },
    include: {
      modifications: { orderBy: { category: "asc" } },
      serviceRecords: { orderBy: { date: "desc" } },
      goals: { orderBy: { createdAt: "desc" } },
      expenses: true,
    },
  });
  if (!vehicle) notFound();

  const stats = computeBuildStats(vehicle.modifications, vehicle.expenses);
  const title = vehicle.nickname || vehicle.name;
  const subtitle =
    [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
      .filter(Boolean)
      .join(" ") || "Project car";

  const grouped = new Map<ModCategory, typeof vehicle.modifications>();
  for (const m of vehicle.modifications) {
    if (!grouped.has(m.category)) grouped.set(m.category, []);
    grouped.get(m.category)!.push(m);
  }

  const specs: [string, string | number | null][] = [
    ["Year", vehicle.year],
    ["Make", vehicle.make],
    ["Model", vehicle.model],
    ["Trim", vehicle.trim],
    ["Generation", vehicle.generation],
    ["Engine", vehicle.engine],
    ["Transmission", vehicle.transmission],
    ["Drivetrain", vehicle.drivetrain],
    ["Current HP", vehicle.currentHp],
    ["Mileage", vehicle.currentMileage ? `${formatNumber(vehicle.currentMileage)} mi` : null],
    ["VIN", vehicle.vin],
  ];

  return (
    <div className="min-h-screen bg-zinc-100 py-8 text-zinc-900 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        {/* Toolbar (hidden on print) */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href={`/garage/${vehicle.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft className="size-4" /> Back to build
          </Link>
          <PrintButton />
        </div>

        {/* Header */}
        <div className="border-b-2 border-zinc-900 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6A13]">
                Garage Build Sheet
              </p>
              <h1 className="text-3xl font-black tracking-tight">{title}</h1>
              <p className="text-zinc-500">{subtitle}</p>
            </div>
            <div className="text-right text-xs text-zinc-500">
              <p>Build Report</p>
              <p>{formatDate(new Date())}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {[
            ["Total Spent", formatCurrency(stats.totalSpent)],
            ["Installed", String(stats.installedCount)],
            ["Planned", formatCurrency(stats.plannedSpending)],
            ["Wishlist", formatCurrency(stats.wishlistValue)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-zinc-200 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                {label}
              </p>
              <p className="mt-1 text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Specs */}
        <Section title="Specifications">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            {specs
              .filter(([, v]) => v != null && v !== "")
              .map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b border-zinc-100 py-1 text-sm"
                >
                  <span className="text-zinc-500">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
          </div>
        </Section>

        {/* Modifications */}
        <Section title={`Modifications (${vehicle.modifications.length})`}>
          {vehicle.modifications.length === 0 ? (
            <p className="text-sm text-zinc-500">No modifications logged.</p>
          ) : (
            <div className="space-y-4">
              {[...grouped.entries()].map(([category, mods]) => (
                <div key={category}>
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#FF6A13]">
                    {MOD_CATEGORY_LABEL[category]}
                  </p>
                  <table className="w-full text-sm">
                    <tbody>
                      {mods.map((m) => (
                        <tr key={m.id} className="border-b border-zinc-100">
                          <td className="py-1.5 pr-2 font-medium">{m.name}</td>
                          <td className="py-1.5 pr-2 text-zinc-500">
                            {m.brand ?? ""}
                          </td>
                          <td className="py-1.5 pr-2 text-zinc-500">
                            {MOD_STATUS_META[m.status].label}
                          </td>
                          <td className="py-1.5 text-right font-mono">
                            {formatCurrency(m.cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Service */}
        {vehicle.serviceRecords.length > 0 && (
          <Section title="Service History">
            <table className="w-full text-sm">
              <tbody>
                {vehicle.serviceRecords.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-100">
                    <td className="py-1.5 pr-2 font-medium">{s.name}</td>
                    <td className="py-1.5 pr-2 text-zinc-500">
                      {formatDate(s.date)}
                    </td>
                    <td className="py-1.5 pr-2 text-zinc-500">
                      {s.mileage != null ? `${formatNumber(s.mileage)} mi` : ""}
                    </td>
                    <td className="py-1.5 text-right font-mono">
                      {formatCurrency(s.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Goals */}
        {vehicle.goals.length > 0 && (
          <Section title="Build Goals">
            <div className="space-y-2">
              {vehicle.goals.map((g) => (
                <div key={g.id} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{g.title}</span>
                    <span className="text-zinc-500">{g.progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded bg-zinc-200">
                    <div
                      className="h-full rounded bg-[#FF6A13]"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <p className="mt-10 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-400">
          Generated by Garage Build Sheet
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-black uppercase tracking-widest">
        {title}
      </h2>
      {children}
    </div>
  );
}
