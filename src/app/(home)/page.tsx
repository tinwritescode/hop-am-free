import type { Metadata } from "next";
import Link from "next/link";
import { searchSummaries } from "@/db/songs";
import { homeSections } from "@/lib/catalog";
import { HOME_DESCRIPTION, HOME_TITLE, pageMeta } from "@/lib/seo";
import { DEFAULT_QUERY, hrefWith, LIST_PATH } from "@/lib/song-list";
import { strumGlyph } from "@/lib/strum";
import { ArtistCard, SectionHead } from "@/components/home/ArtistCard";
import { PlayableCard } from "@/components/home/PlayableCard";
import { SongRow } from "@/components/home/SongRow";

// The site name already leads the title, so it skips the "| Hợp Âm Free" template.
export const metadata: Metadata = { ...pageMeta({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/" }), title: { absolute: HOME_TITLE } };

// Search results live on /bai-hat; the middleware sends old /?q= links there (legacySearchRedirect).
export default async function Home() {
  const home = homeSections({ songs: await searchSummaries("") });
  return (
    <div className="flex flex-col gap-10 pt-6">
      <section aria-label="Tìm bài" className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-surface px-6 py-[22px]">
        <form action={LIST_PATH} role="search" className="flex">
          <label htmlFor="home-q" className="sr-only">
            Tìm bài hát
          </label>
          <input
            id="home-q"
            name="q"
            type="search"
            placeholder="Tên bài, ca sĩ, hoặc hợp âm"
            className="h-[54px] min-w-0 flex-auto rounded-l-[10px] border-[1.5px] border-r-0 border-line-strong bg-bg px-4 text-[17px] text-ink placeholder:text-soft"
          />
          <button type="submit" className="fx h-[54px] rounded-r-[10px] bg-accent px-6 text-base font-bold text-on-accent">
            Tìm
          </button>
        </form>
        <p className="flex flex-wrap items-center gap-x-2.5 text-sm text-soft">
          <span>
            {home.total} bài · {home.artistCount} ca sĩ · Hay tìm:
          </span>
          {home.quick.map((name) => (
            <Link key={name} href={hrefWith(DEFAULT_QUERY, { artist: name })} className="flex min-h-11 items-center font-semibold">
              {name}
            </Link>
          ))}
        </p>
      </section>

      <section aria-labelledby="h-artist">
        <SectionHead id="h-artist" title="Ca sĩ" href="/ca-si" more={`Tất cả ${home.artistCount} ca sĩ →`} />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
          {home.artists.map((a) => (
            <ArtistCard key={a.name} artist={a} />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-8">
        <section aria-labelledby="h-new" className="min-w-0 flex-[999_1_540px]">
          <SectionHead id="h-new" title="Mới đăng" href={LIST_PATH} more={`Xem tất cả ${home.total} bài →`} />
          <ul className="border-t border-line">
            {home.newest.map((s) => (
              <SongRow key={s.slug} song={s} />
            ))}
          </ul>
        </section>
        <PlayableCard common={home.chips} />
      </div>

      <section aria-labelledby="h-easy">
        <SectionHead id="h-easy" title="Dễ đàn cho người mới" href={hrefWith(DEFAULT_QUERY, { sort: "fewest" })} more="Thêm bài dễ →" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
          {home.easy.map((s) => (
            <Link key={s.slug} href={`/bai-hat/${s.slug}`} className="card flex flex-col gap-2 rounded-[10px] border border-line bg-surface p-3.5 text-ink no-underline">
              <span className="truncate font-bold">{s.title}</span>
              <span className="truncate text-[13px] text-soft">
                {s.artist} · tone {s.key}
              </span>
              <span className="flex flex-wrap gap-1.5">
                {s.chords.map((c) => (
                  <span key={c} className="rounded-md border border-line-strong bg-hover px-2 py-[3px] font-mono text-[13px] font-bold">
                    {c}
                  </span>
                ))}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="h-rh">
        <SectionHead id="h-rh" title="Theo điệu đệm" href={`${LIST_PATH}#dieu-dem`} more={`Tất cả ${home.rhythmCount} điệu →`} />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
          {home.rhythms.map((r) => (
            <Link key={r.name} href={hrefWith(DEFAULT_QUERY, { rhythm: r.name })} className="card flex flex-col gap-1.5 rounded-[10px] border border-line bg-surface px-3.5 py-3 text-ink no-underline">
              <span aria-hidden="true" className="font-mono text-[15px] font-bold tracking-[0.08em] text-link">
                {strumGlyph(r.name)}
              </span>
              <span className="font-semibold">{r.name}</span>
              <span className="text-[13px] text-soft">{r.count} bài</span>
            </Link>
          ))}
        </div>
      </section>

      <Link
        href={LIST_PATH}
        className="card flex min-h-14 items-center justify-center rounded-xl border-b-[3px] border-accent bg-bar px-4 text-center font-bold text-bar-ink no-underline"
      >
        Xem tất cả {home.total} bài, lọc theo tone, điệu, hợp âm →
      </Link>
    </div>
  );
}
