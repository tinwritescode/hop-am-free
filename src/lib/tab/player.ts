// Sounds a parsed tab in the browser, scheduled ahead on the audio clock so it keeps time when the page is busy.
import { pluck, slap } from "../audio";
import { audioContext, releaseAudio, unlockAudio } from "../audio-unlock";
import type { CapoChange, TabStep } from "./parse";
import { capoAt, columnAt, noteMidi } from "./timeline";

export type Voice = { strings: readonly number[]; capo: number; capos: readonly CapoChange[] };

const LOOKAHEAD = 0.25;
const RING = 2;

/** Sounds one step at `t`. A new note on a string stops the note still ringing on it, as a finger would. */
function sound({ step, t, out, voice, ringing }: { step: TabStep; t: number; out: AudioNode; voice: Voice; ringing: Map<number, GainNode> }) {
  const capo = capoAt({ capos: voice.capos, at: step.at, initial: voice.capo });
  for (const n of step.notes) {
    const old = ringing.get(n.string);
    if (old) {
      old.gain.cancelScheduledValues(t);
      old.gain.setTargetAtTime(0.0001, t, 0.015);
    }
    if (n.kind === "dead") {
      ringing.delete(n.string);
      slap({ out, t, gain: 0.07 });
      continue;
    }
    // Hammer-ons, pull-offs and slides are not picked again, so they sound softer.
    const gain = n.via === null ? 0.17 : 0.1;
    ringing.set(n.string, pluck({ out, note: noteMidi({ strings: voice.strings, string: n.string, fret: n.fret, capo }), t, gain, decay: RING }));
  }
  if (!step.thump) return;
  slap({ out, t, gain: 0.3 });
  // The heel of the hand lands on the strings and stops what is still ringing.
  for (const [string, env] of ringing) {
    if (step.notes.some((n) => n.string === string)) continue;
    env.gain.cancelScheduledValues(t);
    env.gain.setTargetAtTime(0.0001, t, 0.02);
    ringing.delete(string);
  }
}

/** Plays a single step now, for stepping through by hand. Call it inside the tap. */
export function playStep({ step, voice }: { step: TabStep; voice: Voice }): void {
  const a = unlockAudio({ holdSeconds: RING });
  sound({ step, t: a.currentTime + 0.01, out: a.destination, voice, ringing: new Map() });
}

export type TabRun = { stop: () => void; columnNow: () => number | null };

/**
 * Plays `steps` from column `from` to `hi` at `columnsPerSecond`, then again from `lo` while `loop` is on.
 * `columnNow` is the playhead (null once a run without loop has ended). Call it inside the tap.
 */
export function playTab({
  steps,
  voice,
  from,
  lo,
  hi,
  loop,
  columnsPerSecond,
}: {
  steps: readonly TabStep[];
  voice: Voice;
  from: number;
  lo: number;
  hi: number;
  loop: boolean;
  columnsPerSecond: number;
}): TabRun {
  const a = unlockAudio({ holdSeconds: loop ? 3600 : (hi - from) / columnsPerSecond + RING });
  const out = a.createGain();
  out.connect(a.destination);
  const t0 = a.currentTime + 0.08;
  const inRange = steps.filter((s) => s.at >= lo && s.at < hi);
  const ringing = new Map<number, GainNode>();
  let pass = 0;
  let next = inRange.findIndex((s) => s.at >= from);
  if (next < 0) next = inRange.length;
  // Pass 0 runs from `from` to `hi`; each later pass replays [lo, hi) right after.
  const columnOf = (s: TabStep) => (pass === 0 ? s.at : hi + (pass - 1) * (hi - lo) + (s.at - lo));
  const schedule = () => {
    const horizon = audioContext().currentTime + LOOKAHEAD;
    for (;;) {
      if (next >= inRange.length) {
        if (!loop || inRange.length === 0) return;
        pass += 1;
        next = 0;
      }
      const step = inRange[next];
      const t = t0 + (columnOf(step) - from) / columnsPerSecond;
      if (t > horizon) return;
      sound({ step, t, out, voice, ringing });
      next += 1;
    }
  };
  schedule();
  const timer = setInterval(schedule, 50);
  return {
    stop: () => {
      clearInterval(timer);
      out.disconnect();
      releaseAudio();
    },
    columnNow: () => columnAt({ from, lo, hi, loop, elapsed: (a.currentTime - t0) * columnsPerSecond }),
  };
}
