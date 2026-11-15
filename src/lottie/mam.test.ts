import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SKINS } from "@/themes";
import { mamLottie } from "./mam";

describe.each(SKINS)("Mầm's loading Lottie for $id", (skin) => {
  it("matches the current drawings (run `pnpm lottie` after changing Mầm or a hat)", () => {
    const saved: unknown = JSON.parse(readFileSync(new URL(`./mam-${skin.id}.json`, import.meta.url), "utf8"));
    expect(saved).toEqual(mamLottie(skin));
  });
});
