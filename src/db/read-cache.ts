// Song reads cached across requests (Next data cache), and the invalidation every write in the app calls.
import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";

// Writes from outside the app (scripts/backfill-capo.mts, scripts/migrate.mts) cannot invalidate, so entries also expire after an hour.
const MAX_AGE_S = 3600;
const CATALOG_TAG = "songs";
const songTag = (slug: string) => `song:${slug}`;
const rhythmsTag = (songId: number) => `song-rhythms:${songId}`;

/** Cached values go through JSON: return plain rows (a Date comes back as a string). Entries over 2MB are not cached. */
function cachedRead<T>({ key, tag, read }: { key: string[]; tag: string; read: () => Promise<T> }): Promise<T> {
  return unstable_cache(read, key, { tags: [tag], revalidate: MAX_AGE_S })();
}

export const cachedSongRow = <T>({ slug, read }: { slug: string; read: () => Promise<T> }) => cachedRead({ key: ["song", slug], tag: songTag(slug), read });
export const cachedCatalog = <T>(read: () => Promise<T>) => cachedRead({ key: ["catalog"], tag: CATALOG_TAG, read });
export const cachedRhythms = <T>({ songId, read }: { songId: number; read: () => Promise<T> }) =>
  cachedRead({ key: ["song-rhythms", String(songId)], tag: rhythmsTag(songId), read });

/** After a song is created or changed: its page and every list that shows it. */
export function songChanged(slug: string): void {
  revalidateTag(songTag(slug));
  revalidateTag(CATALOG_TAG);
}

export function rhythmsChanged(songId: number): void {
  revalidateTag(rhythmsTag(songId));
}
