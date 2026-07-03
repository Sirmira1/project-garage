import { z } from "zod";

// `null` is passed through (explicitly clears a field on update); "" / undefined
// are treated as "leave unchanged".
const optionalString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null) return null;
    const t = typeof v === "string" ? v.trim() : v;
    return t === "" || t === undefined ? undefined : t;
  });

const optionalNumber = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null) return null;
    if (v === undefined || v === "") return undefined;
    const n = typeof v === "string" ? Number(v) : v;
    return Number.isNaN(n) ? undefined : n;
  });

const optionalDate = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null) return null;
    if (!v) return undefined;
    const d = typeof v === "string" ? new Date(v) : v;
    return Number.isNaN(d.getTime()) ? undefined : d;
  });

export const vehicleSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  nickname: optionalString,
  year: optionalNumber,
  make: optionalString,
  model: optionalString,
  trim: optionalString,
  generation: optionalString,
  vin: optionalString,
  engine: optionalString,
  transmission: optionalString,
  drivetrain: optionalString,
  stockHp: optionalNumber,
  currentHp: optionalNumber,
  targetHp: optionalNumber,
  stockTorque: optionalNumber,
  currentTorque: optionalNumber,
  factoryWeight: optionalNumber,
  currentWeight: optionalNumber,
  purchasePrice: optionalNumber,
  purchaseDate: optionalDate,
  currentMileage: optionalNumber,
  coverImage: optionalString,
  color: optionalString,
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

const modCategory = z.enum([
  "ENGINE",
  "INTAKE",
  "EXHAUST",
  "TURBO",
  "SUSPENSION",
  "WHEELS",
  "TIRES",
  "BRAKES",
  "EXTERIOR",
  "INTERIOR",
  "AUDIO",
  "LIGHTING",
  "ELECTRONICS",
  "COOLING",
  "AERO",
  "MISC",
]);

const modStatus = z.enum([
  "WISHLIST",
  "PLANNED",
  "ORDERED",
  "INSTALLED",
  "REMOVED",
]);

const carArea = z.enum([
  "FRONT",
  "SIDE",
  "REAR",
  "ENGINE_BAY",
  "INTERIOR",
  "UNDERBODY",
]);

export const modificationSchema = z.object({
  vehicleId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required"),
  category: modCategory.default("MISC"),
  area: carArea.default("ENGINE_BAY"),
  brand: optionalString,
  description: optionalString,
  cost: optionalNumber,
  installDate: optionalDate,
  status: modStatus.default("WISHLIST"),
  notes: optionalString,
  partNumber: optionalString,
});

export const modificationUpdateSchema = modificationSchema.partial().extend({
  vehicleId: z.string().optional(),
});

export type ModificationInput = z.infer<typeof modificationSchema>;

export const accountSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    email: z.string().trim().email("Enter a valid email"),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters")
      .optional()
      .or(z.literal("")),
  })
  .transform((v) => ({
    ...v,
    newPassword: v.newPassword === "" ? undefined : v.newPassword,
  }));

export type AccountInput = z.infer<typeof accountSchema>;

// ---------------------------------------------------------------------------
// Service records
// ---------------------------------------------------------------------------

const serviceType = z.enum([
  "OIL_CHANGE",
  "BRAKES",
  "TIRES",
  "FLUIDS",
  "INSPECTION",
  "FILTER",
  "BELT",
  "SPARK_PLUGS",
  "ALIGNMENT",
  "OTHER",
]);

export const serviceSchema = z.object({
  vehicleId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required"),
  type: serviceType.default("OTHER"),
  status: z.enum(["PLANNED", "DONE"]).default("DONE"),
  date: optionalDate,
  mileage: optionalNumber,
  cost: optionalNumber,
  notes: optionalString,
  nextDueDate: optionalDate,
  nextDueMileage: optionalNumber,
});

