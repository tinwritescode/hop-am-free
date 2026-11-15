import type { ReactNode } from "react";

/**
 * How Mầm moves (it always blinks). `idle` sways gently with the sprout waving, for Mầm sitting beside text;
 * `busy` is the working pose: walking in place, swinging the lantern.
 */
export type MascotMotion = "rest" | "idle" | "bob" | "busy";
const BODY_MOTION: Record<MascotMotion, string> = { rest: "", idle: "anim-idle", bob: "anim-bob", busy: "anim-trot" };

/**
 * "Mầm": the sprout mascot and the face of every AI feature. The body (and the little lantern it holds) is shared;
 * `hat` is the skin's hat, drawn. `size` is the height in px. No hooks, so share images can draw it too.
 */
export function MascotArt({ size = 40, motion = "rest", className, hat }: { size?: number; motion?: MascotMotion; className?: string; hat: ReactNode }) {
  const busy = motion === "busy";
  return (
    <svg width={(size * 80) / 96} height={size} viewBox="0 0 80 96" overflow="visible" aria-hidden="true" className={`${BODY_MOTION[motion]} ${className ?? ""}`}>
      <ellipse cx="32" cy="89" rx="7" ry="3.5" fill="#3A1B3E" className={busy ? "anim-step" : undefined} />
      <ellipse cx="48" cy="89" rx="7" ry="3.5" fill="#3A1B3E" className={busy ? "anim-step" : undefined} style={busy ? { animationDelay: "-0.5s" } : undefined} />
      <ellipse cx="40" cy="62" rx="24" ry="26" fill="#FBEFD9" stroke="#3A1B3E" strokeWidth="2" />
      <g className="anim-blink" fill="#3A1B3E">
        <circle cx="32" cy="58" r="3" />
        <circle cx="48" cy="58" r="3" />
      </g>
      <path d="M34 67q6 5 12 0" fill="none" stroke="#3A1B3E" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="65" r="3.5" fill="#F2785C" opacity=".6" />
      <circle cx="54" cy="65" r="3.5" fill="#F2785C" opacity=".6" />
      <path d="M62 68q9 1 9 8" fill="none" stroke="#3A1B3E" strokeWidth="2" strokeLinecap="round" />
      {/* The lantern hangs from the hand at (71, 76); `busy` swings it from there. */}
      <g className={busy ? "anim-swing" : undefined} style={busy ? { transformOrigin: "71px 76px" } : undefined}>
        <g className="anim-lit">
          <ellipse cx="71" cy="84" rx="6" ry="7" fill="#F7B538" />
        </g>
        <path d="M71 76v2M71 91v4" stroke="#3A1B3E" strokeWidth="2" strokeLinecap="round" />
      </g>
      {hat}
      <g className={motion === "rest" ? undefined : "anim-wiggle"}>
        <path d="M40 16V8" stroke="#3E8E4E" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 9q-9 1-11-7 9-1 11 7zM40 9q9 1 11-7-9-1-11 7z" fill="#6DBF7B" stroke="#3E8E4E" strokeWidth="1.2" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
