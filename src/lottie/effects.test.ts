import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EFFECT_IDS, effectLottie } from "./effects";

describe.each(EFFECT_IDS)("the %s effect", (id) => {
  it("matches its generator (run `pnpm lottie` after changing it)", () => {
    const saved: unknown = JSON.parse(readFileSync(new URL(`./fx-${id}.json`, import.meta.url), "utf8"));
    expect(saved).toEqual(effectLottie(id));
  });

  it("plays once and leaves nothing on screen", () => {
    const { op, layers } = effectLottie(id);
    for (const layer of layers) {
      const fade = layer.ks.o.k;
      expect(fade.at(-1)).toEqual({ t: expect.any(Number), s: [0] });
      expect(fade.at(-1)?.t).toBeLessThanOrEqual(op);
    }
  });
});
