import type { SongDetail } from "@hopamfree/core/api";
import { getSong } from "@/db/songs";

/** Public read of one song, for the mobile app. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const song = await getSong((await params).slug);
  if (!song) return Response.json({ error: "Không tìm thấy bài hát" }, { status: 404 });
  const { slug, title, artist, composer, key, rhythm, capo, raw } = song;
  const body = { slug, title, artist, composer, key, rhythm, capo: capo?.fret ?? null, sheet: raw } satisfies SongDetail;
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=60" } });
}
