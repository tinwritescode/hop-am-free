import { describe, expect, it } from "vitest";
import { parseChordSheet, chordsInOrder, applyFixes } from "./chordsheet";

describe("parseChordSheet", () => {
  it("puts each chord on the first word after it and keeps other words chordless", () => {
    const [section] = parseChordSheet("Để nó [C] đến như lẽ đương [G] nhiên");
    expect(section.lines[0].tokens).toEqual([
      { chord: null, text: "Để" },
      { chord: null, text: "nó" },
      { chord: "C", text: "đến" },
      { chord: null, text: "như" },
      { chord: null, text: "lẽ" },
      { chord: null, text: "đương" },
      { chord: "G", text: "nhiên" },
    ]);
  });

  it("keeps chord-only lines as chord tokens with empty text", () => {
    const [section] = parseChordSheet("[Cmaj7] [Gmaj7]");
    expect(section.lines[0]).toMatchObject({ chordOnly: true, hasChords: true });
    expect(section.lines[0].tokens.map((t) => t.chord)).toEqual(["Cmaj7", "Gmaj7"]);
  });

  it("splits sections on ## headings and on blank lines, numbering lines across the song", () => {
    const sheet = parseChordSheet("## Intro\n[C] [G]\n\nĐể nó [C] đến\nlời không hợp âm\n## Điệp khúc\n[Am] Hát");
    expect(sheet.map((s) => s.title)).toEqual(["Intro", null, "Điệp khúc"]);
    expect(sheet[1].lines.map((l) => l.index)).toEqual([1, 2]);
    expect(sheet[1].lines[1].hasChords).toBe(false);
    expect(sheet[2].lines[0].index).toBe(3);
  });

  it("applies per-line chord fixes only on the targeted line", () => {
    const sheet = applyFixes(parseChordSheet("[Ab] a\n[Ab] b"), { 1: { from: "Ab", to: "Abmaj7" } });
    expect(sheet[0].lines.map((l) => l.tokens[0].chord)).toEqual(["Ab", "Abmaj7"]);
  });

  it("lists distinct chords in order of first appearance", () => {
    expect(chordsInOrder(parseChordSheet("[C] a [G] b [C] c\n[Am] d"))).toEqual(["C", "G", "Am"]);
  });
});
