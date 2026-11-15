"use client";

import { useRouter } from "next/navigation";
import { KnownChordChips } from "@/components/home/KnownChordChips";
import { useKnownChords } from "@/components/home/useKnownChords";
import { hrefWith, knownParam, type ListQuery } from "@/lib/song-list";

/**
 * "Hợp âm bạn đã biết" and "Chỉ hiện bài chơi được ngay". The visitor's chords live in browser storage; turning the
 * filter on copies them into the URL (?hop-am=Am,C,G), so the server filters and pages the list and the link can be
 * shared. A shared link keeps the sender's chords, and says so.
 */
export function PlayableFilter({ query, common }: { query: ListQuery; common: readonly string[] }) {
  const router = useRouter();
  const { known } = useKnownChords();
  const mine = knownParam(known);
  const on = query.known.length > 0;
  const fromLink = on && mine.join(",") !== query.known.join(",");
  const go = (chords: string[], how: "push" | "replace") => router[how](hrefWith(query, { known: chords }), { scroll: false });

  return (
    <section id="hop-am" aria-labelledby="h-known" className="flex scroll-mt-4 flex-col gap-2.5">
      <h2 id="h-known" className="font-bold">
        Hợp âm bạn đã biết
      </h2>
      {known.size === 0 && <p className="text-soft">Chạm những hợp âm bạn bấm được, Mầm sẽ đánh dấu bài chơi được ngay.</p>}
      <KnownChordChips common={common} label="Hợp âm bạn đã biết" onChange={(next) => on && go(knownParam(next), "replace")} />
      <label className={`flex min-h-11 items-center gap-2 ${!on && mine.length === 0 ? "text-soft" : ""}`}>
        <input
          type="checkbox"
          checked={on}
          disabled={!on && mine.length === 0}
          onChange={(e) => go(e.target.checked ? mine : [], "push")}
          className="size-[18px]"
        />
        Chỉ hiện bài chơi được ngay
      </label>
      {fromLink && (
        <p className="rounded-md bg-hover px-3 py-2 text-ink">
          Đang lọc theo hợp âm trong đường link: <strong className="font-mono">{query.known.join(" ")}</strong>.{" "}
          {mine.length > 0 && (
            <button type="button" onClick={() => go(mine, "replace")} className="min-h-11 font-bold text-link underline">
              Dùng hợp âm của bạn
            </button>
          )}
        </p>
      )}
    </section>
  );
}
