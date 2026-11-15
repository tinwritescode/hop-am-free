import { defineSkin } from "../types";
import { PhuyenHat } from "./Hat";
import { PhuyenScene } from "./Scene";
import { phuyenTokens } from "./tokens";

export const phuyen = defineSkin({
  id: "phuyen",
  name: "Phú Yên",
  tokens: phuyenTokens,
  modeLabels: { day: "Ngắm hải đăng", night: "Đón bình minh" },
  Scene: PhuyenScene,
  Hat: PhuyenHat,
});
