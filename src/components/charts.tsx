"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useAccent } from "@/lib/accent-store";

const STEEL = "#8A8D91";
const EXTRA_PALETTE = [
  "#5BAE6F",
  "#5B9BD5",
  "#B084CC",
  "#E8C547",
  "#E86A6A",
  "#8A8D91",
];

const axisStyle = { fontSize: 11, fill: STEEL, fontFamily: "monospace" };

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[color:var(--border)] bg-asphalt px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium text-paper">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-steel">
          {p.name}:{" "}
          <span className="text-paper">
            {currency ? formatCurrency(p.value ?? 0) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export function SpendingByCategoryChart({
  data,
}: {
  data: { category: string; value: number }[];
}) {
  const accent = useAccent((s) => s.color);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="#34343a" />
        <XAxis type="number" tick={axisStyle} tickFormatter={(v) => `$${v}`} />
        <YAxis
          type="category"
          dataKey="category"
          tick={axisStyle}
          width={80}
        />
        <Tooltip
          cursor={{ fill: "rgba(138,141,145,0.12)" }}
          content={<ChartTooltip currency />}
        />
        <Bar dataKey="value" fill={accent} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SpendingOverTimeChart({
  data,
}: {
  data: { month: string; cumulative: number }[];
}) {
  const accent = useAccent((s) => s.color);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: 8, right: 16, top: 8 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.5} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#34343a" vertical={false} />
        <XAxis dataKey="month" tick={axisStyle} />
        <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<ChartTooltip currency />} />
        <Area
          type="monotone"
          dataKey="cumulative"
          name="Cumulative"
          stroke={accent}
          strokeWidth={2}
          fill="url(#spendGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MonthlySpendingChart({
  data,
}: {
  data: { month: string; value: number }[];
}) {
  const accent = useAccent((s) => s.color);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: 8, right: 16, top: 8 }}>
        <CartesianGrid stroke="#34343a" vertical={false} />
        <XAxis dataKey="month" tick={axisStyle} />
        <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          cursor={{ fill: "rgba(138,141,145,0.12)" }}
          content={<ChartTooltip currency />}
        />
        <Bar dataKey="value" name="Spent" fill={accent} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function InstalledVsPlannedChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const accent = useAccent((s) => s.color);
  const palette = [accent, ...EXTRA_PALETTE];
  const filtered = data.filter((d) => d.value > 0);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Legend
          wrapperStyle={{ fontSize: 12, color: STEEL }}
          iconType="circle"
        />
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DynoLineChart({
  data,
}: {
  data: { date: string; hp: number | null; torque: number | null }[];
}) {
  const accent = useAccent((s) => s.color);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: 8, right: 16, top: 8 }}>
        <CartesianGrid stroke="#34343a" vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} />
        <YAxis tick={axisStyle} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="hp"
          name="HP"
          stroke={accent}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="torque"
          name="Torque"
          stroke="#5B9BD5"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
