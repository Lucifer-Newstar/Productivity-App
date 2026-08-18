"use client";
/** Central semantic Lucide mapping for all first-class Kaizen spaces. */
import {
  Anvil,
  BriefcaseBusiness,
  Clapperboard,
  Dumbbell,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import type { SpaceId } from "../lib/types";
const ICONS: Record<SpaceId, LucideIcon> = {
  projects: Anvil,
  workout: Dumbbell,
  career: BriefcaseBusiness,
  entertainment: Clapperboard,
  health: HeartPulse,
};
export default function SpaceIcon({
  space,
  size = 18,
  strokeWidth = 1.8,
  className,
}: {
  space: SpaceId;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const Icon = ICONS[space];
  return (
    <Icon
      aria-hidden
      size={size}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
