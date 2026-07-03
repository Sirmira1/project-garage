import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  computeBuildStats,
  spendingByCategory,
  spendingOverTime,
} from "@/lib/analytics";
import {
  SpendingByCategoryChart,
  SpendingOverTimeChart,
} from "@/components/charts";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Wrench, Warehouse, Gauge, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  const vehicles = userId
    ? await prisma.vehicle.findMany({
        where: { userId },
        include: { modifications: true, _count: { select: { modifications: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const allMods = vehicles.flatMap((v) => v.modifications);
  const expenses = userId
    ? await prisma.expense.findMany({ where: { vehicle: { userId } } })
    : [];
  const stats = computeBuildStats(allMods, expenses);
  const byCategory = spendingByCategory(allMods, expenses);
  const overTime = spendingOverTime(allMods, expenses);

  const totalHp = vehicles.reduce((s, v) => s + (v.currentHp ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">
      <PageHeader
        title="Command Center"
        subtitle="Your entire garage at a glance."
      >
        <Button asChild>
          <Link href="/garage?new=1">
            <Plus /> Add Vehicle
          </Link>
        </Button>
      </PageHeader>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="size-10" />}
          title="Your garage is empty"
          description="Add your first project car to start tracking mods, costs, and dyno pulls."
        >
          <Button asChild className="mt-2">
            <Link href="/garage?new=1">
              <Plus /> Add your first vehicle
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total Spent"
              value={formatCurrency(stats.totalSpent)}
              hint={`${stats.installedCount} parts installed`}
              accent
              icon={<DollarSign className="size-4" />}
            />
            <StatCard
              label="Planned"
              value={formatCurrency(stats.plannedSpending)}
              hint={`${stats.plannedCount} parts planned`}
              icon={<Wrench className="size-4" />}
            />
            <StatCard
              label="Wishlist Value"
              value={formatCurrency(stats.wishlistValue)}
              icon={<DollarSign className="size-4" />}
            />
            <StatCard
              label="Combined Power"
              value={totalHp > 0 ? `${totalHp} hp` : "—"}
              hint={`${vehicles.length} vehicles`}
              icon={<Gauge className="size-4" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {byCategory.length ? (
                  <SpendingByCategoryChart data={byCategory} />
                ) : (
                  <p className="py-12 text-center text-sm text-steel">
                    No spending recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Spending Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {overTime.length ? (
                  <SpendingOverTimeChart data={overTime} />
                ) : (
                  <p className="py-12 text-center text-sm text-steel">
                    Add install dates to see this chart.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Your Garage</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/garage">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <Link
                  key={v.id}
                  href={`/garage/${v.id}`}
                  className="group rounded-lg border border-[color:var(--border)] bg-asphalt p-4 transition-colors hover:border-orange/50"
                >
                  <p className="font-display text-base group-hover:text-orange">
                    {v.nickname || v.name}
                  </p>
                  <p className="mt-0.5 text-xs text-steel">
                    {[v.year, v.make, v.model].filter(Boolean).join(" ") ||
                      "Project car"}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-steel">
                    <span>{v._count.modifications} mods</span>
                    {v.currentHp && <span>{v.currentHp} hp</span>}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
