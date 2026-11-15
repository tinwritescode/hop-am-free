import { describe, expect, it } from "vitest";
import { isAppleTouch, silentWav } from "./audio-unlock";

describe("silentWav", () => {
  it("writes a valid mono 16-bit PCM header followed by silence", () => {
    const bytes = silentWav({ sampleRate: 8000, seconds: 0.5 });
    const view = new DataView(bytes.buffer);
    const text = (from: number) => String.fromCharCode(...bytes.slice(from, from + 4));
    expect(text(0)).toBe("RIFF");
    expect(text(8)).toBe("WAVE");
    expect(text(12)).toBe("fmt ");
    expect(text(36)).toBe("data");
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(8000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(8000);
    expect(view.getUint32(4, true)).toBe(bytes.length - 8);
    expect(bytes.slice(44).every((b) => b === 0)).toBe(true);
  });

  it("never produces an empty data chunk", () => {
    expect(silentWav({ sampleRate: 8000, seconds: 0 }).length).toBe(46);
  });
});

describe("isAppleTouch", () => {
  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)", 5, true],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari", 5, true], // iPadOS
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari", 0, false], // real Mac
    ["Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome", 5, false],
  ])("%s with %i touch points → %s", (userAgent, maxTouchPoints, expected) => {
    expect(isAppleTouch({ userAgent, maxTouchPoints })).toBe(expected);
  });
});