export const serviceUpdateSchema = serviceSchema.partial().extend({
  vehicleId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

const expenseCategory = z.enum([
  "PURCHASE",
  "TAX",
  "REGISTRATION",
  "INSURANCE",
  "FUEL",
  "STORAGE",
  "MAINTENANCE",
  "REPAIR",
  "PARTS",
  "TIRES",
  "WHEELS",
  "LIGHTING",
  "DETAILING",
  "CAR_WASH",
  "TINT",
  "ACCESSORIES",
  "TOOLS",
  "TOLLS",
  "PARKING",
  "TOWING",
  "INSPECTION",
  "EMISSIONS",
  "TRACK_DAY",
  "DYNO",
  "SHIPPING",
  "MEMBERSHIP",
  "WARRANTY",
  "FINANCING",
  "LOAN",
  "MISC",
]);
const recurrence = z.enum(["ONCE", "MONTHLY", "YEARLY"]);

export const expenseSchema = z.object({
  vehicleId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required"),
  category: expenseCategory.default("MISC"),
  amount: z
    .union([z.number(), z.string()])
    .transform((v) => {
      const n = typeof v === "string" ? Number(v) : v;
      return Number.isNaN(n) ? 0 : n;
    }),
  date: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) =>
      v ? (typeof v === "string" ? new Date(v) : v) : new Date()
    ),
  recurrence: recurrence.default("ONCE"),
  notes: optionalString,
});

export const expenseUpdateSchema = expenseSchema.partial().extend({
  vehicleId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Fitment
// ---------------------------------------------------------------------------

export const fitmentSchema = z.object({
  vehicleId: z.string().min(1),
  label: optionalString,
  wheelWidth: optionalNumber,
  wheelDiameter: optionalNumber,
  offset: optionalNumber,
  tireSize: optionalString,
  current: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

const goalStatus = z.enum(["ACTIVE", "ACHIEVED", "ARCHIVED"]);

export const goalSchema = z.object({
  vehicleId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required"),
  description: optionalString,
  targetValue: optionalNumber,
  currentValue: optionalNumber,
  unit: optionalString,
  progress: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      const n = v === undefined || v === "" ? 0 : Number(v);
      return Number.isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
    }),
  status: goalStatus.default("ACTIVE"),
  dueDate: optionalDate,
});

export const goalUpdateSchema = goalSchema.partial().extend({
  vehicleId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Shopping items
// ---------------------------------------------------------------------------

const shoppingStatus = z.enum([
  "RESEARCHING",
  "READY_TO_BUY",
  "ORDERED",
  "INSTALLED",
]);
const priority = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const shoppingSchema = z.object({
  vehicleId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required"),
  estimatedCost: optionalNumber,
  priority: priority.default("MEDIUM"),
  status: shoppingStatus.default("RESEARCHING"),
  vendorUrl: optionalString,
  availability: optionalString,
});

export const shoppingUpdateSchema = shoppingSchema.partial().extend({
  vehicleId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

const documentType = z.enum([
  "DYNO_SHEET",
  "RECEIPT",
  "INVOICE",
  "ALIGNMENT_SHEET",
  "MANUAL",
  "OTHER",
]);

export const documentSchema = z.object({
  vehicleId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required"),
  type: documentType.default("OTHER"),
  url: z.string().trim().min(1, "A file or link is required"),
});

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

export const photoSchema = z.object({
  vehicleId: z.string().min(1),
  url: z.string().trim().min(1, "An image is required"),
  caption: optionalString,
});

// ---------------------------------------------------------------------------
// Timeline events
// ---------------------------------------------------------------------------

const timelineType = z.enum([
  "MOD_INSTALLED",
  "MOD_ORDERED",
  "SERVICE",
  "DYNO",
  "MILESTONE",
  "JOURNAL",
  "PHOTO",
]);

export const timelineSchema = z.object({
  vehicleId: z.string().min(1),
  type: timelineType.default("MILESTONE"),
  title: z.string().trim().min(1, "Title is required"),
  description: optionalString,
  date: z
    .union([z.string(), z.date()])
    .transform((v) => (typeof v === "string" ? new Date(v) : v)),
  cost: optionalNumber,
  imageUrl: optionalString,
});

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export const noteSchema = z.object({
  vehicleId: z.string().min(1),
  title: optionalString,
  content: z.string().default(""),
});

export const noteUpdateSchema = z.object({
  title: optionalString,
  content: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Dyno records
// ---------------------------------------------------------------------------

export const dynoSchema = z.object({
  vehicleId: z.string().min(1),
  date: z
    .union([z.string(), z.date()])
    .transform((v) => (typeof v === "string" ? new Date(v) : v)),
  hp: optionalNumber,
  torque: optionalNumber,
  zeroToSixty: optionalNumber,
  sixtyTo130: optionalNumber,
  quarterMile: optionalNumber,
  notes: optionalString,
});
