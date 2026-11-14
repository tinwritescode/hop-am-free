import { describe, expect, it } from "vitest";
import { parseChordSheet } from "./chordsheet";
import { parseAiOutput } from "./ai-schema";

const sheet = parseChordSheet("Để nó [C] đến như lẽ đương [G] nhiên\n[Bb] Và để [Ab] gió");

describe("parseAiOutput", () => {
  it("keeps substitutions whose source is in the song and whose target is a real chord", () => {
    const out = parseAiOutput({
      task: "easy",
      sheet,
      data: ({
        summary: "ok",
        subs: [
          { from: "Bb", to: "Bbmaj7", reason: "a" },
          { from: "F", to: "Fmaj7", reason: "not in song" },
          { from: "Ab", to: "Qzz", reason: "not a chord" },
          { from: "C", to: "C", reason: "no-op" },
        ],
      }),
    });
    expect(out).toEqual({ task: "easy", summary: "ok", subs: [{ from: "Bb", to: "Bbmaj7", reason: "a" }] });
  });

  it("drops review issues pointing at missing lines and fixes whose chord is not on that line", () => {
    const out = parseAiOutput({
      task: "review",
      sheet,
      data: ({
        issues: [
          { line: 1, kind: "chord", title: "t", body: "b", fix: { from: "Ab", to: "Abmaj7" } },
          { line: 0, kind: "chord", title: "t2", body: "b2", fix: { from: "Ab", to: "Abmaj7" } },
          { line: 9, kind: "lyric", title: "t3", body: "b3", fix: null },
        ],
      }),
    });
    expect(out).toEqual({
      task: "review",
      issues: [
        { line: 1, kind: "chord", title: "t", body: "b", fix: { from: "Ab", to: "Abmaj7" } },
        { line: 0, kind: "chord", title: "t2", body: "b2", fix: null },
      ],
    });
  });

  it("keeps only song chords in tour steps", () => {
    const out = parseAiOutput({
      task: "tour",
      sheet,
      data: ({ steps: [{ title: "t", body: "b", chords: ["C", "E7"] }] }),
    });
    expect(out).toEqual({ task: "tour", steps: [{ title: "t", body: "b", chords: ["C"] }] });
  });

  it("returns null for malformed output", () => {
    expect(parseAiOutput({ task: "tour", sheet, data: undefined })).toBeNull();
    expect(parseAiOutput({ task: "tour", sheet, data: ({ steps: [] }) })).toBeNull();
  });
});
