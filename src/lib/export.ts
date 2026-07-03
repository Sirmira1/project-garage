import type { ModDTO } from "@/types/detail";
import { MOD_CATEGORY_LABEL } from "@/lib/constants";

function escapeCsv(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportModsCsv(vehicleName: string, mods: ModDTO[]) {
  const headers = [
    "Name",
    "Category",
    "Brand",
    "Status",
    "Cost",
    "Install Date",
    "Part Number",
    "Notes",
  ];
  const rows = mods.map((m) => [
    m.name,
    MOD_CATEGORY_LABEL[m.category],
    m.brand ?? "",
    m.status,
    m.cost ?? "",
    // Force spreadsheets to treat the date as text so it isn't auto-parsed
    // into a date column that renders as "#####" when narrow.
    m.installDate ? `="${m.installDate.slice(0, 10)}"` : "",
    m.partNumber ?? "",
    m.notes ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${vehicleName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-build-sheet.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
