import { z } from "zod";

export const CHORD_STYLES = ["above", "inline"] as const;
export type ChordStyle = (typeof CHORD_STYLES)[number];

export const SettingsSchema = z.object({
  /** "above": chord sits over the word; "inline": `để nó [C] đến`. */
  chordStyle: z.enum(CHORD_STYLES),
  fontSize: z.number().int().min(14).max(28),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = { chordStyle: "above", fontSize: 18 };

/** Stored settings may be stale or hand-edited; anything invalid falls back to the default for that field. */
export function parseSettings(raw: unknown): Settings {
  const obj = z.record(z.string(), z.unknown()).safeParse(raw);
  if (!obj.success) return DEFAULT_SETTINGS;
  const style = SettingsSchema.shape.chordStyle.safeParse(obj.data.chordStyle);
  const size = SettingsSchema.shape.fontSize.safeParse(obj.data.fontSize);
  return {
    chordStyle: style.success ? style.data : DEFAULT_SETTINGS.chordStyle,
    fontSize: size.success ? size.data : DEFAULT_SETTINGS.fontSize,
  };
}
