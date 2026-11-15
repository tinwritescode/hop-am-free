"use client";

import { useEffect, useRef } from "react";
import { useLook } from "@/components/look/LookProvider";

/** Soft light and a ring that follow the mouse. Off by default; CSS hides it under prefers-reduced-motion and on touch screens. */
export function GlowLayer() {
  const { glow } = useLook().prefs;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!glow) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return; // a finger or pen would drag the ring to each tap
      ref.current?.style.setProperty("--mx", `${e.clientX}px`);
      ref.current?.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [glow]);

  if (!glow) return null;
  return (
    <div ref={ref} aria-hidden="true" className="glow-layer pointer-events-none fixed inset-0 z-40">
      <div className="absolute inset-0" style={{ background: "radial-gradient(420px circle at var(--mx, 50%) var(--my, -999px), var(--glow), transparent 70%)" }} />
      <div
        className="absolute size-[26px] rounded-full border-[1.5px] border-accent"
        style={{
          left: "var(--mx, -99px)",
          top: "var(--my, -99px)",
          margin: "-13px 0 0 -13px",
          boxShadow: "0 0 14px 2px color-mix(in srgb, var(--accent) 60%, transparent)",
          transition: "left .12s ease-out, top .12s ease-out",
        }}
      />
    </div>
  );
}
