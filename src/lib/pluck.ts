// The sound of a guitar string, synthesized so the site ships no audio files.

const FADE_SECONDS = 2.5; // until a string has faded by 60 dB

/**
 * A plucked string by Karplus-Strong: a burst of noise fed around a delay line one period long, averaged on each pass,
 * so the high harmonics die first and the note fades like a real string.
 */
export function pluckSamples({ midi, sampleRate, seconds }: { midi: number; sampleRate: number; seconds: number }): Float32Array<ArrayBuffer> {
  const freq = 440 * 2 ** ((midi - 69) / 12);
  const period = Math.max(2, Math.round(sampleRate / freq));
  const loss = 0.001 ** (1 / (FADE_SECONDS * freq)); // per pass round the loop
  const out = new Float32Array(Math.round(sampleRate * seconds));
  let soft = 0;
  for (let i = 0; i < Math.min(period, out.length); i++) {
    soft = 0.6 * soft + 0.4 * (Math.random() * 2 - 1); // a softened noise burst sounds like a pick, not a scrape
    out[i] = soft;
  }
  for (let i = period; i < out.length; i++) out[i] = loss * 0.5 * (out[i - period] + out[Math.max(0, i - period - 1)]);
  return out;
}
