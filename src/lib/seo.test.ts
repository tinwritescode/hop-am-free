import { describe, expect, it } from "vitest";
import { parseChordSheet } from "./chordsheet";
import { breadcrumbJsonLd, cardVersion, pageMeta, SITE_OG_PATH, songCard, songDescription, songOgPath } from "./seo";

const song = (patch: Partial<Parameters<typeof songCard>[0]> = {}) => ({
  slug: "loi-cuoi-cho-em",
  title: "Lời Cuối Cho Em",
  artist: "Bằng Kiều",
  key: "C",
  rhythm: "Slow Rock",
  capo: { fret: 5, source: "sheet" as const },
  sheet: parseChordSheet("[C]Lời [Am]cuối [Xyz]cho [F]em [G]nhé [C]em [E7]ơi"),
  ...patch,
});

describe("pageMeta", () => {
  it("gives the page its canonical link, Open Graph and a large Twitter card", () => {
    const meta = pageMeta({ title: "Ca sĩ", description: "Tất cả ca sĩ", path: "/ca-si" });
    expect(meta.alternates?.canonical).toBe("/ca-si");
    expect(meta.openGraph).toMatchObject({
      title: "Ca sĩ",
      description: "Tất cả ca sĩ",
      url: "/ca-si",
      siteName: "Hợp Âm Free",
      locale: "vi_VN",
      images: [{ url: SITE_OG_PATH, width: 1200, height: 630 }],
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: [SITE_OG_PATH] });
    expect(meta.robots).toBeUndefined();
  });

  it("keeps a page out of search results without a canonical when asked", () => {
    const meta = pageMeta({ title: "Tìm “mưa”", description: "d", path: null });
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates).toBeUndefined();
  });
});

describe("songDescription", () => {
  it("names the key, a stated capo and the rhythm", () => {
    expect(songDescription(song())).toBe("Hợp âm guitar Lời Cuối Cho Em (Bằng Kiều), tone C, capo 5, điệu Slow Rock. Lời và thế bấm trên cùng một màn hình.");
  });

  it("leaves out an AI guess, capo 0 and a missing rhythm", () => {
    for (const capo of [{ fret: 3, source: "ai" as const }, { fret: 0, source: "sheet" as const }, null]) {
      expect(songDescription(song({ capo, rhythm: "" }))).toBe("Hợp âm guitar Lời Cuối Cho Em (Bằng Kiều), tone C. Lời và thế bấm trên cùng một màn hình.");
    }
  });
});

describe("songCard", () => {
  it("draws the first four distinct chords that have a diagram, easiest shape first", () => {
    const card = songCard(song());
    expect(card.chords.map((c) => c.name)).toEqual(["C", "Am", "F", "G"]);
    expect(card.chords[0].position.baseFret).toBe(1);
  });

  it("shows a stated capo, including 0, but never an AI guess", () => {
    expect(songCard(song()).capo).toBe(5);
    expect(songCard(song({ capo: { fret: 0, source: "editor" } })).capo).toBe(0);
    expect(songCard(song({ capo: { fret: 3, source: "ai" } })).capo).toBeNull();
  });

  it("composes Vietnamese text so the card font finds every glyph", () => {
    expect(songCard(song({ title: "Lời Cuối Cho Em".normalize("NFD") })).title).toBe("Lời Cuối Cho Em");
  });
});

describe("songOgPath", () => {
  it("puts a content version in the path, so an edited card gets a new URL and an unchanged one keeps its cache", () => {
    const path = songOgPath({ slug: "loi-cuoi-cho-em", card: songCard(song()) });
    expect(path).toMatch(/^\/og\/bai-hat\/loi-cuoi-cho-em\/[0-9a-z]+$/);
    expect(songOgPath({ slug: "loi-cuoi-cho-em", card: songCard(song()) })).toBe(path);
    expect(cardVersion(songCard(song({ capo: { fret: 4, source: "sheet" } })))).not.toBe(cardVersion(songCard(song())));
  });
});

describe("breadcrumbJsonLd", () => {
  it("lists the trail with absolute URLs", () => {
    expect(
      breadcrumbJsonLd({
        origin: "https://hopam.tyvn.online",
        trail: [
          { name: "Bài hát", path: "/bai-hat" },
          { name: "Lời Cuối Cho Em", path: "/bai-hat/loi-cuoi-cho-em" },
        ],
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Bài hát", item: "https://hopam.tyvn.online/bai-hat" },
        { "@type": "ListItem", position: 2, name: "Lời Cuối Cho Em", item: "https://hopam.tyvn.online/bai-hat/loi-cuoi-cho-em" },
      ],
    });
  });
});
