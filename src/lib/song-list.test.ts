import { describe, expect, it } from "vitest";
import { parseChordSheet } from "./chordsheet";
import { summarize } from "./catalog";
import { clearedHref, DEFAULT_QUERY, indexableListHref, isSongPath, legacySearchRedirect, listHref, listSongs, PAGE_SIZE, pageItems, parseListQuery, type ListQuery } from "./song-list";

const song = ({ slug, artist = "A", key = "C", rhythm = "Ballad", raw = "[C] la" }: { slug: string; artist?: string; key?: string; rhythm?: string; raw?: string }) =>
  summarize({ slug, title: slug, artist, key, rhythm, sheet: parseChordSheet(raw) });

const fromHref = (href: string) => parseListQuery(Object.fromEntries(new URL(href, "https://x").searchParams));

describe("parseListQuery", () => {
  it("gives the defaults for an empty query", () => {
    expect(parseListQuery({})).toEqual(DEFAULT_QUERY);
  });

  it("reads every filter from its Vietnamese param", () => {
    expect(parseListQuery({ q: " mưa ", "sap-xep": "it-hop-am", dieu: "Ballad", tone: "Am", "ca-si": "Ngọt", "hop-am": "Am,C, G", trang: "3" })).toEqual({
      q: "mưa",
      sort: "fewest",
      rhythm: "Ballad",
      key: "Am",
      artist: "Ngọt",
      known: ["Am", "C", "G"],
      page: 3,
    });
  });

  it("falls back per field on junk instead of failing the page", () => {
    expect(parseListQuery({ "sap-xep": "hot", trang: "-2", dieu: "", tone: "x".repeat(500), "hop-am": "Am,,<script>,Am" })).toEqual({
      ...DEFAULT_QUERY,
      known: ["Am"],
    });
    expect(parseListQuery({ trang: "abc" }).page).toBe(1);
    expect(parseListQuery({ trang: "2.5" }).page).toBe(1);
  });

  it("takes the first value of a repeated param", () => {
    expect(parseListQuery({ dieu: ["Rumba", "Ballad"] }).rhythm).toBe("Rumba");
  });
});

describe("listHref", () => {
  it("is /bai-hat with nothing set", () => {
    expect(listHref(DEFAULT_QUERY)).toBe("/bai-hat");
  });

  it("writes only non-default values and round-trips through parseListQuery", () => {
    const query: ListQuery = { q: "để nó", sort: "az", rhythm: "Slow Rock", key: "F#m", artist: "Bằng Kiều, Minh Tuyết", known: ["Am", "C#m"], page: 2 };
    const href = listHref(query);
    expect(href.startsWith("/bai-hat?")).toBe(true);
    expect(fromHref(href)).toEqual(query);
    expect(listHref({ ...DEFAULT_QUERY, artist: "Ngọt" })).toBe("/bai-hat?ca-si=Ng%E1%BB%8Dt");
  });
});

describe("listSongs", () => {
  const songs = [
    song({ slug: "s1", artist: "Ngọt", key: "C", rhythm: "Ballad", raw: "[C] a [G] b" }),
    song({ slug: "s2", artist: "Ngọt", key: "Am", rhythm: "Rumba", raw: "[Am] a [E7] b" }),
    song({ slug: "s3", artist: "Thắng", key: "C", rhythm: "Rumba", raw: "[C] a" }),
  ];

  it("finds a duet under each of its singers, and counts each singer in the facet", () => {
    const duets = [
      song({ slug: "d1", artist: "Bằng Kiều, Minh Tuyết" }),
      song({ slug: "d2", artist: "Bằng Kiều" }),
      song({ slug: "d3", artist: "Trúc Nhân Ft. Minh Tuyết" }),
    ];
    const rows = (artist: string) => listSongs({ songs: duets, query: { ...DEFAULT_QUERY, artist } }).rows.map((s) => s.slug);
    expect(rows("Minh Tuyết")).toEqual(["d1", "d3"]);
    expect(rows("Bằng Kiều")).toEqual(["d1", "d2"]);
    // Links made before singers were split name the whole duet; they now list songs with all of those singers.
    expect(rows("Bằng Kiều, Minh Tuyết")).toEqual(["d1"]);
    expect(listSongs({ songs: duets, query: DEFAULT_QUERY }).facets.artist).toEqual([
      { name: "Bằng Kiều", count: 2 },
      { name: "Minh Tuyết", count: 2 },
      { name: "Trúc Nhân", count: 1 },
    ]);
  });

  it("filters by rhythm, key and artist together", () => {
    const res = listSongs({ songs, query: { ...DEFAULT_QUERY, rhythm: "Rumba", key: "C" } });
    expect(res.rows.map((s) => s.slug)).toEqual(["s3"]);
    expect(listSongs({ songs, query: { ...DEFAULT_QUERY, artist: "Ngọt" } }).rows.map((s) => s.slug)).toEqual(["s1", "s2"]);
  });

  it("keeps only songs whose full chord list is known when known chords are given", () => {
    const res = listSongs({ songs, query: { ...DEFAULT_QUERY, known: ["C", "G"] } });
    expect(res.rows.map((s) => s.slug)).toEqual(["s1", "s3"]);
    expect(res.total).toBe(2);
  });

  it("counts each facet over the songs matching the other filters, so a choice never leads to an empty list", () => {
    const res = listSongs({ songs, query: { ...DEFAULT_QUERY, rhythm: "Rumba" } });
    expect(res.facets.rhythm).toEqual([
      { name: "Rumba", count: 2 },
      { name: "Ballad", count: 1 },
    ]);
    expect(res.facets.key).toEqual([
      { name: "Am", count: 1 },
      { name: "C", count: 1 },
    ]);
    expect(res.facets.artist).toEqual([
      { name: "Ngọt", count: 1 },
      { name: "Thắng", count: 1 },
    ]);
  });

  it("serves 30 songs per page and clamps a page past the end to the last page", () => {
    const many = Array.from({ length: 65 }, (_, i) => song({ slug: `m${i}` }));
    const p1 = listSongs({ songs: many, query: DEFAULT_QUERY });
    expect(p1.rows).toHaveLength(PAGE_SIZE);
    expect(p1.pageCount).toBe(3);
    expect(p1.rows[0].slug).toBe("m0");
    const p2 = listSongs({ songs: many, query: { ...DEFAULT_QUERY, page: 2 } });
    expect(p2.rows[0].slug).toBe("m30");
    const past = listSongs({ songs: many, query: { ...DEFAULT_QUERY, page: 9 } });
    expect(past.page).toBe(3);
    expect(past.rows.map((s) => s.slug)).toEqual(["m60", "m61", "m62", "m63", "m64"]);
  });

  it("sorts before paginating", () => {
    const res = listSongs({ songs, query: { ...DEFAULT_QUERY, sort: "fewest" } });
    expect(res.rows[0].slug).toBe("s3");
  });

  it("has one empty page when nothing matches", () => {
    const res = listSongs({ songs, query: { ...DEFAULT_QUERY, key: "Bb" } });
    expect(res).toMatchObject({ rows: [], total: 0, page: 1, pageCount: 1 });
  });
});

