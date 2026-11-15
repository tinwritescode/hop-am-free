import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/site/PageHeading";
import { FINGERSTYLE_PATH, SONGS } from "@/fingerstyle";
import { DIFFICULTY_LABEL } from "@/lib/chords";

export const metadata: Metadata = {
  title: "Học fingerstyle guitar",
  description: "Học đệm fingerstyle từng nốt: cần đàn chỉ chỗ bấm và ngón gảy, tab chạy theo tiếng đàn, chỉnh chậm và lặp từng đoạn.",
};

export default function FingerstylePage() {
  return (
    <main>
      <PageHeading title="Fingerstyle">Nghe tab thành tiếng đàn, xem từng nốt nằm ở đâu trên cần đàn và ngón nào gảy. Chỉnh chậm, lặp từng đoạn, hoặc đi từng nốt một.</PageHeading>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SONGS.map((song) => (
          <li key={song.slug}>
            <Link href={`${FINGERSTYLE_PATH}/${song.slug}`} className="card flex flex-col gap-1.5 rounded-[10px] border border-line bg-surface p-4 text-ink no-underline">
              <span className="font-serif text-xl">{song.title}</span>
              <span className="text-sm text-soft">{song.artist}</span>
              <span className="mt-1 flex flex-wrap gap-1.5 text-[13px]">
                {song.arrangements.map((a) => (
                  <span key={a.id} className="rounded-md bg-hover px-2 py-0.5 font-semibold">
                    {a.name} · {DIFFICULTY_LABEL[a.difficulty]}
                  </span>
                ))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
