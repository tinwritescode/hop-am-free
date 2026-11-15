import { getSong } from "@/db/songs";
import { SongShareCard } from "@/components/og/ShareCards";
import { ogImage } from "@/lib/og-image";
import { songCard } from "@/lib/seo";

// Drawn on the first request for a (song, version) and kept: `v` is a hash of what the card shows (songOgPath),
// so an edited song links a new path and an old one is never redrawn. Nothing is drawn at build time.
export const dynamic = "force-static";
export const dynamicParams = true;
export const revalidate = false;
export function generateStaticParams(): { slug: string; v: string }[] {
  return [];
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; v: string }> }) {
  const song = await getSong((await params).slug);
  if (!song) return new Response("Không có bài này", { status: 404 });
  return ogImage({ element: <SongShareCard card={songCard(song)} />, cache: "versioned" });
}
