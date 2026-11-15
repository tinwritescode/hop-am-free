import { describe, expect, it } from "vitest";
import { parseChordSheet } from "./chordsheet";
import { artistsOf, artistTone, commonChords, easySongs, firstLyricLine, homeSections, initialOf, isPlayable, sortSongs, summarize, tally, type SongSummary } from "./catalog";

const song = ({ slug, title, artist = "Ca sĩ", key = "C", rhythm = "", raw = "[C] la" }: { slug: string; title: string; artist?: string; key?: string; rhythm?: string; raw?: string }) =>
  summarize({ slug, title, artist, key, rhythm, sheet: parseChordSheet(raw) });

describe("firstLyricLine", () => {
  it("skips chord-only intro lines and returns the first sung line with its chords", () => {
    const sheet = parseChordSheet("## Intro\n[Cmaj7] [Gmaj7]\n## Phiên khúc\nĐể nó [C] đến như lẽ đương [G] nhiên\n[Am] Dòng sau");
    expect(firstLyricLine(sheet)).toEqual([
      { chord: null, text: "Để" },
      { chord: null, text: "nó" },
      { chord: "C", text: "đến" },
      { chord: null, text: "như" },
      { chord: null, text: "lẽ" },
      { chord: null, text: "đương" },
      { chord: "G", text: "nhiên" },
    ]);
  });

  it("prefers a sung line that carries chords over an earlier line without any", () => {
    const sheet = parseChordSheet("lời không hợp âm\n[Am] Có hợp âm");
    expect(firstLyricLine(sheet)).toEqual([
      { chord: "Am", text: "Có" },
      { chord: null, text: "hợp" },
      { chord: null, text: "âm" },
    ]);
  });

  it("falls back to the first sung line, then to the first line, when nothing better exists", () => {
    expect(firstLyricLine(parseChordSheet("chỉ có lời\n[C] [G]")).map((t) => t.text)).toEqual(["chỉ", "có", "lời"]);
    expect(firstLyricLine(parseChordSheet("[C] [G]")).map((t) => t.chord)).toEqual(["C", "G"]);
    expect(firstLyricLine([])).toEqual([]);
  });
});

describe("isPlayable", () => {
  it("is true only when every chord of the song is known", () => {
    expect(isPlayable({ chords: ["Am", "C"], known: new Set(["Am", "C", "G"]) })).toBe(true);
    expect(isPlayable({ chords: ["Am", "E7"], known: new Set(["Am", "C"]) })).toBe(false);
  });

  it("is false for an empty known set", () => {
    expect(isPlayable({ chords: ["C"], known: new Set() })).toBe(false);
  });
});

describe("summarize", () => {
  it("lists each chord once, in order of first use, plus the opening lyric", () => {
    const s = song({ slug: "a", title: "A", raw: "## Intro\n[Am] [F]\nMưa [Am] rơi [C] trên [Am] hiên" });
    expect(s.chords).toEqual(["Am", "F", "C"]);
    expect(s.snippet.map((t) => t.text).join(" ")).toBe("Mưa rơi trên hiên");
  });
});

describe("sortSongs", () => {
  const songs: SongSummary[] = [
    song({ slug: "newest", title: "Đường Về", raw: "[C] a [G] b [Am] c" }),
    song({ slug: "middle", title: "Ánh Trăng", raw: "[C] a" }),
    song({ slug: "oldest", title: "Bông Hồng", raw: "[C] a [G] b" }),
  ];

  it("keeps the newest-first order for 'new'", () => {
    expect(sortSongs({ songs, by: "new" }).map((s) => s.slug)).toEqual(["newest", "middle", "oldest"]);
  });

  it("puts songs with the fewest distinct chords first for 'fewest'", () => {
    expect(sortSongs({ songs, by: "fewest" }).map((s) => s.slug)).toEqual(["middle", "oldest", "newest"]);
  });

  it("sorts titles alphabetically with Vietnamese collation for 'az'", () => {
    expect(sortSongs({ songs, by: "az" }).map((s) => s.title)).toEqual(["Ánh Trăng", "Bông Hồng", "Đường Về"]);
  });

  it("does not mutate the input", () => {
    sortSongs({ songs, by: "az" });
    expect(songs.map((s) => s.slug)).toEqual(["newest", "middle", "oldest"]);
  });
});

describe("tally", () => {
  it("counts non-empty values, most common first, ties by name", () => {
    expect(tally(["Ballad", "", "Rumba", "Ballad", "Bolero"])).toEqual([
      { name: "Ballad", count: 2 },
      { name: "Bolero", count: 1 },
      { name: "Rumba", count: 1 },
    ]);
  });
});

