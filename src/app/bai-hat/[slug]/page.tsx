import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/db/auth";
import { getSongRhythms } from "@/db/rhythms";
import { getSettings } from "@/db/settings";
import { getSong } from "@/db/songs";
import { ArtistLinks } from "@/components/ArtistLinks";
import { CapoEditor } from "@/components/song/CapoEditor";
import { SongView } from "@/components/song/SongView";
import { ShareSongButton } from "@/components/telegram/ShareSongButton";
import { artistsOf } from "@/lib/catalog";
import { breadcrumbJsonLd, pageMeta, songCard, songDescription, songOgPath } from "@/lib/seo";
import { siteOrigin } from "@/lib/site";
import { DEFAULT_QUERY, hrefWith, LIST_PATH } from "@/lib/song-list";
import { parseSetlist, setlistNav, whereInSetlist } from "@/lib/setlist";
import { SetlistBar } from "@/components/setlist/SetlistBar";
import { SetlistToggle } from "@/components/setlist/SetlistToggle";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ds?: string | string[]; "trinh-chieu"?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const song = await getSong((await params).slug);
  if (!song) return {};
  return pageMeta({
    title: `Hợp âm ${song.title} – ${song.artist}`,
    description: songDescription(song),
    path: `${LIST_PATH}/${song.slug}`,
    image: songOgPath({ slug: song.slug, card: songCard(song) }),
  });
}

export default async function SongPage({ params, searchParams }: Props) {
  const [song, user, query] = await Promise.all([getSong((await params).slug), currentUser(), searchParams]);
  if (!song) notFound();
  const slugs = parseSetlist(query.ds);
  const place = whereInSetlist({ slugs, slug: song.slug });
  const neighbours = place ? [place.prev, place.next].filter((s) => s !== null) : [];
  const [rhythms, savedSettings, ...around] = await Promise.all([getSongRhythms(song.id), user ? getSettings(user.id) : null, ...neighbours.map(getSong)]);
  const titles = new Map(around.flatMap((s) => (s ? [[s.slug, s.title] as const] : [])));
  const setlist = setlistNav({ slugs, slug: song.slug, titles });
  const origin = siteOrigin();
  const artists = artistsOf(song.artist);
  const trail = [
    { name: "Bài hát", path: LIST_PATH },
    // A breadcrumb is one path, so a duet goes through its first singer.
    ...artists.slice(0, 1).map((name) => ({ name, path: hrefWith(DEFAULT_QUERY, { artist: name }) })),
    { name: song.title, path: `${LIST_PATH}/${song.slug}` },
  ];

  return (
    <main>
      {origin && (
        // JSON.stringify escapes quotes; "<" is escaped too so a title can never close the script tag.
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd({ origin, trail })).replace(/</g, "\\u003c") }} />
      )}
      {setlist && <SetlistBar nav={setlist} />}
      <section className="flex min-w-0 flex-col gap-2 pt-5 pb-5 lg:gap-1 lg:pt-3 lg:pb-3">
        <nav aria-label="Đường dẫn" className="text-sm font-semibold text-soft">
          <Link href={LIST_PATH} className="text-soft hover:text-link">
            Bài hát
          </Link>
          {song.genre && ` / ${song.genre}`}
          {song.rhythm && (
            <>
              {" / "}
              <Link href={hrefWith(DEFAULT_QUERY, { rhythm: song.rhythm })} className="text-soft hover:text-link">
                {song.rhythm}
              </Link>
            </>
          )}
        </nav>
        {/* Desktop: a smaller title with the details on the same line, so the lyrics start higher. */}
        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:gap-y-1">
          <h1 className="font-serif text-4xl leading-tight font-normal sm:text-[44px] lg:text-[clamp(1.625rem,0.9rem+1.1vw,2.25rem)]">{song.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-soft">
            <span>
              Ca sĩ{" "}
              <ArtistLinks artists={artists} className="font-bold text-ink hover:text-link" />
            </span>
            {song.composer && (
              <span>
                Sáng tác <strong className="font-bold text-ink">{song.composer}</strong>
              </span>
            )}
            <SetlistToggle slug={song.slug} title={song.title} />
            <ShareSongButton slug={song.slug} title={song.title} />
          </div>
        </div>
        {user?.isAdmin && <CapoEditor key={`${song.capo?.fret}-${song.capo?.source}`} slug={song.slug} capo={song.capo} />}
      </section>
      <SongView song={song} rhythms={rhythms} savedSettings={savedSettings} signedIn={user !== null} setlist={setlist} present={query["trinh-chieu"] === "1"} />
    </main>
  );
}
