import { describe, expect, it } from "vitest";
import { detectPitch, hzToMidi, midiName, suggestShift, voiceRange } from "./voice";

const RATE = 44100;
const wave = ({ hz, harmonics = [1] }: { hz: number; harmonics?: number[] }) =>
  Float32Array.from({ length: 2048 }, (_, i) => harmonics.reduce((sum, amp, h) => sum + amp * 0.3 * Math.sin((2 * Math.PI * hz * (h + 1) * i) / RATE), 0));

describe("detectPitch", () => {
  it.each([110, 220, 440, 660])("hears a %d Hz tone", (hz) => {
    expect(detectPitch({ samples: wave({ hz }), sampleRate: RATE })).toBeCloseTo(hz, -0.5);
  });

  it("hears the fundamental of a voice-like tone, not its louder overtone", () => {
    expect(detectPitch({ samples: wave({ hz: 196, harmonics: [0.6, 1, 0.5, 0.3] }), sampleRate: RATE })).toBeCloseTo(196, -0.5);
  });

  it("hears nothing in silence", () => {
    expect(detectPitch({ samples: new Float32Array(2048), sampleRate: RATE })).toBeNull();
  });
});

describe("notes", () => {
  it("names a frequency as a note", () => {
    expect(hzToMidi(440)).toBeCloseTo(69);
    expect(midiName(57)).toBe("A3");
    expect(midiName(61)).toBe("C#4");
  });
});

describe("voiceRange", () => {
  it("spans the notes held for a moment, dropping stray blips", () => {
    const notes = [30, ...Array.from({ length: 45 }, (_, i) => 50 + (i % 15) + 0.2), 90, 91];
    expect(voiceRange(notes)).toEqual({ low: 50, high: 64 });
  });

  it("needs enough sung notes", () => {
    expect(voiceRange([50, 52, 55])).toBeNull();
  });
});

describe("suggestShift", () => {
  // A melody is taken to run from a fourth below the tonic to an octave above it.
  it("keeps the key when the song already fits", () => {
    expect(suggestShift({ tonic: 9, range: { low: 52, high: 69 } })).toEqual({ shift: 0, over: 0 }); // A: melody E3–A4
  });

  it("moves the key into the singer's range", () => {
    expect(suggestShift({ tonic: 9, range: { low: 47, high: 64 } })).toEqual({ shift: -5, over: 0 }); // to E: melody B2–E4
  });

  it("says how far the song still overflows a narrow voice", () => {
    expect(suggestShift({ tonic: 0, range: { low: 55, high: 67 } }).over).toBe(5);
  });
});
