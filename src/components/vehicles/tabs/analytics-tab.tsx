"use client";

import type { ModDTO, ExpenseDTO } from "@/types/detail";
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
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function AnalyticsTab({
  mods,
  expenses = [],
}: {
  mods: ModDTO[];
  expenses?: ExpenseDTO[];
}) {
  const stats = computeBuildStats(mods, expenses);
  const byCategory = spendingByCategory(mods, expenses);
  const overTime = spendingOverTime(mods, expenses);
  const monthly = overTime.map((d) => ({ month: d.month, value: d.value }));
  const distribution = installedVsPlanned(mods);

  return (
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
            {overTime.length ? (
              <SpendingOverTimeChart data={overTime} />
            ) : (
              <Empty />
            )}
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
  );
}

function Empty() {
  return (
    <p className="py-12 text-center text-sm text-steel">
      Not enough data yet. Add mods with costs and install dates.
    </p>
  );
}
