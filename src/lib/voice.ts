// Hearing the visitor's voice: the pitch of a short slice of microphone sound, the range they sang, and the key that
// suits it. All of it is an estimate; the page says so.
import { NOTES } from "@hopamfree/core/chords";

const MIN_HZ = 70; // below a low bass voice
const MAX_HZ = 1000; // above a high soprano
const THRESHOLD = 0.15; // YIN: how aperiodic a slice may be and still count as a note

/** The fundamental frequency of `samples` in Hz (YIN), or null for silence, noise or anything without a clear pitch. */
export function detectPitch({ samples, sampleRate }: { samples: Float32Array; sampleRate: number }): number | null {
  let energy = 0;
  for (const s of samples) energy += s * s;
  if (Math.sqrt(energy / samples.length) < 0.01) return null;

  const minLag = Math.floor(sampleRate / MAX_HZ);
  const maxLag = Math.min(Math.floor(sampleRate / MIN_HZ), Math.floor(samples.length / 2));
  const width = samples.length - maxLag;
  // Cumulative mean normalised difference: how unlike itself the signal is when shifted by each lag.
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    let diff = 0;
    for (let i = 0; i < width; i++) {
      const d = samples[i] - samples[i + lag];
      diff += d * d;
    }
    running += diff;
    cmnd[lag] = running ? (diff * lag) / running : 1;
  }
  // The first dip under the threshold is the period; shorter lags would be overtones, longer ones octaves below.
  let lag = minLag;
  while (lag <= maxLag && cmnd[lag] >= THRESHOLD) lag++;
  if (lag > maxLag) return null;
  while (lag < maxLag && cmnd[lag + 1] < cmnd[lag]) lag++;
  // A parabola through the dip and its neighbours finds the period between samples.
  const [a, b, c] = [cmnd[lag - 1], cmnd[lag], cmnd[lag + 1] ?? cmnd[lag]];
  const bend = a - 2 * b + c;
  const exact = bend > 0 ? lag + (a - c) / (2 * bend) : lag;
  return sampleRate / exact;
}

export const hzToMidi = (hz: number) => 69 + 12 * Math.log2(hz / 440);

/** "A3", "C#4": the note name of a MIDI number, octave as in scientific pitch. */
export const midiName = (midi: number) => `${NOTES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;

export type VoiceRange = { low: number; high: number };

const HELD = 3; // readings of one note before it counts: a sung note, not a blip or an octave slip
const ENOUGH = 15;

/** The lowest and highest notes held for a moment in a run of pitch readings (MIDI, fractional), or null if too little was sung. */
export function voiceRange(readings: readonly number[]): VoiceRange | null {
  if (readings.length < ENOUGH) return null;
  const counts = new Map<number, number>();
  for (const r of readings) counts.set(Math.round(r), (counts.get(Math.round(r)) ?? 0) + 1);
  const held = [...counts].filter(([, n]) => n >= HELD).map(([note]) => note);
  if (held.length < 2) return null;
  return { low: Math.min(...held), high: Math.max(...held) };
}

// shortcut: assumes every melody runs a fourth below the tonic to an octave above it; read the real melody once songs store one.
const BELOW = 5;
const ABOVE = 12;

/**
 * The transpose (−6 to +5 semitones) that puts the song's assumed melody inside `range`, sounding `tonic` as a pitch class.
 * `over` is how many semitones the melody still spills past the voice (0 when it fits). Ties go to the most centred, then the smallest move.
 */
export function suggestShift({ tonic, range }: { tonic: number; range: VoiceRange }): { shift: number; over: number } {
  let best = { shift: 0, over: Infinity, offCentre: Infinity };
  for (let shift = -6; shift <= 5; shift++)
    for (let octave = 1; octave <= 8; octave++) {
      const t = tonic + shift + 12 * octave;
      const over = Math.max(0, range.low - (t - BELOW)) + Math.max(0, t + ABOVE - range.high);
      const offCentre = Math.max(0, Math.abs(t + (ABOVE - BELOW) / 2 - (range.low + range.high) / 2) - 1.5);
      const better = over < best.over || (over === best.over && (offCentre < best.offCentre || (offCentre === best.offCentre && Math.abs(shift) < Math.abs(best.shift))));
      if (better) best = { shift, over, offCentre };
    }
  return { shift: best.shift, over: best.over };
}
