import Link from "next/link";
import type { SetlistNav } from "@/lib/setlist";

/** Above a song opened from a setlist: which song of how many, and the songs either side. */
export function SetlistBar({ nav }: { nav: SetlistNav }) {
  return (
    <nav aria-label="Danh sách bài" className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-hover px-3 py-2 text-sm">
      <Link href={nav.listHref} className="mr-auto font-extrabold text-link">
        Danh sách · Bài {nav.index + 1}/{nav.total}
      </Link>
      {nav.prev && (
        <Link href={nav.prev.href} className="inline-flex h-10 max-w-[45%] items-center rounded-full border border-line-strong bg-surface px-3.5 font-bold">
          <span className="truncate">← {nav.prev.title}</span>
        </Link>
      )}
      {nav.next ? (
        <Link href={nav.next.href} className="fx inline-flex h-10 max-w-[60%] items-center rounded-full bg-accent px-4 font-extrabold text-on-accent">
          <span className="truncate">Bài tiếp: {nav.next.title} →</span>
        </Link>
      ) : (
        <span className="font-bold text-soft">Bài cuối</span>
      )}
    </nav>
  );
}
