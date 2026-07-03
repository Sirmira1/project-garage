import type { ModStatus, ModCategory } from "@prisma/client";
import { MOD_CATEGORY_LABEL, EXPENSE_CATEGORY_LABEL } from "@/lib/constants";

/** Minimal shape shared by Prisma `Modification` and the client `ModDTO`. */
export interface ModLike {
  name: string;
  status: ModStatus;
  category: ModCategory;
  cost: number | null;
  installDate: Date | string | null;
}

/** Minimal shape shared by Prisma `Expense` and the client `ExpenseDTO`. */
export interface ExpenseLike {
  name: string;
  category: string;
  amount: number;
  date: Date | string;
  recurrence: "ONCE" | "MONTHLY" | "YEARLY";
}

/** Money already spent on one-time expenses (recurring is tracked separately). */
function oneTimeExpenseTotal(expenses: ExpenseLike[]): number {
  return expenses
    .filter((e) => e.recurrence === "ONCE")
    .reduce((s, e) => s + (e.amount ?? 0), 0);
}

export interface BuildStats {
  totalSpent: number;
  plannedSpending: number;
  wishlistValue: number;
  avgModCost: number;
  installedCount: number;
  plannedCount: number;
  mostExpensive: ModLike | null;
}

const spentStatuses: ModStatus[] = ["INSTALLED", "ORDERED"];

export function computeBuildStats(
  mods: ModLike[],
  expenses: ExpenseLike[] = []
): BuildStats {
  const installed = mods.filter((m) => m.status === "INSTALLED");
  const spentMods = mods.filter((m) => spentStatuses.includes(m.status));

  const totalSpent =
    spentMods.reduce((s, m) => s + (m.cost ?? 0), 0) +
    oneTimeExpenseTotal(expenses);
  const plannedSpending = mods
    .filter((m) => m.status === "PLANNED")
    .reduce((s, m) => s + (m.cost ?? 0), 0);
  const wishlistValue = mods
    .filter((m) => m.status === "WISHLIST")
    .reduce((s, m) => s + (m.cost ?? 0), 0);

  const withCost = installed.filter((m) => m.cost != null);
  const avgModCost =
    withCost.length > 0
      ? withCost.reduce((s, m) => s + (m.cost ?? 0), 0) / withCost.length
      : 0;

  const mostExpensive =
    mods
      .filter((m) => m.cost != null)
      .sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0))[0] ?? null;

  return {
    totalSpent,
    plannedSpending,
    wishlistValue,
    avgModCost,
    installedCount: installed.length,
    plannedCount: mods.filter((m) => m.status === "PLANNED").length,
    mostExpensive,
  };
}

export function spendingByCategory(
  mods: ModLike[],
  expenses: ExpenseLike[] = []
): { category: string; value: number }[] {
  const map = new Map<string, number>();
  for (const m of mods) {
    if (m.status !== "INSTALLED" && m.status !== "ORDERED") continue;
    const label = MOD_CATEGORY_LABEL[m.category];
    map.set(label, (map.get(label) ?? 0) + (m.cost ?? 0));
  }
  for (const e of expenses) {
    if (e.recurrence !== "ONCE") continue;
    const label = EXPENSE_CATEGORY_LABEL[e.category] ?? e.category;
    map.set(label, (map.get(label) ?? 0) + (e.amount ?? 0));
  }
  return [...map.entries()]
    .map(([category, value]) => ({ category, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function spendingOverTime(
  mods: ModLike[],
  expenses: ExpenseLike[] = []
): { month: string; value: number; cumulative: number }[] {
  const byMonth = new Map<string, number>();
  const addMonth = (date: Date | string, amount: number) => {
    const d = new Date(date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + amount);
  };
  for (const m of mods) {
    if (!m.installDate || (m.status !== "INSTALLED" && m.status !== "ORDERED"))
      continue;
    addMonth(m.installDate, m.cost ?? 0);
  }
  for (const e of expenses) {
    if (e.recurrence !== "ONCE") continue;
    addMonth(e.date, e.amount ?? 0);
  }
  const sorted = [...byMonth.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  let cumulative = 0;
  return sorted.map(([month, value]) => {
    cumulative += value;
    return { month, value, cumulative };
  });
}

export function installedVsPlanned(
  mods: ModLike[]
): { name: string; value: number }[] {
  return [
    {
      name: "Installed",
      value: mods.filter((m) => m.status === "INSTALLED").length,
    },
    {
      name: "Ordered",
      value: mods.filter((m) => m.status === "ORDERED").length,
    },
    {
      name: "Planned",
      value: mods.filter((m) => m.status === "PLANNED").length,
    },
    {
      name: "Wishlist",
      value: mods.filter((m) => m.status === "WISHLIST").length,
    },
  ];
}
