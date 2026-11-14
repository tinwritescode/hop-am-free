import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSettings } from "./settings";

describe("parseSettings", () => {
  it("keeps valid fields", () => {
    expect(parseSettings({ chordStyle: "inline", fontSize: 22 })).toEqual({ chordStyle: "inline", fontSize: 22 });
  });

  it("falls back per field for junk", () => {
    expect(parseSettings({ chordStyle: "sideways", fontSize: 22 })).toEqual({ chordStyle: "above", fontSize: 22 });
    expect(parseSettings({ chordStyle: "inline", fontSize: 99 })).toEqual({ chordStyle: "inline", fontSize: 18 });
    expect(parseSettings("nope")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
});
