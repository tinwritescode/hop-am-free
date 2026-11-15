import { describe, expect, it } from "vitest";
import { parsePrefs, prefCookie, PREF_COOKIE } from "./prefs";

const isSkin = (v: string): v is "hoian" | "dalat" => v === "hoian" || v === "dalat";

describe("parsePrefs", () => {
  it("defaults to day, the default skin, glow off and sound on when nothing is stored", () => {
    expect(parsePrefs({ raw: {}, isSkin, defaultSkin: "hoian" })).toEqual({ mode: "day", modeSaved: false, skin: "hoian", glow: false, sound: true });
  });

  it("reads valid stored values", () => {
    expect(parsePrefs({ raw: { mode: "night", skin: "dalat", glow: "on", sound: "off" }, isSkin, defaultSkin: "hoian" })).toEqual({ mode: "night", modeSaved: true, skin: "dalat", glow: true, sound: false });
  });

  it("falls back per field when a stored value is unknown or stale", () => {
    expect(parsePrefs({ raw: { mode: "dusk", skin: "christmas", glow: "yes", sound: "loud" }, isSkin, defaultSkin: "hoian" })).toEqual({ mode: "day", modeSaved: false, skin: "hoian", glow: false, sound: true });
    expect(parsePrefs({ raw: { mode: "night", skin: "christmas" }, isSkin, defaultSkin: "hoian" })).toEqual({ mode: "night", modeSaved: true, skin: "hoian", glow: false, sound: true });
  });
});

describe("prefCookie", () => {
  it("writes a site-wide, year-long, lax cookie", () => {
    expect(prefCookie({ name: PREF_COOKIE.mode, value: "night" })).toBe("haf-mode=night; Path=/; Max-Age=31536000; SameSite=Lax");
  });
});
