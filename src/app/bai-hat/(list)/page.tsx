// In the (list) group so its loading.tsx covers only /bai-hat: in bai-hat/ it would also wrap /bai-hat/[slug].
import type { Metadata } from "next";
import Link from "next/link";
import { searchSummaries } from "@/db/songs";
import { commonChords } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { clearedHref, hrefWith, indexableListHref, listSongs, parseListQuery } from "@/lib/song-list";
import { Mascot } from "@/components/Mascot";
import { SongRow } from "@/components/home/SongRow";
import { ActiveFilters, FacetList, Pagination, SortTabs } from "@/components/list/ListParts";
import { PlayableFilter } from "@/components/list/PlayableFilter";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = parseListQuery(await searchParams);
  const { q, artist, rhythm } = query;
  const title = q ? `Tìm “${q}”` : artist ? `Hợp âm các bài của ${artist}` : rhythm ? `Hợp âm các bài điệu ${rhythm}` : "Tất cả bài hát";
  const description = artist
    ? `Hợp âm guitar các bài của ${artist}: lời và thế bấm trên cùng một màn hình.`
    : rhythm
      ? `Hợp âm guitar các bài điệu ${rhythm}, kèm lời và thế bấm.`
      : "Tất cả bài hát có hợp âm guitar trên Hợp Âm Free, lọc theo ca sĩ, điệu, tone và hợp âm bạn đã biết.";
  return pageMeta({ title, description, path: indexableListHref(query) });
}

export default async function SongList({ searchParams }: Props) {
  const query = parseListQuery(await searchParams);
  const songs = await searchSummaries(query.q);
  const { rows, total, page, pageCount, facets } = listSongs({ songs, query });

  return (
    <div className="flex flex-wrap items-start gap-8 pt-5">
      <main className="min-w-0 flex-[999_1_560px]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h1 className="font-serif text-[26px] font-normal">{query.q ? `Kết quả cho “${query.q}”` : "Bài hát"}</h1>
          <p className="flex items-center gap-3 text-sm text-soft">
            <span>
              {total} bài{pageCount > 1 && ` · trang ${page}/${pageCount}`}
            </span>
            <a href="#bo-loc" className="flex min-h-11 items-center font-semibold lg:hidden">
              Bộ lọc ↓
            </a>
          </p>
        </div>
        <ActiveFilters query={query} />
        <SortTabs query={query} />
        {rows.length === 0 ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-4 text-sm text-soft">
            <Mascot size={52} />
            {songs.length === 0 ? "Mầm chưa tìm thấy bài nào. Thử tên khác, hoặc gõ không dấu." : "Không có bài nào khớp bộ lọc."}
            <Link href={clearedHref(query)} className="flex min-h-11 items-center font-semibold">
              Xem tất cả bài
            </Link>
          </div>
        ) : (
          <ul>
            {rows.map((s) => (
              <SongRow key={s.slug} song={s} />
            ))}
          </ul>
        )}
        <Pagination query={query} page={page} pageCount={pageCount} />
      </main>

      <aside id="bo-loc" aria-label="Bộ lọc" className="flex min-w-0 flex-[1_1_240px] scroll-mt-4 flex-col gap-6 text-sm">
        <PlayableFilter query={query} common={commonChords({ songs, limit: 12 })} />
        <FacetList id="dieu-dem" title="Điệu đệm" look="rows" items={facets.rhythm} selected={query.rhythm} hrefFor={(rhythm) => hrefWith(query, { rhythm })} />
        <FacetList id="tone" title="Tone" look="chips" items={facets.key} selected={query.key} hrefFor={(key) => hrefWith(query, { key })} />
        <FacetList id="ca-si" title="Ca sĩ" look="rows" items={facets.artist} selected={query.artist} hrefFor={(artist) => hrefWith(query, { artist })} />
      </aside>
    </div>
  );
}
