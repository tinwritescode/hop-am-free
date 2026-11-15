import type { EffectId } from "@/lottie/effects";

// Each effect is its own chunk, fetched the first time it plays.
const EFFECTS: Record<EffectId, { size: number; load: () => Promise<{ default: object }> }> = {
  notes: { size: 120, load: () => import("@/lottie/fx-notes.json") },
  confetti: { size: 320, load: () => import("@/lottie/fx-confetti.json") },
};

/** Plays a one-shot effect centred on `from`, over everything and never in the way of a tap. Skipped for reduced motion. */
export function playEffect({ effect, from }: { effect: EffectId; from: Element }) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { size, load } = EFFECTS[effect];
  const at = from.getBoundingClientRect();
  const box = document.createElement("div");
  box.setAttribute("aria-hidden", "true");
  box.style.cssText = `position:fixed;left:${at.left + at.width / 2 - size / 2}px;top:${at.top + at.height / 2 - size / 2}px;width:${size}px;height:${size}px;pointer-events:none;z-index:60`;
  document.body.append(box);
  Promise.all([import("lottie-web/build/player/lottie_light"), load()]).then(
    ([{ default: lottie }, { default: data }]) => {
      // lottie-web writes into the data it is given, so each player gets its own copy.
      const anim = lottie.loadAnimation({ container: box, renderer: "svg", loop: false, autoplay: true, animationData: structuredClone(data) });
      anim.addEventListener("complete", () => {
        anim.destroy();
        box.remove();
      });
    },
    () => box.remove(),
  );
}
