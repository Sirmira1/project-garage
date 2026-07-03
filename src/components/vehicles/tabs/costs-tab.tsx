"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExpenseDTO } from "@/types/detail";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  RECURRENCE_OPTIONS,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { DollarSign, Plus, Trash2, Loader2, Repeat, Pencil } from "lucide-react";

const todayStr = () => new Date().toISOString().slice(0, 10);

function monthlyEquivalent(e: ExpenseDTO): number {
  if (e.recurrence === "MONTHLY") return e.amount;
  if (e.recurrence === "YEARLY") return e.amount / 12;
  return 0;
}

export function CostsTab({
  vehicleId,
  purchasePrice,
  purchaseDate,
  modsSpent,
  initialExpenses,
}: {
  vehicleId: string;
  purchasePrice: number | null;
  purchaseDate: string | null;
  modsSpent: number;
  initialExpenses: ExpenseDTO[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseDTO | null>(null);
  const [category, setCategory] = useState("TAX");
  const [recurrence, setRecurrence] = useState("ONCE");
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setCategory("TAX");
    setRecurrence("ONCE");
    setError(null);
    setOpen(true);
  }

  function openEdit(e: ExpenseDTO) {
    setEditing(e);
    setCategory(e.category);
    setRecurrence(e.recurrence);
    setError(null);
    setOpen(true);
  }

  const { data: expenses = initialExpenses } = useQuery<ExpenseDTO[]>({
    queryKey: ["expenses", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/expenses?vehicleId=${vehicleId}`);
      if (!res.ok) return initialExpenses;
      return res.json();
    },
    initialData: initialExpenses,
  });

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to add expense");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", vehicleId] });
      toast("Expense added", { variant: "success" });
      setOpen(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to update expense");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", vehicleId] });
      toast("Expense updated", { variant: "success" });
      setOpen(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", vehicleId] }),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string)?.trim() || undefined;
    const payload = {
      vehicleId,
      name: get("name"),
      amount: get("amount"),
      date: get("date"),
      category,
      recurrence,
      notes: get("notes"),
    };
    if (editing) {
      update.mutate({ id: editing.id, payload });
    } else {
      create.mutate(payload);
    }
  }

  const oneTime = expenses.filter((e) => e.recurrence === "ONCE");
  const recurring = expenses.filter((e) => e.recurrence !== "ONCE");

  const oneTimeExpensesTotal = oneTime.reduce((s, e) => s + e.amount, 0);
  const recurringMonthly = recurring.reduce((s, e) => s + monthlyEquivalent(e), 0);

  const purchase = purchasePrice ?? 0;
  const invested = purchase + modsSpent + oneTimeExpensesTotal;

  const monthsOwned = purchaseDate
    ? Math.max(
        1,
        Math.round(
          (Date.now() - new Date(purchaseDate).getTime()) /
            (1000 * 60 * 60 * 24 * 30.4)
        )
      )
    : 0;
  const recurringToDate = recurringMonthly * monthsOwned;
  const trueCostSoFar = invested + recurringToDate;

  // Category breakdown (one-time only)
  const breakdown = new Map<string, number>();
  if (purchase > 0) breakdown.set("Purchase", purchase);
  if (modsSpent > 0) breakdown.set("Parts / Mods", modsSpent);
  for (const e of oneTime) {
    const label = EXPENSE_CATEGORY_LABEL[e.category] ?? e.category;
    breakdown.set(label, (breakdown.get(label) ?? 0) + e.amount);
  }
  const breakdownList = [...breakdown.entries()].sort((a, b) => b[1] - a[1]);
  const breakdownMax = Math.max(...breakdownList.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-steel">
          The full picture — purchase, taxes, parts, and recurring costs.
        </p>
        <Button onClick={openAdd}>
          <Plus /> Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Invested (one-time)"
          value={formatCurrency(invested)}
          hint="Purchase + parts + fees"
          accent
        />
        <StatCard
          label="Recurring / mo"
          value={formatCurrency(recurringMonthly)}
          hint={`${formatCurrency(recurringMonthly * 12)} / yr`}
          icon={<Repeat className="size-4" />}
        />
        <StatCard
          label="True cost so far"
          value={formatCurrency(trueCostSoFar)}
          hint={monthsOwned ? `Owned ~${monthsOwned} mo` : "Set a purchase date"}
        />
        <StatCard label="Parts / Mods" value={formatCurrency(modsSpent)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Where the money went</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {breakdownList.length === 0 ? (
              <p className="py-6 text-center text-sm text-steel">
                Add a purchase price, mods, or expenses.
              </p>
            ) : (
              breakdownList.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-steel">{label}</span>
                    <span className="font-mono text-paper">
                      {formatCurrency(value)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-asphalt-3">
                    <div
                      className="h-full rounded-full bg-orange"
                      style={{ width: `${(value / breakdownMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Monthly / recurring costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-orange" /> Monthly Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recurring.length === 0 ? (
              <p className="py-6 text-center text-sm text-steel">
                Add recurring costs like insurance or storage.
              </p>
            ) : (
              <div className="space-y-2">
                {recurring.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="text-paper">{e.name}</span>
                      <span className="ml-2 text-xs text-steel">
                        {e.recurrence === "YEARLY" ? "yearly" : "monthly"}
                      </span>
                    </div>
                    <span className="font-mono text-paper">
                      {formatCurrency(monthlyEquivalent(e))}/mo
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-[color:var(--border)] pt-2 text-sm">
                  <span className="text-steel">Total / month</span>
                  <span className="font-mono text-orange">
                    {formatCurrency(recurringMonthly)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All expenses */}
      {expenses.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[color:var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-asphalt-2 text-left font-mono text-xs uppercase tracking-wide text-steel">
              <tr>
                <th className="px-4 py-3">Expense</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-[color:var(--border)] hover:bg-asphalt-2"
                >
                  <td className="px-4 py-3 text-paper">{e.name}</td>
                  <td className="px-4 py-3 text-steel">
                    {EXPENSE_CATEGORY_LABEL[e.category] ?? e.category}
                  </td>
                  <td className="px-4 py-3 text-steel">
                    {e.recurrence === "ONCE"
                      ? "One-time"
                      : e.recurrence === "MONTHLY"
                        ? "Monthly"
                        : "Yearly"}
                  </td>
                  <td className="px-4 py-3 text-steel">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 text-right font-mono text-paper">
                    {formatCurrency(e.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(e)}
                        className="text-steel hover:text-paper"
                        aria-label="Edit expense"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => remove.mutate(e.id)}
                        className="text-steel hover:text-red-400"
                        aria-label="Delete expense"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expenses.length === 0 && (
        <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-asphalt-2/50 px-6 py-10 text-center">
          <DollarSign className="mx-auto size-8 text-steel-dim" />
          <p className="mt-2 font-display">Track every dollar</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-steel">
            Add sales tax, registration, insurance, fuel, storage and more to see
            your true cost of ownership.
          </p>
          <Button className="mt-3" onClick={openAdd}>
            <Plus /> Add Expense
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <form key={editing?.id ?? "new"} onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editing?.name ?? ""}
                  placeholder="Sales tax (on $1,500 appraisal)"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Recurrence</Label>
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editing?.amount ?? ""}
                  placeholder="120"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={editing ? editing.date.slice(0, 10) : todayStr()}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  defaultValue={editing?.notes ?? ""}
                  placeholder="Paid tax on the $1,500 appraised value"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {(create.isPending || update.isPending) && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {editing ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
