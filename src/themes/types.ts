import type { ComponentType, ReactElement } from "react";
import type { Mode } from "@/lib/prefs";

/**
 * Colour tokens every skin must define for both modes. Layout and components read only these
 * (as CSS custom properties, e.g. `var(--ink)`, or Tailwind classes like `text-ink`, see globals.css).
 */
export const BASE_TOKENS = [
  "bg", // page background
  "surface", // cards, inputs
  "ink", // body text
  "soft", // secondary text
  "line", // hairlines
  "line-strong", // input and chip borders
  "link", // links, active chord
  "hover", // row hover, tinted panels
  "bar", // header bar
  "bar-ink", // text on the header bar
  "accent", // brand highlight: header border, primary buttons, focus on the bar
  "on-accent", // text on accent
  "check", // checkbox accent-color
  "field", // header search field
  "field-ink",
  "glow", // hover glow and the glow-follows-cursor light
  "ok", // "chơi được", known chords, easy
  "warn", // review issues, hard
  "warn-bg",
] as const;
export type BaseToken = (typeof BASE_TOKENS)[number];

export type ModeTokens = {
  colorScheme: "light" | "dark";
  base: Readonly<Record<BaseToken, string>>;
  /** Tokens only this skin's Scene reads (e.g. `--sky1`). */
  scene: Readonly<Record<string, string>>;
};

export type SkinTokens = {
  /** CSS `cursor` value for the page. */
  cursor: string;
} & Readonly<Record<Mode, ModeTokens>>;

/**
 * A skin: tokens for day and night, the 132px scene strip under the header, and Mầm's hat.
 * Mầm's body is shared; `Hat` draws in Mầm's 80×96 viewBox (head top ≈ y 36, sprout at x 40, y 2–16).
 */
export type Skin<Id extends string = string> = {
  id: Id;
  name: string;
  tokens: SkinTokens;
  /** aria-label of the day/night button: what pressing it does. */
  modeLabels: Readonly<Record<Mode, string>>;
  Scene: ComponentType;
  /** Plain SVG shapes, no hooks: share images (Satori) call it directly because they only draw intrinsic elements. */
  Hat: () => ReactElement;
};

/** Keeps the skin's id as a literal type, so the registry knows every valid id. */
export function defineSkin<const Id extends string>(skin: Skin<Id>): Skin<Id> {
  return skin;
}
