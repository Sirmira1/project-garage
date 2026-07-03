import type {
  ModCategory,
  ModStatus,
  CarArea,
  ServiceType,
  DocumentType,
  GoalStatus,
  ShoppingStatus,
  Priority,
  TimelineEventType,
} from "@prisma/client";

export interface ModDTO {
  id: string;
  vehicleId: string;
  name: string;
  category: ModCategory;
  area: CarArea;
  brand: string | null;
  description: string | null;
  cost: number | null;
  installDate: string | null;
  status: ModStatus;
  notes: string | null;
  partNumber: string | null;
}

export interface ServiceDTO {
  id: string;
  name: string;
  type: ServiceType;
  status: "PLANNED" | "DONE";
  date: string | null;
  mileage: number | null;
  cost: number | null;
  notes: string | null;
  nextDueDate: string | null;
  nextDueMileage: number | null;
}

export interface GoalDTO {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  status: GoalStatus;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
}

export interface DocumentDTO {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
}

export interface PhotoDTO {
  id: string;
  url: string;
  caption: string | null;
}

export interface TimelineDTO {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string | null;
  date: string;
  cost: number | null;
  imageUrl: string | null;
  imageUrls: string[];
}

export interface ShoppingDTO {
  id: string;
  name: string;
  estimatedCost: number | null;
  priority: Priority;
  status: ShoppingStatus;
  vendorUrl: string | null;
  availability: string | null;
}

export interface FitmentDTO {
  id: string;
  label: string | null;
  wheelWidth: number | null;
  wheelDiameter: number | null;
  offset: number | null;
  tireSize: string | null;
  current: boolean;
}

export interface VehicleDTO {
  id: string;
  name: string;
  nickname: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  generation: string | null;
  vin: string | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  stockHp: number | null;
  currentHp: number | null;
  targetHp: number | null;
  stockTorque: number | null;
  currentTorque: number | null;
  factoryWeight: number | null;
  currentWeight: number | null;
  purchasePrice: number | null;
  purchaseDate: string | null;
  currentMileage: number | null;
  coverImage: string | null;
  color: string | null;
}

export interface NoteDTO {
  id: string;
  title: string | null;
  content: string;
  updatedAt: string;
}

export interface DynoDTO {
  id: string;
  date: string;
  hp: number | null;
  torque: number | null;
  zeroToSixty: number | null;
  sixtyTo130: number | null;
  quarterMile: number | null;
  notes: string | null;
}

export interface ExpenseDTO {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  recurrence: "ONCE" | "MONTHLY" | "YEARLY";
  notes: string | null;
}

export interface VehicleDetailData {
  vehicle: VehicleDTO;
  modifications: ModDTO[];
  services: ServiceDTO[];
  goals: GoalDTO[];
  documents: DocumentDTO[];
  photos: PhotoDTO[];
  timeline: TimelineDTO[];
  shopping: ShoppingDTO[];
  fitments: FitmentDTO[];
  notes: NoteDTO[];
  dyno: DynoDTO[];
  expenses: ExpenseDTO[];
}
