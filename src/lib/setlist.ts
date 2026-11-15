// A setlist: songs in the order a group will sing them. It lives in the link (?b= on the list page, ?ds= on a song),
// so sharing it needs no account and no database.
import { LIST_PATH } from "./song-list";

export const SETLIST_PATH = "/danh-sach";
export const SETLIST_MAX = 30;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The slugs in a `?b=` or `?ds=` value, in order: unknown shapes and repeats dropped, at most SETLIST_MAX. */
export function parseSetlist(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const slugs = (value ?? "").split(",").map((s) => s.trim());
  return [...new Set(slugs.filter((s) => s.length <= 100 && SLUG.test(s)))].slice(0, SETLIST_MAX);
}

/** The shareable page of the whole list. */
export const setlistHref = (slugs: readonly string[]) => `${SETLIST_PATH}?b=${slugs.join(",")}`;

/** A song opened from the list, so its page can step to the songs before and after it (and, with `present`, open the projector). */
export const setlistSongHref = ({ slug, slugs, present = false }: { slug: string; slugs: readonly string[]; present?: boolean }) =>
  `${LIST_PATH}/${slug}?ds=${slugs.join(",")}${present ? "&trinh-chieu=1" : ""}`;

export type SetlistPlace = { index: number; total: number; prev: string | null; next: string | null };

export function whereInSetlist({ slugs, slug }: { slugs: readonly string[]; slug: string }): SetlistPlace | null {
  const index = slugs.indexOf(slug);
  if (index < 0) return null;
  return { index, total: slugs.length, prev: slugs[index - 1] ?? null, next: slugs[index + 1] ?? null };
}

export type SetlistLink = { title: string; href: string; presentHref: string };
/** What a song page opened from a list shows: where it is, and the way to the songs either side and back to the list. */
export type SetlistNav = { index: number; total: number; listHref: string; prev: SetlistLink | null; next: SetlistLink | null };

export function setlistNav({ slugs, slug, titles }: { slugs: readonly string[]; slug: string; titles: ReadonlyMap<string, string> }): SetlistNav | null {
  const place = whereInSetlist({ slugs, slug });
  if (!place) return null;
  const link = (to: string | null): SetlistLink | null => {
    const title = to && titles.get(to);
    return to && title ? { title, href: setlistSongHref({ slug: to, slugs }), presentHref: setlistSongHref({ slug: to, slugs, present: true }) } : null;
  };
  return { index: place.index, total: place.total, listHref: setlistHref(slugs), prev: link(place.prev), next: link(place.next) };
}
