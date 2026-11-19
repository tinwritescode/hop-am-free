import type { SongListResponse } from "@hopamfree/core/api";
import { requestUser } from "@/db/auth";
import { publishSong } from "@/db/publish";
import { searchSongs } from "@/db/songs";

/** Public search, used by the CLI to spot duplicates before importing. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const songs = await searchSongs(q);
  return Response.json({
    songs: songs.slice(0, 50).map((s) => ({ slug: s.slug, title: s.title, artist: s.artist, key: s.key, sourceUrl: s.sourceUrl, path: `/bai-hat/${s.slug}` })),
  } satisfies SongListResponse);
}

export async function POST(req: Request) {
  const res = await publishSong({ user: await requestUser(req), input: await req.json().catch(() => null) });
  if (!res.ok) return Response.json({ error: res.error, slug: res.slug }, { status: res.status });
  return Response.json({ slug: res.song.slug, path: `/bai-hat/${res.song.slug}` }, { status: 201 });
}
