import { z } from "zod";

// Per-visitor look: day/night, skin, the glow-follows-cursor light and UI sounds. Kept in cookies so the server renders the right mode on first paint.

export const MODES = ["day", "night"] as const;
export type Mode = (typeof MODES)[number];

export const PREF_COOKIE = { mode: "haf-mode", skin: "haf-skin", glow: "haf-glow", sound: "haf-sound" } as const;

/** `modeSaved` is false until the visitor picks day or night, so the mode may follow the surroundings (e.g. Telegram's theme) until then. */
export type Prefs<Skin extends string = string> = { mode: Mode; modeSaved: boolean; skin: Skin; glow: boolean; sound: boolean };

const ModeSchema = z.enum(MODES);
const GlowSchema = z.literal("on");
/** Sounds are on until the visitor turns them off. */
const SoundOffSchema = z.literal("off");

export function parsePrefs<Skin extends string>({
  raw,
  isSkin,
  defaultSkin,
}: {
  raw: Partial<Record<keyof typeof PREF_COOKIE, string>>;
  isSkin: (v: string) => v is Skin;
  defaultSkin: Skin;
}): Prefs<Skin> {
  const mode = ModeSchema.safeParse(raw.mode);
  return {
    mode: mode.success ? mode.data : "day",
    modeSaved: mode.success,
    skin: raw.skin !== undefined && isSkin(raw.skin) ? raw.skin : defaultSkin,
    glow: GlowSchema.safeParse(raw.glow).success,
    sound: !SoundOffSchema.safeParse(raw.sound).success,
  };
}

export function prefCookie({ name, value }: { name: string; value: string }): string {
  return `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
