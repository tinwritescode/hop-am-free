// The /bai-hat song list: its state lives in the URL query, so every view is a shareable link and the back button works.
import { z } from "zod";
import { artistsOf, isPlayable, sortSongs, SORTS, tally, type SongSummary, type SortKey, type Tally } from "./catalog";

export const PAGE_SIZE = 30;
/** Facet lists (rhythm, key, artist) show this many before "Xem thêm". */
export const FACET_TOP = 8;
export const LIST_PATH = "/bai-hat";

/** A song page (/bai-hat/<slug>), which uses the full window width on desktop. */
export function isSongPath(pathname: string): boolean {
  return /^\/bai-hat\/[^/]+$/.test(pathname);
}

export type ListQuery = {
  /** Search text; empty for none. */
  q: string;
  sort: SortKey;
  rhythm: string | null;
  key: string | null;
  artist: string | null;
  /** The visitor's known chords; non-empty keeps only songs playable with them ("chơi được ngay"). */
  known: string[];
  page: number;
};

export const DEFAULT_QUERY: ListQuery = { q: "", sort: "new", rhythm: null, key: null, artist: null, known: [], page: 1 };

/** URL param for each field. */
const PARAM = { q: "q", sort: "sap-xep", rhythm: "dieu", key: "tone", artist: "ca-si", known: "hop-am", page: "trang" } as const;

const CHORD = /^[A-G][#b]?[^\s,<>]{0,12}$/;
const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
const Name = z.preprocess(first, z.string().trim().min(1).max(120)).nullable().catch(null);

const QuerySchema = z.object({
  [PARAM.q]: z.preprocess(first, z.string().trim().max(120)).catch(""),
  [PARAM.sort]: z
    .preprocess(first, z.string())
    .catch("")
    .transform((p): SortKey => SORTS.find((s) => s.param === p)?.id ?? "new"),
  [PARAM.rhythm]: Name,
  [PARAM.key]: Name,
  [PARAM.artist]: Name,
  [PARAM.known]: z
    .preprocess(first, z.string().max(600))
    .catch("")
    .transform((v) => [...new Set(v.split(",").map((c) => c.trim()))].filter((c) => CHORD.test(c)).slice(0, 60)),
  [PARAM.page]: z.preprocess(first, z.coerce.number().int().min(1).max(100_000)).catch(1),
});

/** Next's `searchParams` (or `Object.fromEntries(url.searchParams)`). A bad value falls back to its default, never an error. */
export function parseListQuery(raw: Record<string, string | string[] | undefined>): ListQuery {
  const p = QuerySchema.parse(raw);
  return { q: p[PARAM.q], sort: p[PARAM.sort], rhythm: p[PARAM.rhythm], key: p[PARAM.key], artist: p[PARAM.artist], known: p[PARAM.known], page: p[PARAM.page] };
}

/** The link for a list view; default values are left out. */
export function listHref(query: ListQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set(PARAM.q, query.q);
  if (query.sort !== DEFAULT_QUERY.sort) params.set(PARAM.sort, SORTS.find((s) => s.id === query.sort)?.param ?? "");
  if (query.rhythm) params.set(PARAM.rhythm, query.rhythm);
  if (query.key) params.set(PARAM.key, query.key);
  if (query.artist) params.set(PARAM.artist, query.artist);
  if (query.known.length) params.set(PARAM.known, query.known.join(","));
  if (query.page > 1) params.set(PARAM.page, String(query.page));
  const qs = params.toString();
  return qs ? `${LIST_PATH}?${qs}` : LIST_PATH;
}

/**
 * The canonical link of a list view worth a search result (all songs, one artist or one rhythm, any page),
 * or null for searches and narrow or personal filters, which stay out of the index.
 */
export function indexableListHref(query: ListQuery): string | null {
  const narrow = query.q || query.key || query.known.length > 0 || query.sort !== DEFAULT_QUERY.sort || (query.artist && query.rhythm);
  return narrow ? null : listHref(query);
}

/** Known chords as they go into `?hop-am=`: sorted, so the same set is always the same link. */
export function knownParam(known: ReadonlySet<string>): string[] {
  return [...known].sort();
}

/** A changed view starts again at page 1, unless the change is the page. */
export function hrefWith(query: ListQuery, patch: Partial<ListQuery>): string {
  return listHref({ ...query, page: 1, ...patch });
}

/** The same view with every filter and the search removed (the sort stays). */
export function clearedHref(query: ListQuery): string {
  return listHref({ ...DEFAULT_QUERY, sort: query.sort });
}

/** Search lives on the list: an old home search link (/?q=…) goes to /bai-hat?q=…, or null to serve the request as is. */
export function legacySearchRedirect(url: URL): URL | null {
  if (url.pathname !== "/") return null;
  const { q } = parseListQuery({ [PARAM.q]: url.searchParams.get(PARAM.q) ?? undefined });
  return q ? new URL(hrefWith(DEFAULT_QUERY, { q }), url) : null;
}

/** `artists`: the singers a song must all have; a pre-split link (`?ca-si=A, B`) names several. */
type Filters = Pick<ListQuery, "rhythm" | "key"> & { artists: readonly string[] | null; known: ReadonlySet<string> };
type Facet = "rhythm" | "key" | "artist";

function matches({ song, filters, skip }: { song: SongSummary; filters: Filters; skip?: Facet }): boolean {
  return (
    (skip === "rhythm" || filters.rhythm === null || song.rhythm === filters.rhythm) &&
    (skip === "key" || filters.key === null || song.key === filters.key) &&
    (skip === "artist" || filters.artists === null || (filters.artists.length > 0 && filters.artists.every((a) => song.artists.includes(a)))) &&
    (filters.known.size === 0 || isPlayable({ chords: song.chords, known: filters.known }))
  );
}

export type ListResult = {
  rows: SongSummary[];
  /** Songs matching all filters, over all pages. */
  total: number;
  page: number;
  pageCount: number;
  /** Each facet counted over the songs that match the other filters. */
  facets: Record<Facet, Tally[]>;
};

/** Filters, sorts and cuts out one page. `songs` is the search result, newest first. */
export function listSongs({ songs, query }: { songs: readonly SongSummary[]; query: ListQuery }): ListResult {
  const filters: Filters = { rhythm: query.rhythm, key: query.key, artists: query.artist === null ? null : artistsOf(query.artist), known: new Set(query.known) };
  const valuesOf = (song: SongSummary, f: Facet) => (f === "artist" ? song.artists : [song[f]]);
  const facet = (f: Facet) => tally(songs.filter((song) => matches({ song, filters, skip: f })).flatMap((s) => valuesOf(s, f)));
  const shown = sortSongs({ songs: songs.filter((song) => matches({ song, filters })), by: query.sort });
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  return {
    rows: shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: shown.length,
    page,
    pageCount,
    facets: { rhythm: facet("rhythm"), key: facet("key"), artist: facet("artist") },
  };
}

/** Page links to show: first, last, and the current page with its neighbours; "gap" where pages are left out. */
export function pageItems({ page, pageCount }: { page: number; pageCount: number }): (number | "gap")[] {
  const keep = [...new Set([1, page - 1, page, page + 1, pageCount])].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  for (const p of keep) {
    const prev = items.at(-1);
    if (typeof prev === "number" && p - prev === 2) items.push(prev + 1);
    else if (typeof prev === "number" && p - prev > 2) items.push("gap");
    items.push(p);
  }
  return items;
}
