// In the (list) group so its loading.tsx covers only /bai-hat: in bai-hat/ it would also wrap /bai-hat/[slug].
import type { Metadata } from "next";
import { searchSummaries } from "@/db/songs";
import { commonChords } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { indexableListHref, listTitle, parseListQuery } from "@/lib/song-list";
import { SongListView } from "@/components/list/SongListView";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = parseListQuery(await searchParams);
  const { artist, rhythm } = query;
  const title = listTitle(query);
  const description = artist
    ? `Hợp âm guitar các bài của ${artist}: lời và thế bấm trên cùng một màn hình.`
    : rhythm
      ? `Hợp âm guitar các bài điệu ${rhythm}, kèm lời và thế bấm.`
      : "Tất cả bài hát có hợp âm guitar trên Hợp Âm Free, lọc theo ca sĩ, điệu, tone và hợp âm bạn đã biết.";
  return pageMeta({ title, description, path: indexableListHref(query) });
}

/** The server runs the search; the browser filters, sorts and pages its result (see SongListView). */
export default async function SongList({ searchParams }: Props) {
  const query = parseListQuery(await searchParams);
  const songs = await searchSummaries(query.q);
  return <SongListView songs={songs} common={commonChords({ songs, limit: 12 })} />;
}
