import { ensureSongRhythms } from "@/db/rhythms";
import { getSong } from "@/db/songs";

// Only existing songs reach the model, and each song asks at most once (results are stored), so this is not an open AI proxy.
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const song = await getSong((await params).slug);
  if (!song) return Response.json({ error: "Không tìm thấy bài hát" }, { status: 404 });
  try {
    return Response.json({ rhythms: await ensureSongRhythms(song) });
  } catch (err) {
    console.error("rhythm suggestion failed", { slug: song.slug, err: err instanceof Error ? err.message : String(err) });
    return Response.json({ error: "Mầm chưa chọn được điệu, thử lại sau nhé" }, { status: 502 });
  }
}
