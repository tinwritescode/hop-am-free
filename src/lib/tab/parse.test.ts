import { describe, expect, it } from "vitest";
import { parseTab } from "./parse";

const block = (lines: string) => lines.trim().split("\n").map((l) => l.trim()).join("\n");

describe("parseTab", () => {
  it("reads notes column by column, string 0 being the low E, with bar lines", () => {
    const tab = parseTab(
      block(`
        e|-----|
        B|-----|
        G|-0---|
        D|-2---|
        A|-----|
        E|-0-3-|
      `),
    );
    expect(tab.length).toBe(6);
    expect(tab.steps).toEqual([
      {
        at: 1,
        thump: false,
        notes: [
          { kind: "fret", string: 0, fret: 0, via: null },
          { kind: "fret", string: 2, fret: 2, via: null },
          { kind: "fret", string: 3, fret: 0, via: null },
        ],
      },
      { at: 3, thump: false, notes: [{ kind: "fret", string: 0, fret: 3, via: null }] },
    ]);
    expect(tab.systems).toEqual([{ start: 0, width: 6, bars: [5] }]);
  });

  it("reads two-digit frets, hammer-ons, pull-offs, slides and dead notes", () => {
    const tab = parseTab(
      block(`
        e|-12-11h12-9p7--|
        B|---------------|
        G|-0/5-7\\5-------|
        D|---------------|
        A|-x-------------|
        E|---------------|
      `),
    );
    const notes = tab.steps.flatMap((s) => s.notes.map((n) => ({ at: s.at, ...n })));
    expect(notes).toEqual([
      { at: 1, kind: "dead", string: 1 },
      { at: 1, kind: "fret", string: 3, fret: 0, via: null },
      { at: 1, kind: "fret", string: 5, fret: 12, via: null },
      { at: 3, kind: "fret", string: 3, fret: 5, via: "slide-up" },
      { at: 4, kind: "fret", string: 5, fret: 11, via: null },
      { at: 5, kind: "fret", string: 3, fret: 7, via: null },
      { at: 7, kind: "fret", string: 3, fret: 5, via: "slide-down" },
      { at: 7, kind: "fret", string: 5, fret: 12, via: "hammer" },
      { at: 10, kind: "fret", string: 5, fret: 9, via: null },
      { at: 12, kind: "fret", string: 5, fret: 7, via: "pull" },
    ]);
  });

  it("takes capo changes and wrist thumps from the line above a block", () => {
    const tab = parseTab(
      [
        "  Capo 3   o Capo 1",
        "e|------------------|",
        "B|------------------|",
        "G|------------------|",
        "D|------------------|",
        "A|------------------|",
        "E|-0-0----0---------|",
      ].join("\n"),
    );
    expect(tab.capos).toEqual([
      { at: 0, fret: 3 },
      { at: 11, fret: 1 },
    ]);
    // The "o" sits one column after the note: it joins that note instead of sounding on its own.
    expect(tab.steps.map((s) => [s.at, s.thump])).toEqual([
      [1, false],
      [3, false],
      [8, true],
    ]);
  });

  it("keeps a thump with no note near it as its own step", () => {
    const tab = parseTab(["      o", "e|------|", "B|------|", "G|------|", "D|------|", "A|------|", "E|-0----|"].join("\n"));
    expect(tab.steps).toEqual([
      { at: 1, thump: false, notes: [{ kind: "fret", string: 0, fret: 0, via: null }] },
      { at: 4, thump: true, notes: [] },
    ]);
  });

  it("joins the overflow lines printed under a block back onto it", () => {
    const tab = parseTab(
      block(`
        e|----
        B|----
        G|----
        D|----
        A|-0--
        E|----
        ---|
        ---|
        ---|
        ---|
        -2-|
        ---|
      `),
    );
    expect(tab.length).toBe(8);
    expect(tab.steps.map((s) => [s.at, s.notes])).toEqual([
      [1, [{ kind: "fret", string: 1, fret: 0, via: null }]],
      [5, [{ kind: "fret", string: 1, fret: 2, via: null }]],
    ]);
  });

  it("lays blocks end to end and groups them under the [Section] above them, skipping page footers", () => {
    const sys = (fret: string) => ["e|---|", "B|---|", "G|---|", "D|---|", "A|---|", `E|-${fret}-|`].join("\n");
    const tab = parseTab(["[Intro]", sys("1"), "", "Page 1/4", "", sys("2"), "[Verse]", sys("3")].join("\n"));
    expect(tab.steps.map((s) => s.at)).toEqual([1, 5, 9]);
    expect(tab.systems.map((s) => s.start)).toEqual([0, 4, 8]);
    expect(tab.sections).toEqual([
      { name: "Intro", start: 0, end: 8 },
      { name: "Verse", start: 8, end: 12 },
    ]);
  });

  it("reads nothing from text that holds no tab", () => {
    expect(parseTab("Just some words\n| x   Dead note")).toEqual({ steps: [], systems: [], sections: [], capos: [], length: 0 });
  });
});