describe("commonChords", () => {
  it("ranks chords by how many songs use them and caps the list", () => {
    const songs = [song({ slug: "1", title: "1", raw: "[Am] a [C] b" }), song({ slug: "2", title: "2", raw: "[C] a [G] b" }), song({ slug: "3", title: "3", raw: "[C] a [G] b" })];
    expect(commonChords({ songs, limit: 2 })).toEqual(["C", "G"]);
  });
});

describe("easySongs", () => {
  it("picks the songs with the fewest distinct chords, one per artist first", () => {
    const songs = [
      song({ slug: "ngot-2", title: "a", artist: "Ngọt", raw: "[C] a [G] b" }),
      song({ slug: "ngot-1", title: "b", artist: "Ngọt", raw: "[C] a" }),
      song({ slug: "thang-3", title: "c", artist: "Thắng", raw: "[C] a [G] b [Am] c" }),
      song({ slug: "ha-2", title: "d", artist: "Hà", raw: "[Am] a [E] b" }),
    ];
    expect(easySongs({ songs, limit: 3 }).map((s) => s.slug)).toEqual(["ngot-1", "ha-2", "thang-3"]);
  });

  it("fills up with a second song by an artist when there are not enough artists", () => {
    const songs = [song({ slug: "x1", title: "a", artist: "X", raw: "[C] a" }), song({ slug: "x2", title: "b", artist: "X", raw: "[C] a [G] b" })];
    expect(easySongs({ songs, limit: 6 }).map((s) => s.slug)).toEqual(["x1", "x2"]);
  });
});

describe("artistsOf", () => {
  it.each([
    ["Bằng Kiều", ["Bằng Kiều"]],
    ["Bằng Kiều, Minh Tuyết", ["Bằng Kiều", "Minh Tuyết"]],
    ["Trúc Nhân Ft. Văn Mai Hương", ["Trúc Nhân", "Văn Mai Hương"]],
    ["Trúc Nhân feat Văn Mai Hương", ["Trúc Nhân", "Văn Mai Hương"]],
    ["Trúc Nhân & Văn Mai Hương", ["Trúc Nhân", "Văn Mai Hương"]],
    ["Tăng Duy Tân, Sơn Tùng M-TP,  Trúc Nhân ", ["Tăng Duy Tân", "Sơn Tùng M-TP", "Trúc Nhân"]],
    ["Tuấn Hưng, Bằng Kiều, Nhiều Tác Giả", ["Tuấn Hưng", "Bằng Kiều"]],
    ["Ngọt, Ngọt", ["Ngọt"]],
    ["Trúc Nhân, Min St.319", ["Trúc Nhân", "Min St.319"]],
  ])("%s", (artist, expected) => {
    expect(artistsOf(artist)).toEqual(expected);
  });
});

describe("homeSections", () => {
  const songs = [
    song({ slug: "n1", title: "1", artist: "Ngọt", rhythm: "Ballad", raw: "[Am] a [C] b" }),
    song({ slug: "n2", title: "2", artist: "Ngọt", rhythm: "Rumba", raw: "[C] a [G] b" }),
    song({ slug: "t1", title: "3", artist: "Thắng", rhythm: "Ballad", raw: "[C] a" }),
    song({ slug: "b1", title: "4", artist: "Bằng Kiều, Minh Tuyết", rhythm: "", raw: "[C] a [G] b [F] c" }),
  ];
  const home = homeSections({ songs, sizes: { artists: 2, quick: 1, newest: 3, easy: 2, rhythms: 1, chips: 2 } });

  it("counts songs, each singer of a duet on their own, and rhythms", () => {
    expect(home.total).toBe(4);
    expect(home.artistCount).toBe(4);
    expect(home.rhythmCount).toBe(2);
  });

  it("takes the top N of each list, most common first", () => {
    expect(home.artists).toEqual([
      { name: "Ngọt", count: 2 },
      { name: "Bằng Kiều", count: 1 },
    ]);
    expect(home.quick).toEqual(["Ngọt"]);
    expect(home.rhythms).toEqual([{ name: "Ballad", count: 2 }]);
    expect(home.chips).toEqual(["C", "G"]);
  });

  it("keeps the newest songs in database order and the easiest by chord count", () => {
    expect(home.newest.map((s) => s.slug)).toEqual(["n1", "n2", "t1"]);
    expect(home.easy.map((s) => s.slug)).toEqual(["t1", "n1"]);
  });
});

describe("initialOf and artistTone", () => {
  it("uses the first letter, upper-cased, Vietnamese letters included", () => {
    expect(initialOf("đen Vâu")).toBe("Đ");
    expect(initialOf("  ngọt")).toBe("N");
    expect(initialOf("")).toBe("?");
  });

  it("gives the same artist the same colour slot every time", () => {
    expect(artistTone("Ngọt")).toBe(artistTone("Ngọt"));
    expect([0, 1, 2, 3]).toContain(artistTone("Bằng Kiều"));
    expect(new Set(["A", "B", "C", "D"].map(artistTone)).size).toBe(4);
  });
});
