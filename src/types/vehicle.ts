import type { BuildStatus } from "@prisma/client";

export interface VehicleWithCount {
  id: string;
  name: string;
  buildStatus: BuildStatus;
  nickname: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  generation: string | null;
  engine: string | null;
  drivetrain: string | null;
  transmission: string | null;
  currentHp: number | null;
  stockHp: number | null;
  targetHp: string | null;
  currentWeight: number | null;
  factoryWeight: number | null;
  purchasePrice: number | null;
  currentMileage: number | null;
  coverImage: string | null;
  color: string | null;
  createdAt: string;
  _count: { modifications: number };
}
