import { describe, expect, it } from "vitest";
import { MODES } from "@/lib/prefs";
import { SKINS } from ".";
import type { BaseToken } from "./types";

// WCAG 2.x relative luminance of a #RRGGBB colour.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast({ fg, bg }: { fg: string; bg: string }): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

// Text token on the background it is drawn over: each must reach WCAG AA for body text.
const TEXT_PAIRS: [BaseToken, BaseToken][] = [
  ["ink", "bg"],
  ["soft", "bg"],
  ["ink", "surface"],
  ["soft", "surface"],
  ["link", "bg"],
  ["ok", "bg"],
  ["warn", "warn-bg"],
  ["bar-ink", "bar"],
  ["on-accent", "accent"],
  ["field-ink", "field"],
];

describe.each(SKINS.flatMap((skin) => MODES.map((mode) => ({ name: skin.name, mode, base: skin.tokens[mode].base }))))(
  "$name ($mode) contrast",
  ({ base }) => {
    it.each(TEXT_PAIRS)("%s on %s is at least 4.5:1", (fg, bg) => {
      expect(contrast({ fg: base[fg], bg: base[bg] })).toBeGreaterThanOrEqual(4.5);
    });
  },
);
