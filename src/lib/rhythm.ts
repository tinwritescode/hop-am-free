import { z } from "zod";
import { slugify } from "./song";

/**
 * One step of a bar. D/U: strum down/up. B: thumb plays the chord's bass note. X: chặn (muted slap).
 * 1/2/3: pluck that treble string (picking styles). -: rest.
 */
export const STROKES = ["D", "U", "B", "X", "1", "2", "3", "-"] as const;
export type Stroke = (typeof STROKES)[number];
export const TIME_SIGNATURES = ["2/4", "3/4", "4/4", "6/8", "12/8"] as const;
export type TimeSignature = (typeof TIME_SIGNATURES)[number];

export const beatsOf = (ts: TimeSignature) => Number(ts.split("/")[0]);

export const RhythmPatternSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    timeSignature: z.enum(TIME_SIGNATURES),
    /** Steps per beat: 1 plain beats, 2 eighths, 3 triplets, 4 sixteenths. */
    subdivision: z.number().int().min(1).max(4),
    bpm: z.number().int().min(40).max(220),
    steps: z.array(z.enum(STROKES)).min(2).max(32),
    feel: z.string().trim().min(1).max(300),
    howTo: z.string().trim().min(1).max(800),
  })
  .refine((p) => p.steps.length === beatsOf(p.timeSignature) * p.subdivision, "steps must fill exactly one bar");
export type RhythmPattern = z.infer<typeof RhythmPatternSchema>;

/** A rhythm suggested for one song, as the song page shows it. */
export type SongRhythm = RhythmPattern & { slug: string; reason: string };

const SUB_LABELS: Record<number, string[]> = { 1: [], 2: ["&"], 3: ["&", "a"], 4: ["e", "&", "a"] };

export function countLabels({ timeSignature, subdivision }: Pick<RhythmPattern, "timeSignature" | "subdivision">): string[] {
  return Array.from({ length: beatsOf(timeSignature) }, (_, beat) => [String(beat + 1), ...SUB_LABELS[subdivision]]).flat();
}

/** What the model returns for "which rhythms fit this song"; patterns are checked one by one in planRhythms. */
export const RhythmSuggestionsSchema = z.object({
  rhythms: z.array(z.object({ slug: z.string(), reason: z.string().max(300), pattern: z.unknown() })).max(6),
});
export type RhythmSuggestion = z.infer<typeof RhythmSuggestionsSchema>["rhythms"][number];

export type RhythmPlan = { slug: string; reason: string; pattern: RhythmPattern | null };

/** Keeps suggestions that name a rhythm we have, or bring a valid pattern for a new one; at most 4, no duplicates. */
export function planRhythms({ existing, suggestions }: { existing: string[]; suggestions: RhythmSuggestion[] }): RhythmPlan[] {
  const known = new Set(existing);
  const seen = new Set<string>();
  const plan: RhythmPlan[] = [];
  for (const s of suggestions) {
    const slug = slugify(s.slug);
    if (seen.has(slug)) continue;
    if (known.has(slug)) {
      plan.push({ slug, reason: s.reason, pattern: null });
    } else {
      const pattern = RhythmPatternSchema.safeParse(s.pattern);
      if (!pattern.success) continue;
      plan.push({ slug, reason: s.reason, pattern: pattern.data });
    }
    seen.add(slug);
  }
  return plan.slice(0, 4);
}
