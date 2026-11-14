import { describe, expect, it } from "vitest";
import { countLabels, planRhythms, RhythmPatternSchema, type RhythmPattern } from "./rhythm";

const ballad: RhythmPattern = {
  name: "Ballad",
  timeSignature: "4/4",
  subdivision: 2,
  bpm: 72,
  steps: ["B", "-", "D", "U", "-", "U", "D", "U"],
  feel: "Nhẹ, đều",
  howTo: "Ngón cái gảy bass phách 1, sau đó quạt xuống lên.",
};

describe("RhythmPatternSchema", () => {
  it("accepts a bar whose step count matches beats × subdivision", () => {
    expect(RhythmPatternSchema.safeParse(ballad).success).toBe(true);
    expect(RhythmPatternSchema.safeParse({ ...ballad, timeSignature: "3/4", subdivision: 1, steps: ["B", "D", "D"] }).success).toBe(true);
  });

  it("rejects a bar with the wrong number of steps or unknown strokes", () => {
    expect(RhythmPatternSchema.safeParse({ ...ballad, steps: ["B", "D", "U"] }).success).toBe(false);
    expect(RhythmPatternSchema.safeParse({ ...ballad, steps: ["B", "-", "D", "U", "-", "U", "D", "Q"] }).success).toBe(false);
  });
});

describe("countLabels", () => {
  it("counts beats and their subdivisions", () => {
    expect(countLabels(ballad)).toEqual(["1", "&", "2", "&", "3", "&", "4", "&"]);
    expect(countLabels({ timeSignature: "3/4", subdivision: 1 })).toEqual(["1", "2", "3"]);
    expect(countLabels({ timeSignature: "2/4", subdivision: 4 })).toEqual(["1", "e", "&", "a", "2", "e", "&", "a"]);
  });
});

describe("planRhythms", () => {
  it("links known slugs, creates new valid patterns, and drops the rest", () => {
    const plan = planRhythms({
      existing: ["ballad"],
      suggestions: [
        { slug: "Ballad", reason: "Hợp nhịp chậm", pattern: null },
        { slug: "slow-rock", reason: "Chậm 12/8", pattern: { ...ballad, name: "Slow Rock", timeSignature: "12/8", subdivision: 1, steps: ["B", "3", "2", "1", "2", "3", "B", "3", "2", "1", "2", "3"] } },
        { slug: "bolero", reason: "Không có mẫu", pattern: null },
        { slug: "ballad", reason: "Trùng", pattern: null },
      ],
    });
    expect(plan.map((p) => [p.slug, p.pattern?.name ?? null])).toEqual([
      ["ballad", null],
      ["slow-rock", "Slow Rock"],
    ]);
  });
});
