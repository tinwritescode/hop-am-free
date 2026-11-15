import { describe, expect, it } from "vitest";
import { parseSetlist, setlistHref, setlistNav, setlistSongHref, whereInSetlist } from "./setlist";

describe("parseSetlist", () => {
  it("reads slugs in order, dropping blanks, repeats and anything that is not a slug", () => {
    expect(parseSetlist("a-b, c ,,a-b,<x>,D")).toEqual(["a-b", "c"]);
  });

  it("takes the first value when the parameter repeats, and nothing when it is missing", () => {
    expect(parseSetlist(["x,y", "z"])).toEqual(["x", "y"]);
    expect(parseSetlist(undefined)).toEqual([]);
  });

  it("keeps at most 30 songs", () => {
    expect(parseSetlist(Array.from({ length: 40 }, (_, i) => `s${i}`).join(","))).toHaveLength(30);
  });
});

describe("links", () => {
  it("shares the list and opens a song inside it", () => {
    expect(setlistHref(["a", "b"])).toBe("/danh-sach?b=a,b");
    expect(setlistSongHref({ slug: "b", slugs: ["a", "b"] })).toBe("/bai-hat/b?ds=a,b");
    expect(setlistSongHref({ slug: "b", slugs: ["a", "b"], present: true })).toBe("/bai-hat/b?ds=a,b&trinh-chieu=1");
  });
});

describe("whereInSetlist", () => {
  const slugs = ["a", "b", "c"];

  it("finds the song with its neighbours", () => {
    expect(whereInSetlist({ slugs, slug: "a" })).toEqual({ index: 0, total: 3, prev: null, next: "b" });
    expect(whereInSetlist({ slugs, slug: "c" })).toEqual({ index: 2, total: 3, prev: "b", next: null });
  });

  it("is null for a song that is not in the list", () => {
    expect(whereInSetlist({ slugs, slug: "z" })).toBeNull();
  });
});

describe("setlistNav", () => {
  it("links the songs either side, plain and for the projector, and the whole list", () => {
    const nav = setlistNav({ slugs: ["a", "b", "c"], slug: "b", titles: new Map([["a", "Bài A"], ["c", "Bài C"]]) });
    expect(nav).toEqual({
      index: 1,
      total: 3,
      listHref: "/danh-sach?b=a,b,c",
      prev: { title: "Bài A", href: "/bai-hat/a?ds=a,b,c", presentHref: "/bai-hat/a?ds=a,b,c&trinh-chieu=1" },
      next: { title: "Bài C", href: "/bai-hat/c?ds=a,b,c", presentHref: "/bai-hat/c?ds=a,b,c&trinh-chieu=1" },
    });
  });

  it("leaves out a neighbour that no longer exists", () => {
    expect(setlistNav({ slugs: ["a", "gone"], slug: "a", titles: new Map() })?.next).toBeNull();
  });
});
