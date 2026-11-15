// Short interface sounds, synthesised in the browser so there are no files to load.
import { unlockAudio } from "./audio-unlock";

/** One tone: starts `at` seconds in, glides from `hz` to `to` (if given) and fades out over `dur`. */
type Tone = { hz: number; to?: number; at: number; dur: number; wave: OscillatorType; gain: number };

const SOUNDS = {
  /** A light click for small steps: transpose, copy. */
  tick: [{ hz: 1500, at: 0, dur: 0.035, wave: "triangle", gain: 0.25 }],
  /** Something added or switched on. */
  pop: [{ hz: 420, to: 880, at: 0, dur: 0.09, wave: "sine", gain: 0.35 }],
  /** Something removed or switched off. */
  unpop: [{ hz: 880, to: 420, at: 0, dur: 0.09, wave: "sine", gain: 0.3 }],
  /** A string reached its note. */
  chime: [
    { hz: 1568, at: 0, dur: 0.45, wave: "sine", gain: 0.22 },
    { hz: 2093, at: 0.08, dur: 0.6, wave: "sine", gain: 0.18 },
  ],
  /** Done: a rising major arpeggio. */
  success: [
    { hz: 523.25, at: 0, dur: 0.3, wave: "triangle", gain: 0.22 },
    { hz: 659.25, at: 0.08, dur: 0.3, wave: "triangle", gain: 0.22 },
    { hz: 783.99, at: 0.16, dur: 0.3, wave: "triangle", gain: 0.22 },
    { hz: 1046.5, at: 0.24, dur: 0.55, wave: "triangle", gain: 0.2 },
  ],
} as const satisfies Record<string, readonly Tone[]>;

export type Sfx = keyof typeof SOUNDS;

// One writer: LookProvider mirrors the visitor's sound setting here.
let on = true;
export function setSfxOn(value: boolean): void {
  on = value;
}

/** Plays a sound unless the visitor turned sounds off. Call it inside the tap so iOS lets it through. */
export function sfx(name: Sfx): void {
  if (!on) return;
  const a = unlockAudio({ holdSeconds: 1 });
  const now = a.currentTime;
  for (const t of SOUNDS[name] satisfies readonly Tone[]) {
    const osc = a.createOscillator();
    const env = a.createGain();
    osc.type = t.wave;
    osc.frequency.setValueAtTime(t.hz, now + t.at);
    if ("to" in t) osc.frequency.exponentialRampToValueAtTime(t.to, now + t.at + t.dur);
    // A 5 ms attack avoids the click of a gain jump; the exponential tail sounds like a struck object.
    env.gain.setValueAtTime(0.0001, now + t.at);
    env.gain.exponentialRampToValueAtTime(t.gain, now + t.at + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + t.at + t.dur);
    osc.connect(env).connect(a.destination);
    osc.start(now + t.at);
    osc.stop(now + t.at + t.dur + 0.02);
  }
}
