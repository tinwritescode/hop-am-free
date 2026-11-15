import Link from "next/link";
import { artistTone, initialOf, type Tally } from "@/lib/catalog";
import { DEFAULT_QUERY, hrefWith } from "@/lib/song-list";
import { Bone } from "@/components/site/Loading";

// Avatar colours by artistTone slot; token pairs only, so day and night both keep their contrast.
const TONES = ["bg-accent text-on-accent", "bg-bar text-bar-ink", "bg-hover text-link ring-1 ring-inset ring-line-strong", "bg-warn-bg text-warn"];

/** A singer (a duet counts for each of its singers) with their song count, linking to the list filtered to that artist. */
export function ArtistCard({ artist }: { artist: Tally }) {
  return (
    <Link
      href={hrefWith(DEFAULT_QUERY, { artist: artist.name })}
      className="card flex min-h-11 items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-ink no-underline"
    >
      <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full font-serif text-lg ${TONES[artistTone(artist.name)]}`}>
        {initialOf(artist.name)}
      </span>
      <span className="min-w-0">
        <span title={artist.name} className="block truncate font-semibold">
          {artist.name}
        </span>
        <span className="text-[13px] text-soft">{artist.count} bài</span>
      </span>
    </Link>
  );
}

/** ArtistCard's loading skeleton. */
export function ArtistCardBone() {
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3 py-2.5">
      <Bone pill className="size-10 shrink-0" />
      <span className="flex flex-auto flex-col gap-1.5">
        <Bone className="h-4 w-3/5" />
        <Bone className="h-3 w-12" />
      </span>
    </div>
  );
}

/** A home section title with its "see all" link on the right. */
export function SectionHead({ id, title, href, more }: { id: string; title: string; href: string; more: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id={id} className="font-serif text-[22px] font-normal">
        {title}
      </h2>
      <Link href={href} className="flex min-h-11 items-center text-sm font-semibold no-underline">
        {more}
      </Link>
    </div>
  );
}
