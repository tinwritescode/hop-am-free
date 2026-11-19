import { z } from "zod";
import { chordsInOrder, type ChordSheet } from "@hopamfree/core/chordsheet";
import { lookupChord } from "@hopamfree/core/chords";

export const AI_TASKS = ["tour", "review", "easy", "rich"] as const;
export type AiTask = (typeof AI_TASKS)[number];

const TourSchema = z.object({
  steps: z.array(z.object({ title: z.string(), body: z.string(), chords: z.array(z.string()) })).min(1).max(8),
});
const ReviewSchema = z.object({
  issues: z
    .array(
      z.object({
        line: z.number().int(),
        kind: z.enum(["chord", "lyric", "consistency"]),
        title: z.string(),
        body: z.string(),
        fix: z.object({ from: z.string(), to: z.string() }).nullable(),
      }),
    )
    .max(10),
});
const SubsSchema = z.object({
  summary: z.string(),
  subs: z.array(z.object({ from: z.string(), to: z.string(), reason: z.string() })).max(16),
});

export type TourStep = z.infer<typeof TourSchema>["steps"][number];
export type ReviewIssue = z.infer<typeof ReviewSchema>["issues"][number];
export type Substitution = z.infer<typeof SubsSchema>["subs"][number];

/** Shape our /api/ai route returns; the client parses responses with it. */
export const AiResultSchema = z.discriminatedUnion("task", [
  TourSchema.extend({ task: z.literal("tour") }),
  ReviewSchema.extend({ task: z.literal("review") }),
  SubsSchema.extend({ task: z.enum(["easy", "rich"]) }),
]);
export type AiResult = z.infer<typeof AiResultSchema>;
/** The result variant for one task ("easy" and "rich" share a variant). */
export type AiResultFor<T extends AiTask> = AiResult extends infer R ? (R extends { task: infer K } ? (T extends K ? R : never) : never) : never;

/** Validates model output and drops anything that does not fit this song. */
export function parseAiOutput({ task, sheet, data }: { task: AiTask; sheet: ChordSheet; data: unknown }): AiResult | null {
  const songChords = new Set(chordsInOrder(sheet));
  switch (task) {
    case "tour": {
      const r = TourSchema.safeParse(data);
      if (!r.success) return null;
      return { task, steps: r.data.steps.map((s) => ({ ...s, chords: s.chords.filter((c) => songChords.has(c)) })) };
    }
    case "review": {
      const r = ReviewSchema.safeParse(data);
      if (!r.success) return null;
      const lines = new Map(sheet.flatMap((s) => s.lines).map((l) => [l.index, l]));
      const issues = r.data.issues.flatMap((issue) => {
        const line = lines.get(issue.line);
        if (!line) return [];
        const fixOk =
          issue.fix !== null &&
          line.tokens.some((t) => t.chord === issue.fix?.from) &&
          lookupChord(issue.fix.to) !== null;
        return [{ ...issue, fix: fixOk ? issue.fix : null }];
      });
      return { task, issues };
    }
    case "easy":
    case "rich": {
      const r = SubsSchema.safeParse(data);
      if (!r.success) return null;
      const seen = new Set<string>();
      const subs = r.data.subs.filter((s) => {
        const ok = songChords.has(s.from) && s.to !== s.from && lookupChord(s.to) !== null && !seen.has(s.from);
        if (ok) seen.add(s.from);
        return ok;
      });
      return { task, summary: r.data.summary, subs };
    }
    default: {
      const _exhaustive: never = task;
      return _exhaustive;
    }
  }
}
