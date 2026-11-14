import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/db/auth";
import { getSongRhythms } from "@/db/rhythms";
import { getSettings } from "@/db/settings";
import { getSong } from "@/db/songs";
import { SiteHeader } from "@/components/SiteHeader";
import { ForestFooter, SkyBand } from "@/components/Scenery";
import { SongView } from "@/components/song/SongView";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const song = await getSong((await params).slug);
  if (!song) return {};
  return {
    title: `Hợp âm ${song.title} – ${song.artist}`,
    description: `Hợp âm guitar ${song.title} (${song.artist}), tone ${song.key}${song.rhythm ? `, điệu ${song.rhythm}` : ""}. Lời và thế bấm trên cùng một màn hình.`,
  };
}

export default async function SongPage({ params }: Props) {
  const [song, user] = await Promise.all([getSong((await params).slug), currentUser()]);
  if (!song) notFound();
  const [rhythms, savedSettings] = await Promise.all([getSongRhythms(song.id), user ? getSettings(user.id) : null]);

  return (
    <>
      <SkyBand>
        <SiteHeader />
        <section className="mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-5 px-4 pt-7 pb-32 sm:px-8">
          <div className="flex min-w-0 flex-col gap-2.5">
            <nav aria-label="Đường dẫn" className="text-sm font-semibold text-[#2e4a3a]">
              <Link href="/" className="hover:text-forest">
                Bài hát
              </Link>{" "}
              {[song.genre, song.rhythm].filter(Boolean).map((t) => ` / ${t}`)}
            </nav>
            <h1 className="font-serif text-4xl leading-tight font-bold text-[#16301f] sm:text-[52px]">{song.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-[#2e4a3a]">
              <span>
                Ca sĩ <strong className="font-extrabold text-forest">{song.artist}</strong>
              </span>
              {song.composer && (
                <span>
                  Sáng tác <strong className="font-bold text-[#16301f]">{song.composer}</strong>
                </span>
              )}
              <span className="rounded-full bg-white px-3 py-1 text-[13px] font-extrabold text-forest">Tone {song.key}</span>
              {song.rhythm && <span className="rounded-full bg-white/70 px-3 py-1 text-[13px] font-bold">Điệu {song.rhythm}</span>}
            </div>
          </div>
        </section>
      </SkyBand>
      <main className="relative mx-auto -mt-24 max-w-[1280px] px-4 sm:px-8">
        <SongView song={song} rhythms={rhythms} savedSettings={savedSettings} signedIn={user !== null} />
      </main>
      <ForestFooter />
    </>
  );
}
