"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { SongSummary } from "@/lib/catalog";
import { SITE_NAME } from "@/lib/seo";
import { clearedHref, hrefWith, inPageListHref, listSongs, listTitle, parseListQuery } from "@/lib/song-list";
import { Mascot } from "@/components/Mascot";
import { SongRow } from "@/components/home/SongRow";
import { ActiveFilters, FacetList, Pagination, SortTabs } from "./ListParts";
import { PlayableFilter } from "./PlayableFilter";

/** A plain left click on a link the browser can answer itself: filters, sort and pages of the current search. */
function onListClick(e: React.MouseEvent) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target instanceof Element ? e.target.closest("a") : null;
  if (!a || a.target) return;
  const to = inPageListHref({ href: a.href, current: location.href });
  if (to === null) return;
  // Before the link's own handler: the URL changes in place and useSearchParams re-renders the list, no server trip.
  e.preventDefault();
  e.stopPropagation();
  history.pushState(null, "", to);
  scrollTo({ top: 0 });
}

/**
 * /bai-hat: the songs of one search, filtered, sorted and paged in the browser from the URL query. Every control is
 * still a real link, so it works without JavaScript, opens in a new tab and can be shared.
 */
export function SongListView({ songs, common }: { songs: SongSummary[]; common: string[] }) {
  const params = useSearchParams();
  const query = useMemo(() => parseListQuery(Object.fromEntries(params)), [params]);
  const { rows, total, page, pageCount, facets } = useMemo(() => listSongs({ songs, query }), [songs, query]);
  useEffect(() => {
    document.title = `${listTitle(query)} | ${SITE_NAME}`;
  }, [query]);

  return (
    <div onClickCapture={onListClick} className="flex flex-wrap items-start gap-8 pt-5">
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
        <PlayableFilter query={query} common={common} />
        <FacetList id="dieu-dem" title="Điệu đệm" look="rows" items={facets.rhythm} selected={query.rhythm} hrefFor={(rhythm) => hrefWith(query, { rhythm })} />
        <FacetList id="tone" title="Tone" look="chips" items={facets.key} selected={query.key} hrefFor={(key) => hrefWith(query, { key })} />
        <FacetList id="ca-si" title="Ca sĩ" look="rows" items={facets.artist} selected={query.artist} hrefFor={(artist) => hrefWith(query, { artist })} />
      </aside>
    </div>
  );
}
