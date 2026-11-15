// The skin registry. Adding a skin: create src/themes/<id>/ (tokens.ts, Scene.tsx, Hat.tsx, index.ts with defineSkin),
// add it to SKINS below, and drop its name from UPCOMING_SKINS. Nothing else reads skin specifics.
import { dalat } from "./dalat";
import { hoian } from "./hoian";
import { phuyen } from "./phuyen";
import type { Skin } from "./types";

export const SKINS = [hoian, dalat, phuyen] as const;
export type SkinId = (typeof SKINS)[number]["id"];

export const DEFAULT_SKIN_ID: SkinId = "hoian";

/** Announced in the skin picker as disabled "(sắp có)" options. */
export const UPCOMING_SKINS = ["Giáng Sinh"] as const;

export function isSkinId(v: string): v is SkinId {
  return SKINS.some((s) => s.id === v);
}

export function skinById(id: SkinId): Skin {
  return SKINS.find((s) => s.id === id) ?? hoian;
}
