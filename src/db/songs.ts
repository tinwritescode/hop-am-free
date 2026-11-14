import "server-only";
import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from ".";
import { songs } from "./schema";
import { slugify, toSong, type Song, type SongDraft } from "@/lib/song";
import { chordsInOrder } from "@/lib/chordsheet";
import { fold } from "@/lib/text";

/** Deduped per request, so metadata and the page share one query. */
export const getSong = cache(async (slug: string): Promise<Song | null> => {
  const [row] = await db().select().from(songs).where(eq(songs.slug, slug));
  return row ? toSong(row) : null;
});

// shortcut: loads every song so search can match folded text and chord names in JS; move search into SQL past a few thousand songs.
/** Newest first. Matches title/artist/composer without diacritics, or an exact chord name; empty query returns all. */
export async function searchSongs(query: string): Promise<Song[]> {
  const needle = fold(query.trim());
  const all = (await db().select().from(songs).orderBy(desc(songs.createdAt))).map(toSong);
  if (!needle) return all;
  return all.filter((s) => fold(`${s.title} ${s.artist} ${s.composer}`).includes(needle) || chordsInOrder(s.sheet).some((c) => fold(c) === needle));
}

export async function findBySourceUrl(url: string): Promise<{ slug: string } | null> {
  const [row] = await db().select({ slug: songs.slug }).from(songs).where(eq(songs.sourceUrl, url));
  return row ?? null;
}

export async function createSong({ draft, contributor, createdBy }: { draft: SongDraft; contributor: string; createdBy: string }): Promise<Song> {
  const base = slugify(draft.title);
  for (let n = 1; n <= 50; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const [row] = await db()
      .insert(songs)
      .values({ ...draft, slug, contributor, createdBy })
      .onConflictDoNothing({ target: songs.slug })
      .returning();
    if (row) return toSong(row);
  }
  throw new Error(`no free slug for ${base}`);
}