describe("pageItems", () => {
  it("lists every page when there are few", () => {
    expect(pageItems({ page: 1, pageCount: 1 })).toEqual([1]);
    expect(pageItems({ page: 2, pageCount: 5 })).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps first, last and the neighbours of the current page, with gaps between", () => {
    expect(pageItems({ page: 1, pageCount: 15 })).toEqual([1, 2, "gap", 15]);
    expect(pageItems({ page: 7, pageCount: 15 })).toEqual([1, "gap", 6, 7, 8, "gap", 15]);
    expect(pageItems({ page: 15, pageCount: 15 })).toEqual([1, "gap", 14, 15]);
  });

  it("shows a page instead of a gap that would hide just that one page", () => {
    expect(pageItems({ page: 4, pageCount: 15 })).toEqual([1, 2, 3, 4, 5, "gap", 15]);
  });
});

describe("clearedHref", () => {
  it("drops search and filters but keeps the sort", () => {
    expect(clearedHref({ q: "x", sort: "az", rhythm: "Ballad", key: "C", artist: "Ngọt", known: ["C"], page: 4 })).toBe("/bai-hat?sap-xep=a-z");
  });
});

describe("isSongPath", () => {
  it("is true for a song page only, not the list or other pages", () => {
    expect(isSongPath("/bai-hat/de-no-den")).toBe(true);
    expect(isSongPath("/bai-hat")).toBe(false);
    expect(isSongPath("/bai-hat/")).toBe(false);
    expect(isSongPath("/")).toBe(false);
    expect(isSongPath("/admin/bai-hat/moi")).toBe(false);
  });
});

describe("legacySearchRedirect", () => {
  const from = (href: string) => legacySearchRedirect(new URL(href, "https://hopam.test"))?.href ?? null;

  it("sends an old home search (/?q=) to the list's search", () => {
    expect(from("/?q=mưa")).toBe("https://hopam.test/bai-hat?q=m%C6%B0a");
  });

  it("leaves the home page alone without a search, and other pages alone with one", () => {
    expect(from("/")).toBeNull();
    expect(from("/?q=%20%20")).toBeNull();
    expect(from("/bai-hat?q=mưa")).toBeNull();
  });
});

describe("indexableListHref", () => {
  it.each([
    [{}, "/bai-hat"],
    [{ artist: "Ngọt" }, "/bai-hat?ca-si=Ng%E1%BB%8Dt"],
    [{ rhythm: "Ballad", page: 2 }, "/bai-hat?dieu=Ballad&trang=2"],
  ])("%o is worth indexing at %s", (patch, href) => {
    expect(indexableListHref({ ...DEFAULT_QUERY, ...patch })).toBe(href);
  });

  it.each([
    ["a search", { q: "mưa" }],
    ["a key filter", { key: "Am" }],
    ["the visitor's own chords", { known: ["C", "G"] }],
    ["another sort", { sort: "az" as const }],
    ["artist and rhythm together", { artist: "Ngọt", rhythm: "Ballad" }],
  ])("%s is not", (_, patch) => {
    expect(indexableListHref({ ...DEFAULT_QUERY, ...patch })).toBeNull();
  });
});
