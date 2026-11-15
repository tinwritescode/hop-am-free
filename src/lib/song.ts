import { z } from "zod";
import { chordsInOrder, parseChordSheet, type ChordSheet } from "./chordsheet";
import { lookupChord } from "./chords";
import { capoColumns, capoFromColumns, CapoDraftSchema, type Capo, type CapoColumns } from "./capo";
import { fold } from "./text";

/** What an admin fills in (or an import pre-fills) to create a song. */
export const SongDraftSchema = z.object({
  title: z.string().trim().min(1).max(120),
  artist: z.string().trim().min(1).max(120),
  composer: z.string().trim().max(120).default(""),
  key: z
    .string()
    .trim()
    .regex(/^[A-G][#b]?m?$/, "Tone dạng C, Am, F#m, Bb…"),
  genre: z.string().trim().max(60).default(""),
  rhythm: z.string().trim().max(60).default(""),
  sheet: z
    .string()
    .trim()
    .min(1)
    .max(20_000)
    .refine((s) => /\[[^\]]+\]/.test(s), "Bản nhạc cần có ít nhất một hợp âm dạng [C]"),
  sourceUrl: z.url().nullable().default(null),
  capo: CapoDraftSchema,
});
export type SongDraft = z.infer<typeof SongDraftSchema>;

export type NewSong = SongDraft & { slug: string; contributor: string };

export type Song = Omit<NewSong, "sheet" | "capo"> & { id: number; sheet: ChordSheet; raw: string; capo: Capo | null };

/** A `songs` row as the database returns it; capo columns become `capo`, other columns pass through. */
type SongRow = Omit<NewSong, "capo"> & { id: number; capo: number | null; capoSource: string | null };

export function toSong(row: SongRow): Song {
  const { capo, capoSource, sheet, ...rest } = row;
  return { ...rest, raw: sheet, sheet: parseChordSheet(sheet), capo: capoFromColumns({ capo, capoSource }) };
}

/** The column values to insert for a new song. */
export function songColumns<T extends { capo: Capo | null }>(song: T): Omit<T, "capo"> & CapoColumns {
  const { capo, ...rest } = song;
  return { ...rest, ...capoColumns(capo) };
}

export function slugify(title: string): string {
  return (
    fold(title)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "bai-hat"
  );
}

/** Chords in the sheet that have no diagram, so the editor can fix them before saving. */
export function unknownChords(raw: string): string[] {
  return chordsInOrder(parseChordSheet(raw)).filter((c) => lookupChord(c) === null);
}
