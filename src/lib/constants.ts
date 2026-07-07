import type {
  ModCategory,
  ModStatus,
  ShoppingStatus,
  CarArea,
  ServiceType,
  DocumentType,
  BuildStatus,
} from "@prisma/client";

export const BUILD_STATUSES: {
  value: BuildStatus;
  label: string;
  description: string;
  className: string;
}[] = [
  {
    value: "OWNED",
    label: "Owned",
    description: "A car you have right now",
    className: "text-emerald-400 border-emerald-400/40",
  },
  {
    value: "FUTURE",
    label: "Future Build",
    description: "A car you plan to buy or build",
    className: "text-sky-400 border-sky-400/40",
  },
  {
    value: "WISHLIST",
    label: "Wishlist",
    description: "A dream car you're daydreaming about",
    className: "text-orange border-orange/40",
  },
];

export const BUILD_STATUS_META: Record<
  BuildStatus,
  { label: string; description: string; className: string }
> = Object.fromEntries(
  BUILD_STATUSES.map((s) => [
    s.value,
    { label: s.label, description: s.description, className: s.className },
  ])
) as Record<BuildStatus, { label: string; description: string; className: string }>;

export const MOD_CATEGORIES: { value: ModCategory; label: string }[] = [
  { value: "ENGINE", label: "Engine" },
  { value: "INTAKE", label: "Intake" },
  { value: "EXHAUST", label: "Exhaust" },
  { value: "TURBO", label: "Turbo" },
  { value: "SUPERCHARGER", label: "Supercharger" },
  { value: "FUELING", label: "Fueling" },
  { value: "ECU_TUNING", label: "ECU / Tuning" },
  { value: "DRIVELINE", label: "Driveline" },
  { value: "DIFFERENTIAL", label: "Differential" },
  { value: "CLUTCH", label: "Clutch" },
  { value: "TRANSMISSION", label: "Transmission" },
  { value: "SUSPENSION", label: "Suspension" },
  { value: "WHEELS", label: "Wheels" },
  { value: "TIRES", label: "Tires" },
  { value: "BRAKES", label: "Brakes" },
  { value: "SAFETY", label: "Safety" },
  { value: "TRACTION", label: "Traction" },
  { value: "EXTERIOR", label: "Exterior" },
  { value: "INTERIOR", label: "Interior" },
  { value: "AUDIO", label: "Audio" },
  { value: "LIGHTING", label: "Lighting" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "COOLING", label: "Cooling" },
  { value: "AERO", label: "Aero" },
  { value: "MISC", label: "Misc" },
];

export const MOD_CATEGORY_LABEL: Record<ModCategory, string> = Object.fromEntries(
  MOD_CATEGORIES.map((c) => [c.value, c.label])
) as Record<ModCategory, string>;

export const MOD_STATUSES: {
  value: ModStatus;
  label: string;
  className: string;
}[] = [
  { value: "WISHLIST", label: "Wishlist", className: "text-steel border-steel/40" },
  { value: "PLANNED", label: "Planned", className: "text-sky-400 border-sky-400/40" },
  { value: "ORDERED", label: "Ordered", className: "text-amber-400 border-amber-400/40" },
  { value: "INSTALLED", label: "Installed", className: "text-emerald-400 border-emerald-400/40" },
  { value: "REMOVED", label: "Removed", className: "text-red-400 border-red-400/40" },
];

export const MOD_STATUS_META: Record<
  ModStatus,
  { label: string; className: string }
> = Object.fromEntries(
  MOD_STATUSES.map((s) => [s.value, { label: s.label, className: s.className }])
) as Record<ModStatus, { label: string; className: string }>;

export const SHOPPING_STATUSES: { value: ShoppingStatus; label: string }[] = [
  { value: "RESEARCHING", label: "Researching" },
  { value: "READY_TO_BUY", label: "Ready to Buy" },
  { value: "ORDERED", label: "Ordered" },
  { value: "INSTALLED", label: "Installed" },
];

export const CAR_AREAS: { value: CarArea; label: string }[] = [
  { value: "FRONT", label: "Front" },
  { value: "SIDE", label: "Side" },
  { value: "REAR", label: "Rear" },
  { value: "ENGINE_BAY", label: "Engine Bay" },
  { value: "INTERIOR", label: "Interior" },
  { value: "UNDERBODY", label: "Underbody" },
];

export const CAR_AREA_LABEL: Record<CarArea, string> = Object.fromEntries(
  CAR_AREAS.map((a) => [a.value, a.label])
) as Record<CarArea, string>;

export const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "OIL_CHANGE", label: "Oil Change" },
  { value: "BRAKES", label: "Brakes" },
  { value: "TIRES", label: "Tires" },
  { value: "FLUIDS", label: "Fluids" },
  { value: "INSPECTION", label: "Inspection" },
  { value: "FILTER", label: "Filter" },
  { value: "BELT", label: "Belt" },
  { value: "SPARK_PLUGS", label: "Spark Plugs" },
  { value: "ALIGNMENT", label: "Alignment" },
  { value: "OTHER", label: "Other" },
];

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "DYNO_SHEET", label: "Dyno Sheet" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "INVOICE", label: "Invoice" },
  { value: "ALIGNMENT_SHEET", label: "Alignment Sheet" },
  { value: "MANUAL", label: "Manual" },
  { value: "OTHER", label: "Other" },
];

export const EXPENSE_CATEGORIES: { value: string; label: string }[] = [
  { value: "PURCHASE", label: "Purchase" },
  { value: "TAX", label: "Tax" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "FUEL", label: "Fuel" },
  { value: "STORAGE", label: "Storage" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "REPAIR", label: "Repair" },
  { value: "PARTS", label: "Parts" },
  { value: "TIRES", label: "Tires" },
  { value: "WHEELS", label: "Wheels" },
  { value: "LIGHTING", label: "Lighting" },
  { value: "DETAILING", label: "Detailing" },
  { value: "CAR_WASH", label: "Car Wash" },
  { value: "TINT", label: "Window Tint" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "TOOLS", label: "Tools" },
  { value: "TOLLS", label: "Tolls" },
  { value: "PARKING", label: "Parking" },
  { value: "TOWING", label: "Towing" },
  { value: "INSPECTION", label: "Inspection" },
  { value: "EMISSIONS", label: "Emissions" },
  { value: "TRACK_DAY", label: "Track Day" },
  { value: "DYNO", label: "Dyno" },
  { value: "SHIPPING", label: "Shipping" },
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "WARRANTY", label: "Warranty" },
  { value: "FINANCING", label: "Financing" },
  { value: "LOAN", label: "Loan Payment" },
  { value: "MISC", label: "Misc" },
];

export const EXPENSE_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label])
);

export const RECURRENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "ONCE", label: "One-time" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];
