import { defineSkin } from "../types";
import { GiangsinhHat } from "./Hat";
import { GiangsinhScene } from "./Scene";
import { giangsinhTokens } from "./tokens";

export const giangsinh = defineSkin({
  id: "giangsinh",
  name: "Giáng Sinh",
  tokens: giangsinhTokens,
  modeLabels: { day: "Đón đêm Noel", night: "Ngày tuyết trắng" },
  Scene: GiangsinhScene,
  Hat: GiangsinhHat,
});
