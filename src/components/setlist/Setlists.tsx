"use client";

import Link from "next/link";
import { useState } from "react";
import { Mascot } from "@/components/Mascot";
import { LIST_PATH } from "@/lib/song-list";
import { setlistHref, setlistSongHref } from "@/lib/setlist";
import { sfx } from "@/lib/sfx";
import { useSetlist, type SetlistItem } from "./useSetlist";

/** A song on the list page; `artist` and `key` only when the list came from the server. */
export type SetlistSong = SetlistItem & { artist?: string; songKey?: string };

const round = "inline-flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface text-sm font-extrabold disabled:opacity-30";

/** The visitor's own list: reorder, remove, share, start. */
export function MySetlist() {
  const { items, move, remove, replace } = useSetlist();
  if (!items.length)
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-surface px-6 py-10 text-center">
        <Mascot size={72} />
        <p className="font-serif text-xl">Danh sách đang trống</p>
        <p className="max-w-sm text-sm text-soft">Mở một bài và bấm “+ Danh sách”. Xếp xong, gửi link cho cả nhóm: mỗi người mở là thấy đúng thứ tự, bấm “Bài tiếp” để sang bài sau.</p>
        <Link href={LIST_PATH} className="fx mt-2 inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-extrabold text-on-accent">
          Chọn bài
        </Link>
      </div>
    );
  return (
    <SetlistView
      songs={items}
      actions={
        <button type="button" onClick={() => confirm("Xoá hết danh sách?") && replace([])} className="h-11 rounded-full px-4 text-sm font-bold text-soft">
          Xoá hết
        </button>
      }
      rowControls={(song, i) => (
        <>
          <button type="button" aria-label={`Đưa ${song.title} lên`} disabled={i === 0} onClick={() => {
              sfx("tick");
              move(song.slug, -1);
            }} className={round}>
            ↑
          </button>
          <button type="button" aria-label={`Đưa ${song.title} xuống`} disabled={i === items.length - 1} onClick={() => {
              sfx("tick");
              move(song.slug, 1);
            }} className={round}>
            ↓
          </button>
          <button type="button" aria-label={`Bỏ ${song.title}`} onClick={() => {
              sfx("unpop");
              remove(song.slug);
            }} className={round}>
            ✕
          </button>
        </>
      )}
    />
  );
}

/** A list someone shared: start it, or keep it as the visitor's own. */
export function SharedSetlist({ songs }: { songs: readonly SetlistSong[] }) {
  const { replace } = useSetlist();
  const [saved, setSaved] = useState(false);
  if (!songs.length) return <p className="rounded-lg border border-line bg-surface p-6 text-soft">Các bài trong link này không còn trên trang.</p>;
  return (
    <SetlistView
      songs={songs}
      actions={
        <button
          type="button"
          onClick={() => {
            replace(songs.map(({ slug, title }) => ({ slug, title })));
            setSaved(true);
          }}
          className="h-11 rounded-full border border-line-strong bg-surface px-4 text-sm font-bold"
        >
          {saved ? "✓ Đã lưu, sửa được ở Danh sách" : "Lưu làm danh sách của bạn"}
        </button>
      }
    />
  );
}

function SetlistView({ songs, actions, rowControls }: { songs: readonly SetlistSong[]; actions: React.ReactNode; rowControls?: (song: SetlistSong, i: number) => React.ReactNode }) {
  const slugs = songs.map((s) => s.slug);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    sfx("tick"); // before the await, while still inside the tap
    try {
      await navigator.clipboard.writeText(new URL(setlistHref(slugs), location.origin).href);
      setCopied(true);
    } catch {
      prompt("Chép link này:", new URL(setlistHref(slugs), location.origin).href); // clipboard blocked: let them copy by hand
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={setlistSongHref({ slug: slugs[0], slugs })} className="fx inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-extrabold text-on-accent">
          ▶ Bắt đầu từ bài 1
        </Link>
        <Link href={setlistSongHref({ slug: slugs[0], slugs, present: true })} className="inline-flex h-11 items-center rounded-full bg-bar px-4 text-sm font-extrabold text-bar-ink">
          Trình chiếu
        </Link>
        <button type="button" onClick={() => void copy()} className="h-11 rounded-full border border-line-strong bg-surface px-4 text-sm font-bold">
          {copied ? "✓ Đã chép link" : "Chép link chia sẻ"}
        </button>
        {actions}
      </div>
      <ol className="overflow-hidden rounded-lg border border-line bg-surface">
        {songs.map((song, i) => (
          <li key={song.slug} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0">
            <span className="w-7 shrink-0 text-center font-serif text-xl text-link">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <Link href={setlistSongHref({ slug: song.slug, slugs })} className="block truncate text-[15px] font-semibold">
                {song.title}
              </Link>
              {(song.artist || song.songKey) && (
                <p className="truncate text-[13px] text-soft">
                  {song.artist}
                  {song.songKey && <span className="ml-2 font-mono font-bold text-ink">{song.songKey}</span>}
                </p>
              )}
            </div>
            {rowControls && <div className="flex shrink-0 gap-1">{rowControls(song, i)}</div>}
          </li>
        ))}
      </ol>
    </div>
  );
}
