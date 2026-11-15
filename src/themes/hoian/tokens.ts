import type { SkinTokens } from "../types";

// Colours from the approved "Hội An" design.
const LANTERN = "#F7B538";
const PLUM = "#3A1B3E";
const CREAM = "#FBEFD9";
const CLAY = "#B4532A";

export const hoianTokens: SkinTokens = {
  cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Cpath d='M4 3c8-2 17 2 19 8 2 7-4 13-10 12C8 22 2 11 4 3z' fill='%23F7B538' stroke='%233A1B3E' stroke-width='2' stroke-linejoin='round'/%3E%3C/svg%3E") 4 3, auto`,
  day: {
    colorScheme: "light",
    base: {
      bg: "#FFFDF8",
      surface: "#FFFFFF",
      ink: "#2E1A2F",
      soft: "#6B5566",
      line: "#EADFD3",
      "line-strong": "#CDBBAE",
      link: "#9A3412",
      hover: "#FFF4E0",
      bar: PLUM,
      "bar-ink": CREAM,
      accent: LANTERN,
      "on-accent": PLUM,
      check: CLAY,
      field: "#FFFFFF",
      "field-ink": "#2E1A2F",
      glow: "rgba(247,181,56,0.24)",
      ok: "#1F6B3A",
      warn: "#A0361B",
      "warn-bg": "#FDEDE6",
    },
    scene: { sky1: "#8ECDF0", sky2: "#FFFDF8", orb: "#FFE08A", cloud: "1", star: "0", win: "#7A3A1C", wall: "#EDB44A", roof: CLAY },
  },
  night: {
    colorScheme: "dark",
    base: {
      bg: "#2A122E",
      surface: PLUM,
      ink: CREAM,
      soft: "#D9BFD3",
      line: "#55305A",
      "line-strong": "#8C5A86",
      link: LANTERN,
      hover: "#34173A",
      bar: "#1E0C22",
      "bar-ink": CREAM,
      accent: LANTERN,
      "on-accent": PLUM,
      check: CLAY,
      field: "#FFFFFF",
      "field-ink": "#2E1A2F",
      glow: "rgba(247,181,56,0.14)",
      ok: "#8FE0A6",
      warn: "#F2785C",
      "warn-bg": "#4A1F33",
    },
    scene: { sky1: "#1E0C22", sky2: "#2A122E", orb: CREAM, cloud: "0", star: "1", win: LANTERN, wall: PLUM, roof: "#522A57" },
  },
};
