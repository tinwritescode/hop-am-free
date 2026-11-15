import { describe, expect, it } from "vitest";
import { songShareUrl, songStartParam, startParamRedirect } from "./start-param";

describe("songStartParam", () => {
  it("passes a slug through unchanged: slugify only ever emits characters Telegram allows", () => {
    expect(songStartParam("de-no-den")).toBe("de-no-den");
    expect(songStartParam("mot-con-vit-2")).toBe("mot-con-vit-2");
  });

  it("refuses a slug Telegram cannot carry, rather than mangling it", () => {
    expect(songStartParam("a".repeat(65))).toBeNull();
    expect(songStartParam("có-dấu")).toBeNull();
    expect(songStartParam("a/b")).toBeNull();
    expect(songStartParam("")).toBeNull();
  });
});

describe("startParamRedirect", () => {
  const at = (path: string) => new URL(path, "https://hopam.tyvn.online");

  it("sends a Mini App launched with ?tgWebAppStartParam=<slug> to that song, dropping the parameter", () => {
    expect(startParamRedirect(at("/?tgWebAppStartParam=de-no-den"))?.href).toBe("https://hopam.tyvn.online/bai-hat/de-no-den");
  });

  it("keeps other query parameters", () => {
    expect(startParamRedirect(at("/?tgWebAppStartParam=de-no-den&x=1"))?.href).toBe("https://hopam.tyvn.online/bai-hat/de-no-den?x=1");
  });

  it("leaves the request alone when there is no parameter, or it is empty or invalid", () => {
    expect(startParamRedirect(at("/"))).toBeNull();
    expect(startParamRedirect(at("/?q=de"))).toBeNull();
    expect(startParamRedirect(at("/?tgWebAppStartParam="))).toBeNull();
    expect(startParamRedirect(at("/?tgWebAppStartParam=..%2Fadmin"))).toBeNull();
    expect(startParamRedirect(at(`/?tgWebAppStartParam=${"a".repeat(65)}`))).toBeNull();
  });
});

describe("songShareUrl", () => {
  it("shares a t.me deep link that reopens the Mini App on the song", () => {
    const url = new URL(songShareUrl({ slug: "de-no-den", title: "Để Nó Đến", origin: "https://hopam.tyvn.online" }));
    expect(url.origin + url.pathname).toBe("https://t.me/share/url");
    expect(url.searchParams.get("url")).toBe("https://t.me/HopAmBot?startapp=de-no-den");
    expect(url.searchParams.get("text")).toBe("Hợp âm Để Nó Đến");
  });

  it("falls back to the web page for a slug that cannot be a start parameter", () => {
    const slug = "a".repeat(70);
    const url = new URL(songShareUrl({ slug, title: "Dài", origin: "https://hopam.tyvn.online" }));
    expect(url.searchParams.get("url")).toBe(`https://hopam.tyvn.online/bai-hat/${slug}`);
  });
});
