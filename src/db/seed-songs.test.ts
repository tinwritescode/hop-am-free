import { describe, expect, it } from "vitest";
import { SongDraftSchema, unknownChords } from "@/lib/song";
import { SEED_SONGS } from "./seed-songs";

describe("seeded songs", () => {
  it.each(SEED_SONGS.map((s) => [s.slug, s] as const))("%s: valid draft and every chord has a diagram", (_, song) => {
    expect(SongDraftSchema.safeParse(song).success).toBe(true);
    expect(unknownChords(song.sheet)).toEqual([]);
  });
});
