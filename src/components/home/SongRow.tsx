"use client";

import Link from "next/link";
import { isPlayable, type SongSummary } from "@/lib/catalog";
import { ArtistLinks } from "@/components/ArtistLinks";
import { useKnownChords } from "./useKnownChords";

/** One song in a list: title · artist, the opening line with its chords, key and rhythm on the right. */
export function SongRow({ song }: { song: SongSummary }) {
  const { known } = useKnownChords();
  const playable = isPlayable({ chords: song.chords, known });
  return (
    <li className="song-row relative flex items-start gap-4 border-b border-line px-2 py-2.5">
      <div className="min-w-0 flex-auto">
        <p className="text-[15px]">
          {/* The title link covers the whole row, so the row is one big touch target. */}
          <Link href={`/bai-hat/${song.slug}`} className="font-semibold no-underline after:absolute after:inset-0">
            {song.title}
          </Link>{" "}
          <span className="text-sm text-soft">
            ·{" "}
            <ArtistLinks artists={song.artists} className="relative z-10 text-soft no-underline hover:underline" />
          </span>
        </p>
        <p className="mt-0.5 truncate text-sm leading-normal text-soft">
          {song.snippet.map((t, i) => (
            <span key={i}>
              {t.chord && <span className={`mr-1 font-mono text-[13px] font-bold ${known.has(t.chord) ? "text-ok" : "text-link"}`}>{t.chord}</span>}
              {t.text}{" "}
            </span>
          ))}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end text-[13px] leading-normal">
        <span className="font-mono font-bold">{song.key}</span>
        {song.rhythm && <span className="text-soft">{song.rhythm}</span>}
        {playable && <span className="text-xs font-semibold whitespace-nowrap text-ok">✓ chơi được</span>}
      </div>
    </li>
  );
}
