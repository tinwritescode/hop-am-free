import { defineSkin } from "../types";
import { HoianHat } from "./Hat";
import { HoianScene } from "./Scene";
import { hoianTokens } from "./tokens";

export const hoian = defineSkin({
  id: "hoian",
  name: "Hội An",
  tokens: hoianTokens,
  modeLabels: { day: "Lên đèn", night: "Ban ngày" },
  Scene: HoianScene,
  Hat: HoianHat,
});
