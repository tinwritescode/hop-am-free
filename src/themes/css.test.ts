import { describe, expect, it } from "vitest";
import { SKINS } from ".";
import { skinCss } from "./css";
import { hoianTokens } from "./hoian/tokens";
import { BASE_TOKENS } from "./types";

describe("skinCss", () => {
  const css = skinCss(SKINS);

  it.each(SKINS)("emits one rule per mode for $name, keyed off data-skin and data-mode on <html> or on a part of the page", ({ id, tokens }) => {
    expect(css).toContain(`:root[data-skin="${id}"]{--cursor:`);
    expect(css).toContain(`:root[data-skin="${id}"][data-mode="day"],:root[data-skin="${id}"] [data-mode="day"]{color-scheme:light;--bg:${tokens.day.base.bg};`);
    expect(css).toContain(`:root[data-skin="${id}"][data-mode="night"],:root[data-skin="${id}"] [data-mode="night"]{color-scheme:dark;--bg:${tokens.night.base.bg};`);
  });

  it.each(SKINS)("emits every base token and the scene tokens for both modes of $name", ({ id }) => {
    const rule = (mode: string) => css.split("\n").find((r) => r.startsWith(`:root[data-skin="${id}"][data-mode="${mode}"]`)) ?? "";
    for (const t of BASE_TOKENS) {
      expect(rule("day")).toContain(`--${t}:`);
      expect(rule("night")).toContain(`--${t}:`);
    }
    expect(rule("day")).toContain("--star:0");
    expect(rule("night")).toContain("--star:1");
  });

  it("rejects values that could break out of the style block", () => {
    const bad = { ...hoianTokens, day: { ...hoianTokens.day, scene: { orb: "red}</style><script>" } } };
    expect(() => skinCss([{ id: "x", tokens: bad }])).toThrow();
  });
});
