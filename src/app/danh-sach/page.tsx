import type { Metadata } from "next";
import { searchSummaries } from "@/db/songs";
import { pageMeta } from "@/lib/seo";
import { parseSetlist } from "@/lib/setlist";
import { PageHeading } from "@/components/site/PageHeading";
import { MySetlist, SharedSetlist } from "@/components/setlist/Setlists";

type Props = { searchParams: Promise<{ b?: string | string[] }> };

// Each link is someone's own list, so none is indexed.
export const metadata: Metadata = pageMeta({
  title: "Danh sách bài hát",
  description: "Xếp các bài cho buổi sinh hoạt, gửi một link cho cả nhóm, bấm “Bài tiếp” để sang bài sau.",
  path: null,
});

/** `?b=slug,slug` is a list someone shared; without it, the visitor's own list from this browser. */
export default async function SetlistPage({ searchParams }: Props) {
  const slugs = parseSetlist((await searchParams).b);
  const shared = slugs.length > 0;
  const bySlug = shared ? new Map((await searchSummaries("")).map((s) => [s.slug, s])) : null;
  const songs = slugs.flatMap((slug) => {
    const s = bySlug?.get(slug);
    return s ? [{ slug, title: s.title, artist: s.artist, songKey: s.key }] : [];
  });
  return (
    <main className="mx-auto max-w-2xl pb-16">
      <PageHeading title={shared ? "Danh sách được chia sẻ" : "Danh sách của bạn"}>
        {shared ? `${songs.length} bài, hát theo thứ tự này.` : "Xếp bài cho buổi sinh hoạt, rồi gửi một link cho cả nhóm."}
      </PageHeading>
      {shared ? <SharedSetlist songs={songs} /> : <MySetlist />}
    </main>
  );
}
