// Song summaries for the home page and the /bai-hat list: one compact row per song, plus the home page's picks.
import { chordsInOrder, type ChordSheet, type Token } from "@hopamfree/core/chordsheet";
import type { Song } from "./song";
import { fold } from "@hopamfree/core/text";

export type SongSummary = Pick<Song, "slug" | "title" | "artist" | "key" | "rhythm"> & {
  /** Each singer on their own (see artistsOf); `artist` keeps the text as stored, for display. */
  artists: string[];
  /** Each chord once, in order of first use. */
  chords: string[];
  /** The opening sung line with its chords, for the one-line preview. */
  snippet: Token[];
};

/** `param` is the value of `?sap-xep=` on /bai-hat. */
export const SORTS = [
  { id: "new", label: "Mới đăng", param: "moi" },
  { id: "fewest", label: "Ít hợp âm nhất", param: "it-hop-am" },
  { id: "az", label: "A–Z", param: "a-z" },
] as const;
export type SortKey = (typeof SORTS)[number]["id"];

/** First line that is sung and has chords; else the first sung line; else the first line at all. */
export function firstLyricLine(sheet: ChordSheet): Token[] {
  const lines = sheet.flatMap((s) => s.lines);
  const sung = lines.filter((l) => !l.chordOnly && l.tokens.some((t) => t.text !== ""));
  return (sung.find((l) => l.hasChords) ?? sung[0] ?? lines[0])?.tokens ?? [];
}

// Sources write several singers as "A, B", "A & B" or "A Ft. B".
const ARTIST_SEPARATOR = /\s*(?:[,&;]|\s(?:ft|feat)\.?\s)\s*/i;
// What some sources write instead of naming the singers (folded).
const NOT_A_SINGER = new Set(["nhieu tac gia"]);

/** The singers in a song's `artist` text, in order, each once. */
export function artistsOf(artist: string): string[] {
  const names = artist
    .split(ARTIST_SEPARATOR)
    .map((n) => n.trim())
    .filter((n) => n !== "" && !NOT_A_SINGER.has(fold(n)));
  return [...new Set(names)];
}

export function summarize(song: Pick<Song, "slug" | "title" | "artist" | "key" | "rhythm" | "sheet">): SongSummary {
  const { sheet, ...rest } = song;
  return { ...rest, artists: artistsOf(song.artist), chords: chordsInOrder(sheet), snippet: firstLyricLine(sheet) };
}

export function isPlayable({ chords, known }: { chords: readonly string[]; known: ReadonlySet<string> }): boolean {
  return known.size > 0 && chords.every((c) => known.has(c));
}

const collator = new Intl.Collator("vi");

/** Input is newest first (as the database returns it), so "new" keeps the order. */
export function sortSongs({ songs, by }: { songs: readonly SongSummary[]; by: SortKey }): SongSummary[] {
  const copy = [...songs];
  switch (by) {
    case "new":
      return copy;
    case "fewest":
      return copy.sort((a, b) => a.chords.length - b.chords.length || collator.compare(a.title, b.title));
    case "az":
      return copy.sort((a, b) => collator.compare(a.title, b.title));
    default: {
      const _exhaustive: never = by;
      return _exhaustive;
    }
  }
}

export type Tally = { name: string; count: number };

/** Non-empty values with how often they occur, most common first, ties by name. */
export function tally(values: readonly string[]): Tally[] {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || collator.compare(a.name, b.name));
}

/** The chords most songs use, for the "known chords" picker. */
export function commonChords({ songs, limit }: { songs: readonly SongSummary[]; limit: number }): string[] {
  return tally(songs.flatMap((s) => s.chords))
    .slice(0, limit)
    .map((t) => t.name);
}

/** Fewest distinct chords first (newest first on ties), taking one song per artist before any artist gets a second. */
export function easySongs({ songs, limit }: { songs: readonly SongSummary[]; limit: number }): SongSummary[] {
  const byEase = [...songs].sort((a, b) => a.chords.length - b.chords.length);
  const seen = new Set<string>();
  const first: SongSummary[] = [];
  const rest: SongSummary[] = [];
  for (const s of byEase) {
    if (seen.has(s.artist)) rest.push(s);
    else {
      seen.add(s.artist);
      first.push(s);
    }
  }
  return [...first, ...rest].slice(0, limit);
}

export const HOME_SIZES = { artists: 8, quick: 4, newest: 8, easy: 6, rhythms: 6, chips: 9 };

/** Everything the home page shows, picked from all songs (newest first). A duet counts for each of its singers. */
export function homeSections({ songs, sizes = HOME_SIZES }: { songs: readonly SongSummary[]; sizes?: typeof HOME_SIZES }) {
  const artists = tally(songs.flatMap((s) => s.artists));
  const rhythms = tally(songs.map((s) => s.rhythm));
  return {
    total: songs.length,
    artistCount: artists.length,
    rhythmCount: rhythms.length,
    artists: artists.slice(0, sizes.artists),
    quick: artists.slice(0, sizes.quick).map((a) => a.name),
    newest: songs.slice(0, sizes.newest),
    easy: easySongs({ songs, limit: sizes.easy }),
    rhythms: rhythms.slice(0, sizes.rhythms),
    chips: commonChords({ songs, limit: sizes.chips }),
  };
}
export type HomeSections = ReturnType<typeof homeSections>;

/** The letter in an artist's avatar circle. */
export function initialOf(name: string): string {
  return [...name.trim()][0]?.toUpperCase() ?? "?";
}

export const ARTIST_TONES = 4;
/** A stable colour slot (0..3) for an artist's avatar, so the same artist looks the same on every page. */
export function artistTone(name: string): number {
  let sum = 0;
  for (const ch of name) sum += ch.codePointAt(0) ?? 0;
  return sum % ARTIST_TONES;
}
