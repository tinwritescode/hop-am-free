import Link from "next/link";
import { searchSongs } from "@/db/songs";
import { chordsInOrder } from "@/lib/chordsheet";
import { SiteHeader } from "@/components/SiteHeader";
import { ForestFooter, SkyBand } from "@/components/Scenery";
import { Mascot } from "@/components/Mascot";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const needle = q.trim();
  const songs = (await searchSongs(needle)).map((s) => ({ ...s, chords: chordsInOrder(s.sheet) }));

  return (
    <>
      <SkyBand>
        <SiteHeader query={q} />
        <section className="mx-auto max-w-[1280px] px-4 pt-10 pb-36 sm:px-8">
          <h1 className="max-w-[720px] font-serif text-4xl leading-tight font-bold text-[#16301f] sm:text-[52px]">Hợp âm chuẩn, thế tay ngay bên cạnh.</h1>
          <p className="mt-3 max-w-[560px] text-[17px] leading-relaxed font-semibold text-[#2e4a3a]">
            Không cần kéo xuống tìm thế bấm. Có Mầm dẫn bài, soát lỗi và đổi sang hợp âm dễ đánh hơn.
          </p>
        </section>
      </SkyBand>

      <main className="relative mx-auto -mt-20 max-w-[1280px] px-4 sm:px-8">
        <div className="rounded-[26px] bg-white p-5 shadow-[0_1px_0_#dce8d8,0_12px_32px_rgba(47,107,71,0.10)] sm:p-8">
          <h2 className="font-serif text-2xl font-bold">{needle ? `Kết quả cho “${q}”` : "Bài hát mới"}</h2>
          {songs.length === 0 ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-moss p-4 text-sm text-ink-soft">
              <Mascot size={44} />
              Mầm chưa tìm thấy bài nào. Thử tên khác, hoặc gõ không dấu.
            </div>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {songs.map((s) => (
                <li key={s.slug}>
                  <Link href={`/bai-hat/${s.slug}`} className="flex h-full flex-col gap-2 rounded-2xl border border-line p-4 transition hover:border-leaf hover:bg-[#f7faf5]">
                    <span className="font-serif text-xl font-bold text-ink">{s.title}</span>
                    <span className="text-sm text-muted">
                      {[s.artist, `Tone ${s.key}`, s.rhythm].filter(Boolean).join(" · ")}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {s.chords.slice(0, 8).map((c) => (
                        <span key={c} className="rounded-full bg-moss px-2 py-0.5 text-xs font-extrabold text-leaf">
                          {c}
                        </span>
                      ))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <ForestFooter />
    </>
  );
}
