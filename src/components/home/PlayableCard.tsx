"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { PlayableResponseSchema, type PlayableResponse } from "@/lib/playable";
import { DEFAULT_QUERY, hrefWith, knownParam } from "@/lib/song-list";
import { KnownChordChips } from "./KnownChordChips";
import { useKnownChords } from "./useKnownChords";

type Result = { chords: string; status: "ready"; data: PlayableResponse } | { chords: string; status: "error" };

/**
 * "Chơi được ngay": the visitor's chords (browser storage) decide which songs are playable, so the count and the
 * list come from /api/songs/playable once chords are picked; the home page itself carries no per-song chord data.
 */
export function PlayableCard({ common }: { common: readonly string[] }) {
  const { known } = useKnownChords();
  const chords = knownParam(known);
  const param = chords.join(",");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!param) return;
    const ctrl = new AbortController();
    fetch(`/api/songs/playable?hop-am=${encodeURIComponent(param)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json: unknown) => setResult({ chords: param, status: "ready", data: PlayableResponseSchema.parse(json) }))
      .catch(() => {
        if (!ctrl.signal.aborted) setResult({ chords: param, status: "error" });
      });
    return () => ctrl.abort();
  }, [param]);

  const current = result?.chords === param ? result : null;

  return (
    <aside aria-labelledby="h-play" className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 rounded-[10px] border border-line bg-surface p-4">
      <div className="flex items-center gap-2.5">
        <Mascot size={52} motion="bob" className="shrink-0" />
        <div>
          <h2 id="h-play" className="text-base font-bold">
            Chơi được ngay
          </h2>
          <p className="text-[13px] text-soft">Chạm hợp âm bạn bấm được</p>
        </div>
      </div>
      <KnownChordChips common={common} label="Hợp âm bạn đã biết" />
      <div aria-live="polite" className="flex flex-col gap-2 text-sm">
        {!param && <p className="text-soft">Mầm sẽ tìm những bài chỉ dùng các hợp âm bạn chọn.</p>}
        {param && !current && <p className="text-soft">Mầm đang đếm bài…</p>}
        {current?.status === "error" && <p className="text-warn">Mầm chưa đếm được, thử chạm lại một hợp âm nhé.</p>}
        {current?.status === "ready" &&
          (current.data.count === 0 ? (
            <p className="text-soft">Chưa có bài nào chỉ dùng các hợp âm này. Thêm một hợp âm nữa nhé.</p>
          ) : (
            <>
              <p className="mt-1 text-[13px] font-bold text-ok">{current.data.count} bài chơi được với các hợp âm này</p>
              <ul>
                {current.data.songs.map((s) => (
                  <li key={s.slug} className="song-row relative flex justify-between gap-2 border-t border-line px-1.5 py-2.5">
                    <Link href={`/bai-hat/${s.slug}`} className="min-w-0 truncate font-semibold no-underline after:absolute after:inset-0">
                      {s.title}
                    </Link>
                    <span className="max-w-[45%] shrink-0 truncate text-[13px] text-soft">{s.artist}</span>
                  </li>
                ))}
              </ul>
              <Link href={hrefWith(DEFAULT_QUERY, { known: chords })} className="flex min-h-11 items-center font-semibold no-underline">
                Xem hết bài chơi được →
              </Link>
            </>
          ))}
      </div>
    </aside>
  );
}
