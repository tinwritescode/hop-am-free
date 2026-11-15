"use client";

import { useLook } from "@/components/look/LookProvider";
import { MascotArt, type MascotMotion } from "./MascotArt";

export type { MascotMotion } from "./MascotArt";

/** Mầm wearing the current skin's hat. */
export function Mascot({ size, motion, className }: { size?: number; motion?: MascotMotion; className?: string }) {
  const { Hat } = useLook().skin;
  return <MascotArt size={size} motion={motion} className={className} hat={<Hat />} />;
}
