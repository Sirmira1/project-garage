import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  computeBuildStats,
  spendingByCategory,
  spendingOverTime,
  installedVsPlanned,
} from "@/lib/analytics";
import {
  SpendingByCategoryChart,
  SpendingOverTimeChart,
  MonthlySpendingChart,
  InstalledVsPlannedChart,
} from "@/components/charts";
import { formatCurrency } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const userId = await getCurrentUserId();
  const mods = userId
    ? await prisma.modification.findMany({
        where: { vehicle: { userId } },
      })
    : [];
  const expenses = userId
    ? await prisma.expense.findMany({
        where: { vehicle: { userId } },
      })
    : [];

  const stats = computeBuildStats(mods, expenses);
  const byCategory = spendingByCategory(mods, expenses);
  const overTime = spendingOverTime(mods, expenses);
  const monthly = overTime.map((d) => ({ month: d.month, value: d.value }));
  const distribution = installedVsPlanned(mods);

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">
      <PageHeader
        title="Build Analytics"
        subtitle="Spending and progress across your entire garage."
      />

      {mods.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="size-10" />}
          title="No data yet"
          description="Add vehicles and modifications to unlock analytics."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Total Spent" value={formatCurrency(stats.totalSpent)} accent />
            <StatCard label="Planned" value={formatCurrency(stats.plannedSpending)} />
            <StatCard label="Wishlist" value={formatCurrency(stats.wishlistValue)} />
            <StatCard label="Avg Mod" value={formatCurrency(stats.avgModCost)} />
            <StatCard
              label="Priciest Mod"
              value={formatCurrency(stats.mostExpensive?.cost ?? 0)}
              hint={stats.mostExpensive?.name}
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
                  <Empty />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Build Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <InstalledVsPlannedChart data={distribution} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Spend</CardTitle>
              </CardHeader>
              <CardContent>
                {overTime.length ? <SpendingOverTimeChart data={overTime} /> : <Empty />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spend</CardTitle>
              </CardHeader>
              <CardContent>
                {monthly.length ? <MonthlySpendingChart data={monthly} /> : <Empty />}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty() {
  return (
    <p className="py-12 text-center text-sm text-steel">
      Not enough data yet.
    </p>
  );
}
