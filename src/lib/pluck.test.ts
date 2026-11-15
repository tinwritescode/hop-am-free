import { describe, expect, it } from "vitest";
import { pluckSamples } from "./pluck";

describe("pluckSamples", () => {
  const sampleRate = 8000;
  const energy = (s: Float32Array) => s.reduce((sum, x) => sum + x * x, 0);
  it("rings at the note's pitch and dies away", () => {
    const samples = pluckSamples({ midi: 57, sampleRate, seconds: 2 }); // A3, 220 Hz
    expect(samples.length).toBe(16000);
    const tenth = samples.length / 10;
    expect(energy(samples.subarray(-tenth))).toBeLessThan(energy(samples.subarray(0, tenth)) / 20);
    // One period of 220 Hz is ~36 samples: the wave repeats itself there, not half a period later.
    const window = samples.subarray(800, 1600);
    const lagCorrelation = (lag: number) => window.subarray(0, 700).reduce((s, x, i) => s + x * window[i + lag], 0);
    expect(lagCorrelation(36)).toBeGreaterThan(lagCorrelation(18));
  });
});
