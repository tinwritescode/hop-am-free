import type { Catalog } from "@hopamfree/core/api";
import { searchSummaries } from "@/db/songs";
import { tally } from "@/lib/catalog";

/** The whole song list for the mobile app, newest first, with the singer tally the /ca-si page shows. */
export async function GET() {
  const songs = await searchSummaries("");
  const body = {
    songs: songs.map(({ slug, title, artist, artists, key }) => ({ slug, title, artist, artists, key })),
    artists: tally(songs.flatMap((s) => s.artists)),
  } satisfies Catalog;
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=60" } });
}
