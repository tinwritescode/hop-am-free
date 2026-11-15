import { defineSkin } from "../types";
import { DalatHat } from "./Hat";
import { DalatScene } from "./Scene";
import { dalatTokens } from "./tokens";

export const dalat = defineSkin({
  id: "dalat",
  name: "Đà Lạt",
  tokens: dalatTokens,
  modeLabels: { day: "Ngắm sao", night: "Sương sớm" },
  Scene: DalatScene,
  Hat: DalatHat,
});
