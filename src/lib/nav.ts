import {
  LayoutDashboard,
  Warehouse,
  Wrench,
  Clock,
  BarChart3,
  Image as ImageIcon,
  ClipboardList,
  ShoppingCart,
  Target,
  FileText,
  Settings,
  Gauge,
  StickyNote,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Garage", href: "/garage", icon: Warehouse },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export interface VehicleTab {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const vehicleTabs: VehicleTab[] = [
  { label: "Overview", value: "overview", icon: LayoutDashboard },
  { label: "Build Sheet", value: "build", icon: Wrench },
  { label: "Diagram", value: "diagram", icon: ClipboardList },
  { label: "Timeline", value: "timeline", icon: Clock },
  { label: "Analytics", value: "analytics", icon: BarChart3 },
  { label: "Costs", value: "costs", icon: DollarSign },
  { label: "Dyno", value: "dyno", icon: Gauge },
  { label: "Gallery", value: "gallery", icon: ImageIcon },
  { label: "Service", value: "service", icon: Wrench },
  { label: "Shopping", value: "shopping", icon: ShoppingCart },
  { label: "Goals", value: "goals", icon: Target },
  { label: "Documents", value: "documents", icon: FileText },
  { label: "Notes", value: "notes", icon: StickyNote },
];
