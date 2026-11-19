import { useColorScheme } from "react-native";

// The web's default "Hội An" skin (src/themes/hoian/tokens.ts), day and night. Copied, not imported:
// the web's skin type is tied to React scenes and prefs, and the app needs only these few colours.
const PLUM = "#3A1B3E";
const LANTERN = "#F7B538";
const CREAM = "#FBEFD9";

const day = {
  bg: "#FFFDF8",
  surface: "#FFFFFF",
  ink: "#2E1A2F",
  soft: "#6B5566",
  line: "#EADFD3",
  bar: PLUM,
  barInk: CREAM,
  barSoft: "#D9BFD3",
  field: "#FFFFFF",
  fieldInk: "#2E1A2F",
  accent: LANTERN,
  onAccent: PLUM,
  chord: "#9A3412",
  hover: "#FFF4E0",
};

const night: typeof day = {
  bg: "#2A122E",
  surface: PLUM,
  ink: CREAM,
  soft: "#D9BFD3",
  line: "#55305A",
  bar: "#1E0C22",
  barInk: CREAM,
  barSoft: "#D9BFD3",
  field: "#34173A",
  fieldInk: CREAM,
  accent: LANTERN,
  onAccent: PLUM,
  chord: LANTERN,
  hover: "#34173A",
};

export type Colors = typeof day;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? night : day;
}

export const fonts = {
  display: "YesevaOne_400Regular",
  body: "BeVietnamPro_400Regular",
  medium: "BeVietnamPro_500Medium",
  bold: "BeVietnamPro_700Bold",
};
