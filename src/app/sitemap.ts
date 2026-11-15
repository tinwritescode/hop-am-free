import type { MetadataRoute } from "next";
import { searchSummaries } from "@/db/songs";
import { tally } from "@/lib/catalog";
import { siteOrigin } from "@/lib/site";
import { DEFAULT_QUERY, hrefWith, LIST_PATH } from "@/lib/song-list";

// Read from the database on each request (crawlers ask rarely), so new songs appear without a deploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin() ?? "http://localhost:3000";
  const songs = await searchSummaries("");
  const paths = [
    "/",
    LIST_PATH,
    "/ca-si",
    ...songs.map((s) => `${LIST_PATH}/${s.slug}`),
    ...tally(songs.flatMap((s) => s.artists)).map((a) => hrefWith(DEFAULT_QUERY, { artist: a.name })),
  ];
  return paths.map((path) => ({ url: new URL(path, origin).href }));
}
