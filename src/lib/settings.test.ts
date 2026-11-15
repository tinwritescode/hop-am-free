import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSettings, SettingsSchema } from "./settings";

describe("parseSettings", () => {
  it("keeps valid fields", () => {
    expect(parseSettings({ chordStyle: "inline", fontSize: 22, chordSound: true, voiceRange: { low: 45, high: 64 } })).toEqual({
      chordStyle: "inline",
      fontSize: 22,
      chordSound: true,
      voiceRange: { low: 45, high: 64 },
    });
  });

  it("falls back per field for junk", () => {
    expect(parseSettings({ chordStyle: "sideways", fontSize: 22 })).toEqual({ chordStyle: "above", fontSize: 22, chordSound: false, voiceRange: null });
    expect(parseSettings({ chordStyle: "inline", fontSize: 99, chordSound: "yes", voiceRange: { low: 70, high: 50 } })).toEqual({
      chordStyle: "inline",
      fontSize: 18,
      chordSound: false,
      voiceRange: null,
    });
    expect(parseSettings("nope")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("accepts a save from a page loaded before chord sound and voice range existed", () => {
    expect(SettingsSchema.parse({ chordStyle: "inline", fontSize: 20 })).toEqual({ chordStyle: "inline", fontSize: 20, chordSound: false, voiceRange: null });
  });
});
