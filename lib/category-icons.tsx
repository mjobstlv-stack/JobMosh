import {
  Code2,
  Palette,
  Stethoscope,
  GraduationCap,
  Handshake,
  Wrench,
  UtensilsCrossed,
  Truck,
  Megaphone,
  Calculator,
  Headset,
  Scale,
  Building2,
  Briefcase,
  Shirt,
  Warehouse,
  type LucideIcon,
} from "lucide-react"

import type { IconKey } from "@/lib/job-board-data"

export const ICON_REGISTRY: Record<IconKey, LucideIcon> = {
  code: Code2,
  palette: Palette,
  stethoscope: Stethoscope,
  graduation: GraduationCap,
  sales: Handshake,
  engineering: Wrench,
  food: UtensilsCrossed,
  logistics: Truck,
  marketing: Megaphone,
  finance: Calculator,
  support: Headset,
  legal: Scale,
  realestate: Building2,
  briefcase: Briefcase,
  fashion: Shirt,
  warehouse: Warehouse,
}

export function getCategoryIcon(icon: string): LucideIcon {
  return ICON_REGISTRY[icon as IconKey] ?? Briefcase
}
