import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Player } from "@/components/fingerstyle/Player";
import { TabLegend } from "@/components/fingerstyle/TabLegend";
import { arrangementOf, FINGERSTYLE_PATH, SONGS, songBySlug } from "@/fingerstyle";
import { DIFFICULTY_LABEL } from "@/lib/chords";
import { parseTab } from "@/lib/tab/parse";
import { TUNINGS } from "@/lib/tuner";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ban?: string | string[] }> };

export function generateStaticParams() {
  return SONGS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const song = songBySlug((await params).slug);
  if (!song) return {};
  return {
    title: `${song.title} fingerstyle – ${song.artist}`,
    description: `Học ${song.title} (${song.artist}) fingerstyle từng nốt: tab có tiếng, cần đàn chỉ chỗ bấm và ngón gảy, chỉnh chậm và lặp từng đoạn.`,
  };
}

export default async function FingerstyleSongPage({ params, searchParams }: Props) {
  const [{ slug }, { ban }] = await Promise.all([params, searchParams]);
  const song = songBySlug(slug);
  if (!song) notFound();
  const arrangement = arrangementOf({ song, id: typeof ban === "string" ? ban : undefined });
  const tab = parseTab(arrangement.tab);
  const tuning = TUNINGS.find((t) => t.id === arrangement.tuning) ?? TUNINGS[0];
  const chip = "rounded-md border border-line-strong bg-surface px-2.5 py-0.5 font-bold text-ink";
  return (
    <main className="flex flex-col gap-4">
      <header className="flex flex-col gap-2 pt-5">
        <nav aria-label="Đường dẫn" className="text-sm font-semibold text-soft">
          <Link href={FINGERSTYLE_PATH} className="text-soft hover:text-link">
            Fingerstyle
          </Link>
        </nav>
        <h1 className="font-serif text-4xl leading-tight font-normal">{song.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] text-soft">
          <span>
            Ca sĩ <strong className="text-ink">{song.artist}</strong>
          </span>
          <span>
            Phối <strong className="text-ink">{arrangement.arranger}</strong>
          </span>
          <span className={chip}>Độ khó: {DIFFICULTY_LABEL[arrangement.difficulty]}</span>
          <span className={`${chip} font-mono`}>Dây {tuning.name}</span>
          <span className={`${chip} font-mono`}>{arrangement.capo ? `Capo ${arrangement.capo}` : "Không capo"}</span>
          {arrangement.video && (
            <a href={arrangement.video} target="_blank" rel="noopener noreferrer" className="font-bold text-link">
              Xem video gốc
            </a>
          )}
        </div>
        {song.arrangements.length > 1 && (
          <nav aria-label="Bản phối" className="flex flex-wrap gap-2">
            {song.arrangements.map((a) => (
              <Link
                key={a.id}
                href={`${FINGERSTYLE_PATH}/${song.slug}?ban=${a.id}`}
                aria-current={a.id === arrangement.id ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-bold ${a.id === arrangement.id ? "border-link bg-hover text-link" : "border-line-strong text-ink"}`}
              >
                {a.name} · {DIFFICULTY_LABEL[a.difficulty]}
              </Link>
            ))}
          </nav>
        )}
        {arrangement.note && <p className="max-w-[720px] rounded-lg bg-warn-bg px-4 py-3 text-sm text-ink">{arrangement.note}</p>}
      </header>
      <Player key={arrangement.id} tab={tab} voice={{ strings: tuning.strings, capo: arrangement.capo, capos: tab.capos }} columnsPerSecond={arrangement.columnsPerSecond} />
      <TabLegend />
    </main>
  );
}
