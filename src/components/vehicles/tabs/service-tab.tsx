"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ServiceDTO } from "@/types/detail";
import { SERVICE_TYPES } from "@/lib/constants";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
// Removed unused toast import
import {
  Wrench,
  AlertTriangle,
  CalendarClock,
  Plus,
  CalendarPlus,
  Trash2,
  Loader2,
  Check,
  Pencil,
} from "lucide-react";

const TYPE_LABEL = Object.fromEntries(
  SERVICE_TYPES.map((t) => [t.value, t.label])
) as Record<string, string>;

const todayStr = () => new Date().toISOString().slice(0, 10);

function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function ServiceTab({
  vehicleId,
  initialServices,
  currentMileage,
}: {
  vehicleId: string;
  initialServices: ServiceDTO[];
  currentMileage: number | null;
}) {
  const qc = useQueryClient();
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [completing, setCompleting] = useState<ServiceDTO | null>(null);
  const [logType, setLogType] = useState("OIL_CHANGE");
  const [schedType, setSchedType] = useState("OIL_CHANGE");
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMileage, setEditMileage] = useState("");

  const { data: services = initialServices } = useQuery<ServiceDTO[]>({
    queryKey: ["service", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/service?vehicleId=${vehicleId}`);
      if (!res.ok) return initialServices;
      return res.json();
    },
    initialData: initialServices,
  });

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service", vehicleId] });
      setLogOpen(false);
      setScheduleOpen(false);
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  const patch = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/service/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service", vehicleId] });
      setEditId(null);
      setCompleting(null);
      router.refresh();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/service/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service", vehicleId] }),
  });

  function submitLog(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string)?.trim() || undefined;
    create.mutate({
      vehicleId,
      status: "DONE",
      name: get("name"),
      type: logType,
      date: get("date"),
      mileage: get("mileage"),
      cost: get("cost"),
      notes: get("notes"),
    });
  }

  function submitSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string)?.trim() || undefined;
    create.mutate({
      vehicleId,
      status: "PLANNED",
      name: get("name"),
      type: schedType,
      nextDueDate: get("nextDueDate"),
      nextDueMileage: get("nextDueMileage"),
      notes: get("notes"),
    });
  }

  function submitComplete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!completing) return;
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string)?.trim() || undefined;
    patch.mutate({
      id: completing.id,
      data: {
        status: "DONE",
        date: get("date"),
        mileage: get("mileage"),
        cost: get("cost"),
      },
    });
  }

  const now = new Date();
  const soonCutoff = addDays(now, 60);
  const planned = services.filter((s) => s.status === "PLANNED");
  const done = services.filter((s) => s.status === "DONE");

  function isDueSoon(s: ServiceDTO) {
    const byDate = s.nextDueDate && new Date(s.nextDueDate) <= soonCutoff;
    const byMiles =
      s.nextDueMileage != null &&
      currentMileage != null &&
      s.nextDueMileage - currentMileage <= 1500;
    return byDate || byMiles;
  }
  function isOverdue(s: ServiceDTO) {
    const byDate = s.nextDueDate && new Date(s.nextDueDate) < now;
    const byMiles =
      s.nextDueMileage != null &&
      currentMileage != null &&
      currentMileage >= s.nextDueMileage;
    return byDate || byMiles;
  }

  const dueSoon = planned.filter(isDueSoon);
  const later = planned.filter((s) => !isDueSoon(s));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={() => setScheduleOpen(true)}>
          <CalendarPlus /> Schedule Service
        </Button>
        <Button onClick={() => setLogOpen(true)}>
          <Plus /> Log Completed
        </Button>
      </div>

      {dueSoon.length > 0 && (
        <Section title="Due Soon" icon={<AlertTriangle className="size-4" />} tone="amber">
          {dueSoon.map((s) => (
            <PlannedRow
              key={s.id}
              service={s}
              overdue={isOverdue(s)}
              onDone={() => setCompleting(s)}
              onDelete={() => remove.mutate(s.id)}
            />
          ))}
        </Section>
      )}

      {later.length > 0 && (
        <Section title="Not Anytime Soon" icon={<CalendarClock className="size-4" />} tone="steel">
          {later.map((s) => (
            <PlannedRow
              key={s.id}
              service={s}
              overdue={false}
              onDone={() => setCompleting(s)}
              onDelete={() => remove.mutate(s.id)}
            />
          ))}
        </Section>
      )}

      <div>
        <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-steel">
          Service History
        </h3>
        {done.length === 0 ? (
          <EmptyState
            icon={<Wrench className="size-10" />}
            title="No completed services yet"
            description="Log an oil change, or schedule a future service and mark it done when complete."
          >
            <Button className="mt-2" onClick={() => setLogOpen(true)}>
              <Plus /> Log Completed
            </Button>
          </EmptyState>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[color:var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-asphalt-2 text-left font-mono text-xs uppercase tracking-wide text-steel">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Odometer</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {done.map((s) => (
                  <tr key={s.id} className="border-t border-[color:var(--border)] hover:bg-asphalt-2">
                    <td className="px-4 py-3 text-paper">{s.name}</td>
                    <td className="px-4 py-3 text-steel">{TYPE_LABEL[s.type]}</td>
                    <td className="px-4 py-3 text-steel">{formatDate(s.date)}</td>
                    <td className="px-4 py-3">
                      {editId === s.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={editMileage}
                            onChange={(e) => setEditMileage(e.target.value)}
                            className="h-7 w-24"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              patch.mutate({
                                id: s.id,
                                data: { mileage: Number(editMileage) },
                              })
                            }
                            className="text-emerald-400"
                          >
                            <Check className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditId(s.id);
                            setEditMileage(s.mileage != null ? String(s.mileage) : "");
                          }}
                          className="group flex items-center gap-1.5 font-mono text-steel hover:text-paper"
                        >
                          {s.mileage != null ? formatNumber(s.mileage) : "—"}
                          <Pencil className="size-3 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-paper">
                      {formatCurrency(s.cost)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove.mutate(s.id)} className="text-steel hover:text-red-400">
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log completed dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Completed Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitLog} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="lname">Service *</Label>
                <Input id="lname" name="name" required placeholder="Full synthetic oil change" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={logType} onValueChange={setLogType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ldate">Date</Label>
                <Input id="ldate" name="date" type="date" defaultValue={todayStr()} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lmileage">Odometer</Label>
                <Input id="lmileage" name="mileage" type="number" defaultValue={currentMileage ?? undefined} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lcost">Cost</Label>
                <Input id="lcost" name="cost" type="number" placeholder="95" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="lnotes">Notes</Label>
                <Textarea id="lnotes" name="notes" rows={2} />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setLogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="size-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule future service dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Service</DialogTitle>
            <DialogDescription>
              Plan a future service. Set a target date and/or mileage — both are
              optional. You&apos;ll mark it done (with the exact odometer) later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitSchedule} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="sname">Service *</Label>
                <Input id="sname" name="name" required placeholder="Brake fluid flush" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={schedType} onValueChange={setSchedType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sdue">Target date</Label>
                <Input id="sdue" name="nextDueDate" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sduemiles">Target odometer</Label>
                <Input id="sduemiles" name="nextDueMileage" type="number" placeholder="62000" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="snotes">Notes</Label>
                <Textarea id="snotes" name="notes" rows={2} />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setScheduleOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="size-4 animate-spin" />} Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mark done dialog */}
      <Dialog open={!!completing} onOpenChange={(o) => !o && setCompleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark “{completing?.name}” done</DialogTitle>
            <DialogDescription>
              Enter the exact odometer at completion — it also updates your
              vehicle&apos;s current odometer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitComplete} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cdate">Date completed</Label>
                <Input id="cdate" name="date" type="date" defaultValue={todayStr()} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cmileage">Exact odometer</Label>
                <Input
                  id="cmileage"
                  name="mileage"
                  type="number"
                  defaultValue={currentMileage ?? undefined}
                  autoFocus
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="ccost">Cost</Label>
                <Input id="ccost" name="cost" type="number" placeholder="120" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCompleting(null)}>Cancel</Button>
              <Button type="submit" disabled={patch.isPending}>
                {patch.isPending && <Loader2 className="size-4 animate-spin" />}
                <Check /> Mark Done
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "amber" | "steel";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        tone === "amber"
          ? "rounded-xl border border-amber-500/40 bg-amber-500/5 p-4"
          : "rounded-xl border border-[color:var(--border)] bg-asphalt-2 p-4"
      }
    >
      <h3
        className={
          tone === "amber"
            ? "mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-amber-400"
            : "mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-steel"
        }
      >
        {icon} {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PlannedRow({
  service,
  overdue,
  onDone,
  onDelete,
}: {
  service: ServiceDTO;
  overdue: boolean;
  onDone: () => void;
  onDelete: () => void;
}) {
  const targets: string[] = [];
  if (service.nextDueDate) targets.push(formatDate(service.nextDueDate));
  if (service.nextDueMileage != null)
    targets.push(`${formatNumber(service.nextDueMileage)} on odo`);
  const target = targets.length ? targets.join(" · ") : "no target set";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-asphalt p-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm text-paper">{service.name}</p>
        <p className={overdue ? "text-xs text-red-400" : "text-xs text-steel"}>
          {overdue ? "overdue · " : "target: "}
          {target}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="secondary" onClick={onDone}>
          <Check /> Mark done
        </Button>
        <button onClick={onDelete} className="px-1 text-steel hover:text-red-400">
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
