import { describe, expect, it } from "vitest";
import { parseTab } from "@/lib/tab/parse";
import { TUNINGS } from "@/lib/tuner";
import { arrangementOf, SONGS, songBySlug } from ".";

describe("fingerstyle catalog", () => {
  it("has unique song slugs and unique arrangement ids within a song", () => {
    expect(new Set(SONGS.map((s) => s.slug)).size).toBe(SONGS.length);
    for (const s of SONGS) expect(new Set(s.arrangements.map((a) => a.id)).size).toBe(s.arrangements.length);
  });

  it.each(SONGS.flatMap((s) => s.arrangements.map((a) => [`${s.slug}/${a.id}`, a] as const)))("%s parses into playable sections", (_, a) => {
    const tab = parseTab(a.tab);
    expect(tab.steps.length).toBeGreaterThan(0);
    expect(tab.sections.length).toBeGreaterThan(0);
    expect(TUNINGS.some((t) => t.id === a.tuning)).toBe(true);
    for (const s of tab.steps) for (const n of s.notes) if (n.kind === "fret") expect(n.fret).toBeLessThanOrEqual(24);
  });

  it("finds a song by slug and falls back to its first arrangement", () => {
    const song = songBySlug("bad-guy");
    expect(song?.title).toBe("Bad Guy");
    expect(songBySlug("nope")).toBeNull();
    if (song) expect(arrangementOf({ song, id: "khong-co" })).toBe(song.arrangements[0]);
  });
});

const badGuyTab = (id: string) => parseTab(songBySlug("bad-guy")?.arrangements.find((a) => a.id === id)?.tab ?? "");

describe("Bad Guy, the easy bass riff", () => {
  const tab = badGuyTab("de");
  it("is the version a newcomer lands on", () => {
    expect(songBySlug("bad-guy")?.arrangements[0].id).toBe("de");
  });
  it("keeps the song's sections in order", () => {
    expect(tab.sections.map((s) => s.name)).toEqual(["Intro", "Verse", "Chorus", "Melody"]);
  });
  it("plays the riff on the two bass strings and writes out the melody's repeats", () => {
    const riff = tab.steps.filter((s) => s.at < (tab.sections[3]?.start ?? 0));
    expect(riff.every((s) => s.notes.every((n) => n.string <= 2))).toBe(true);
    // The melody's first bar is marked x4: its four D-string notes (5, 5, 8 per pass) come out as 4 passes.
    const melody = tab.steps.filter((s) => s.at >= (tab.sections[3]?.start ?? 0));
    expect(melody.filter((s) => s.notes.some((n) => n.kind === "fret" && n.string === 2 && n.fret === 8)).length).toBe(4);
    expect(melody.flatMap((s) => s.notes).some((n) => n.kind === "dead")).toBe(false);
  });
});

describe("Bad Guy, Andrew Foy's arrangement", () => {
  const tab = badGuyTab("andrew-foy");
  it("keeps the song's sections in order", () => {
    expect(tab.sections.map((s) => s.name)).toEqual(["Intro", "Verse", "Chorus", "Postchorus", "Verse", "Chorus", "Postchorus"]);
  });
  it("switches between capo 3 and capo 1 in the intro", () => {
    expect(tab.capos.slice(0, 3).map((c) => c.fret)).toEqual([3, 1, 3]);
  });
  it("marks the wrist thumps and reaches the 14th fret", () => {
    expect(tab.steps.filter((s) => s.thump).length).toBeGreaterThan(20);
    expect(Math.max(...tab.steps.flatMap((s) => s.notes.map((n) => (n.kind === "fret" ? n.fret : 0))))).toBe(14);
  });
});
