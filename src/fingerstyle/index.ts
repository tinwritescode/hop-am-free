// The fingerstyle lessons: songs, each with one or more arrangements written as text tab.
// Adding a song = one file in ./songs plus a line in SONGS; adding a variant = one more entry in `arrangements`.
import type { Difficulty } from "@hopamfree/core/chords";
import type { Tuning } from "@/lib/tuner";
import { badGuy } from "./songs/bad-guy";

export type Arrangement = {
  /** In the URL: /fingerstyle/<song>?ban=<id>. */
  id: string;
  name: string;
  arranger: string;
  difficulty: Difficulty;
  tuning: Tuning["id"];
  /** Capo before the tab says otherwise ("Capo 1" written above a block). */
  capo: number;
  /** Tab columns per second at full speed. Text tab has no rhythm, so this sets the pace of its spacing. */
  columnsPerSecond: number;
  /** Shown above the player: what is special about this version. */
  note?: string;
  video?: string;
  /** The tab as text, "e|--0--|" blocks with [Section] headers; lines that are not tab are ignored. */
  tab: string;
};

export type FingerstyleSong = { slug: string; title: string; artist: string; arrangements: readonly [Arrangement, ...Arrangement[]] };

export { FINGERSTYLE_PATH } from "./path";

export const SONGS: readonly FingerstyleSong[] = [badGuy];

export const songBySlug = (slug: string) => SONGS.find((s) => s.slug === slug) ?? null;

/** The arrangement named in the URL, or the song's first. */
export const arrangementOf = ({ song, id }: { song: FingerstyleSong; id: string | undefined }) => song.arrangements.find((a) => a.id === id) ?? song.arrangements[0];
