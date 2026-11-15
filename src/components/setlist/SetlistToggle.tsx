"use client";

import Link from "next/link";
import { SETLIST_PATH } from "@/lib/setlist";
import { useSetlist } from "./useSetlist";

/** On a song page: puts the song in (or takes it out of) this visitor's setlist, with a way to the list once it has songs. */
export function SetlistToggle({ slug, title }: { slug: string; title: string }) {
  const { items, has, full, toggle } = useSetlist();
  const inList = has(slug);
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        aria-pressed={inList}
        disabled={!inList && full}
        onClick={() => toggle({ slug, title })}
        className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-extrabold disabled:opacity-40 ${inList ? "border-link bg-hover text-link" : "border-line-strong bg-surface text-ink"}`}
      >
        {inList ? "✓ Trong danh sách" : full ? "Danh sách đã đầy" : "+ Danh sách"}
      </button>
      {items.length > 0 && (
        <Link href={SETLIST_PATH} className="text-[13px] font-bold text-link">
          Xem ({items.length})
        </Link>
      )}
    </span>
  );
}
