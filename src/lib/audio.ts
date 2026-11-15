import { countLabels, type RhythmPattern, type Stroke } from "./rhythm";

import { audioContext as audio, releaseAudio, unlockAudio } from "./audio-unlock";
import { pluckSamples } from "./pluck";

const RING_SECONDS = 3;
const strings = new Map<number, AudioBuffer>();

/** The recorded sound of one plucked string, made once per note. */
function stringBuffer(note: number): AudioBuffer {
  const a = audio();
  let buf = strings.get(note);
  if (!buf) {
    buf = a.createBuffer(1, Math.round(a.sampleRate * RING_SECONDS), a.sampleRate);
    buf.copyToChannel(pluckSamples({ midi: note, sampleRate: a.sampleRate, seconds: RING_SECONDS }), 0);
    strings.set(note, buf);
  }
  return buf;
}

/** Plucks one string at time `t`; the returned gain lets a later note on the same string cut it short. */
export function pluck({ out, note, t, gain, decay }: { out: AudioNode; note: number; t: number; gain: number; decay: number }): GainNode {
  const a = audio();
  const src = a.createBufferSource();
  const env = a.createGain();
  src.buffer = stringBuffer(note);
  env.gain.setValueAtTime(gain, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(decay, RING_SECONDS));
  src.connect(env).connect(out);
  src.start(t);
  src.stop(t + Math.min(decay, RING_SECONDS) + 0.05);
  return env;
}

/** A percussive hit on the strings: a muted strum, a dead note, a thump. */
export function slap({ out, t, gain = 0.25 }: { out: AudioNode; t: number; gain?: number }) {
  const a = audio();
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * 0.05), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  const env = a.createGain();
  env.gain.value = gain;
  src.buffer = buf;
  src.connect(env).connect(out);
  src.start(t);
}

/** Plays the notes low to high like a quick down-strum. */
export function strum(midi: number[]): void {
  const a = unlockAudio({ holdSeconds: 2.5 });
  midi.forEach((note, i) => pluck({ out: a.destination, note, t: a.currentTime + i * 0.035, gain: 0.16, decay: 1.8 }));
}

function playStroke({ out, stroke, midi, t, decay }: { out: AudioNode; stroke: Stroke; midi: number[]; t: number; decay: number }) {
  const low = [...midi].sort((x, y) => x - y);
  switch (stroke) {
    case "D":
      return low.forEach((note, i) => pluck({ out, note, t: t + i * 0.012, gain: 0.11, decay }));
    case "U":
      return low
        .slice(-4)
        .reverse()
        .forEach((note, i) => pluck({ out, note, t: t + i * 0.01, gain: 0.08, decay }));
    case "B":
      return low[0] !== undefined && pluck({ out, note: low[0], t, gain: 0.18, decay: decay * 1.5 });
    case "1":
    case "2":
    case "3": {
      const note = low[low.length - Number(stroke)];
      return note !== undefined && pluck({ out, note, t, gain: 0.14, decay });
    }
    case "X":
      return slap({ out, t });
    case "-":
      return;
    default: {
      const _exhaustive: never = stroke;
      return _exhaustive;
    }
  }
}

export type Playback = { stop: () => void; stepAt: () => number | null };

/** Loops `bars` bars of the pattern on one chord. `stepAt` tells which step is sounding now (null when finished). */
export function playPattern({ pattern, midi, bars = 4 }: { pattern: RhythmPattern; midi: number[]; bars?: number }): Playback {
  const stepDur = 60 / pattern.bpm / pattern.subdivision;
  const steps = countLabels(pattern).length;
  const a = unlockAudio({ holdSeconds: bars * steps * stepDur + 2 });
  const out = a.createGain();
  out.connect(a.destination);
  const start = a.currentTime + 0.08;
  for (let bar = 0; bar < bars; bar++)
    pattern.steps.forEach((stroke, i) => playStroke({ out, stroke, midi, t: start + (bar * steps + i) * stepDur, decay: Math.max(0.25, stepDur * 2) }));
  let stopped = false;
  return {
    stop: () => {
      stopped = true;
      out.disconnect();
      releaseAudio();
    },
    stepAt: () => {
      const n = Math.floor((a.currentTime - start) / stepDur);
      return stopped || n >= bars * steps ? null : Math.max(0, n) % steps;
    },
  };
}
