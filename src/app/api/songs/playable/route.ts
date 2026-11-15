import { searchSummaries } from "@/db/songs";
import { DEFAULT_QUERY, listSongs, parseListQuery } from "@/lib/song-list";
import { PLAYABLE_PREVIEW, PlayableResponseSchema, type PlayableResponse } from "@/lib/playable";

/** For the home page's "Chơi được ngay" card: how many songs ?hop-am=Am,C,G can play, and the newest few of them. */
export async function GET(req: Request) {
  const { known } = parseListQuery(Object.fromEntries(new URL(req.url).searchParams));
  if (known.length === 0) return Response.json({ count: 0, songs: [] } satisfies PlayableResponse);
  const { total, rows } = listSongs({ songs: await searchSummaries(""), query: { ...DEFAULT_QUERY, known } });
  const body = PlayableResponseSchema.parse({ count: total, songs: rows.slice(0, PLAYABLE_PREVIEW).map(({ slug, title, artist }) => ({ slug, title, artist })) });
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=60" } });
}
