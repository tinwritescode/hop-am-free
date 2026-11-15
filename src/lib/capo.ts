// Capo (kẹp capo): the fret the capo sits on, and who said so. AI estimates are kept apart so the site never shows them as fact.
import { z } from "zod";
import { transposeKey } from "./chords";
import { fold } from "./text";

/** sheet: the source sheet or page states it. ai: a model's estimate. editor: an admin or the importing agent set it. */
export const CAPO_SOURCES = ["sheet", "ai", "editor"] as const;
export const MAX_CAPO = 11;

export const CapoFretSchema = z.int().min(0).max(MAX_CAPO);
export const CapoSchema = z.object({ fret: CapoFretSchema, source: z.enum(CAPO_SOURCES) });
export type Capo = z.infer<typeof CapoSchema>;

/** What a draft may carry: a bare fret (set by whoever wrote the draft) or one the source sheet states. Never an AI guess. */
export const CapoDraftSchema = z
  .union([
    CapoFretSchema.transform((fret) => ({ fret, source: "editor" }) satisfies Capo),
    z.object({ fret: CapoFretSchema, source: z.enum(["sheet", "editor"]) }),
  ])
  .nullable()
  .default(null);

/**
 * The `capo` and `capo_source` columns. Besides unknown and known, an editor may mark a capo unknown on purpose
 * (`null` + `editor`), which keeps the backfill from guessing it again. The DB check constraint allows exactly these.
 */
const CapoColumnsSchema = z.union([
  z.object({ capo: z.null(), capoSource: z.null() }),
  z.object({ capo: z.null(), capoSource: z.literal("editor") }),
  z.object({ capo: CapoFretSchema, capoSource: z.enum(CAPO_SOURCES) }),
]);
export type CapoColumns = z.infer<typeof CapoColumnsSchema>;

/** Throws on a row the check constraint forbids. */
export function capoFromColumns(row: { capo: number | null; capoSource: string | null }): Capo | null {
  const parsed = CapoColumnsSchema.parse({ capo: row.capo, capoSource: row.capoSource });
  return parsed.capo === null ? null : { fret: parsed.capo, source: parsed.capoSource };
}

export type CapoSource = Capo["source"];

/** Which existing sources a new value may replace. Unknown is always replaceable; an editor's word, including "unknown", beats the rest. */
export const REPLACEABLE: Record<CapoSource, CapoSource[]> = { editor: ["editor", "sheet", "ai"], sheet: ["ai"], ai: [] };

export function mayReplace({ existing, incoming }: { existing: CapoSource | null; incoming: CapoSource }): boolean {
  return existing === null || REPLACEABLE[incoming].includes(existing);
}

export function capoColumns(capo: Capo | null): CapoColumns {
  return capo ? { capo: capo.fret, capoSource: capo.source } : { capo: null, capoSource: null };
}

/** The fret to state as fact (in a description or share image): an AI estimate is only shown with its warning, so here it counts as unknown. */
export function statedFret(capo: Capo | null): number | null {
  return capo && capo.source !== "ai" ? capo.fret : null;
}

/** The key the song sounds in when the sheet's chord shapes are played with this capo. */
export function soundingKey({ key, fret }: { key: string; fret: number }): string {
  return transposeKey({ key, semitones: fret });
}

/** After moving the chords by `semitones`, the capo that keeps the song sounding as before, or null if no capo 0–11 does. */
export function capoForTranspose({ fret, semitones }: { fret: number; semitones: number }): number | null {
  const next = fret - semitones;
  return CapoFretSchema.safeParse(next).success ? next : null;
}

// After folding: "capo", optional ":"/"-", then filler words (ở, on, at, the, ngăn, phím, fret, số), then the fret.
const MENTION = /(?<![a-z])capo(?![a-z])\s*[:=-]?\s*(?:(?:o|on|at|the|ngan|phim|fret|so)\s+)*(\d{1,2})(?:st|nd|rd|th)?(?![\d])/g;

/** The capo a sheet states ("Capo 3", "kẹp capo ngăn 2", "capo on 2nd fret"), or null when it states none, an impossible one, or two different ones. */
export function parseCapoMention(text: string): number | null {
  const frets = new Set<number>();
  for (const m of fold(text).matchAll(MENTION)) {
    const fret = CapoFretSchema.safeParse(Number(m[1]));
    if (fret.success) frets.add(fret.data);
  }
  const [only, ...rest] = frets;
  return only !== undefined && rest.length === 0 ? only : null;
}

const KeySchema = z.string().regex(/^[A-G][#b]?m?$/);

/** What the backfill asks the model for. */
export const CapoGuessSchema = z.object({
  capo: CapoFretSchema.nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  soundingKey: KeySchema.nullable(),
  reason: z.string().max(600),
});
export type CapoGuess = z.infer<typeof CapoGuessSchema>;

export type GuessVerdict = { kind: "store"; fret: number } | { kind: "skip"; why: "unknown" | "low" | "mismatch" };

/** Only confident guesses whose stated recording key agrees with capo = recording key − sheet key are worth storing. */
export function checkCapoGuess({ key, guess }: { key: string; guess: CapoGuess }): GuessVerdict {
  if (guess.capo === null) return { kind: "skip", why: "unknown" };
  if (guess.confidence === "low") return { kind: "skip", why: "low" };
  const expected = soundingKey({ key, fret: guess.capo });
  if (guess.soundingKey === null || transposeKey({ key: guess.soundingKey, semitones: 0 }) !== expected) return { kind: "skip", why: "mismatch" };
  return { kind: "store", fret: guess.capo };
}
