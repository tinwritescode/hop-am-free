import type { Metadata } from "next";
import { searchSummaries } from "@/db/songs";
import { tally } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { ArtistCard } from "@/components/home/ArtistCard";

export const metadata: Metadata = pageMeta({ title: "Ca sĩ", description: "Tất cả ca sĩ trên Hợp Âm Free, kèm số bài có hợp âm.", path: "/ca-si" });

export default async function Artists() {
  // Names are shown as stored: a band under two spellings or a duet ("A, B") is its own entry.
  const artists = tally((await searchSummaries("")).flatMap((s) => s.artists));
  return (
    <main className="pt-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-serif text-[26px] font-normal">Ca sĩ</h1>
        <p className="text-sm text-soft">{artists.length} ca sĩ · nhiều bài nhất trước</p>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2.5">
        {artists.map((a) => (
          <li key={a.name} className="min-w-0">
            <ArtistCard artist={a} />
          </li>
        ))}
      </ul>
    </main>
  );
}
