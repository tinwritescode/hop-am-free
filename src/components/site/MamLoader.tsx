"use client";

import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { useLook } from "@/components/look/LookProvider";
import { INTRO, PAD } from "@/lottie/frame";
import type { SkinId } from "@/themes";

// Each skin's animation is its own chunk, fetched only when a loading screen shows.
const ANIMATION: Record<SkinId, () => Promise<{ default: { op: number } }>> = {
  hoian: () => import("@/lottie/mam-hoian.json"),
  dalat: () => import("@/lottie/mam-dalat.json"),
  phuyen: () => import("@/lottie/mam-phuyen.json"),
  giangsinh: () => import("@/lottie/mam-giangsinh.json"),
};

/**
 * Mầm at work while a page loads, played from its Lottie: pops up, then trots with the lantern while notes rise.
 * The CSS Mascot stands in until the player is ready, and stays for visitors who ask for reduced motion.
 */
export function MamLoader({ size }: { size: number }) {
  const id = useLook().prefs.skin;
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stop = () => {};
    let live = true;
    Promise.all([import("lottie-web/build/player/lottie_light"), ANIMATION[id]()]).then(([{ default: lottie }, { default: data }]) => {
      if (!live || !box.current) return;
      // lottie-web writes into the data it is given, so each player gets its own copy.
      const anim = lottie.loadAnimation({ container: box.current, renderer: "svg", loop: true, autoplay: false, animationData: structuredClone(data) });
      anim.addEventListener("DOMLoaded", () => setReady(true));
      anim.playSegments([[0, data.op], [INTRO, data.op]], true);
      stop = () => anim.destroy();
    });
    return () => {
      live = false;
      stop();
      setReady(false);
    };
  }, [id]);

  const unit = size / 96; // px per unit of Mầm's 80×96 drawing
  return (
    <div className="relative" style={{ width: 80 * unit, height: size }}>
      <Mascot size={size} motion="busy" className={ready ? "invisible" : undefined} />
      <div
        ref={box}
        aria-hidden="true"
        className="absolute"
        style={{ left: -PAD.left * unit, top: -PAD.top * unit, width: (80 + PAD.left + PAD.right) * unit, height: (96 + PAD.top + PAD.bottom) * unit }}
      />
    </div>
  );
}
