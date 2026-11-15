"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { SetlistNav } from "@/lib/setlist";

/** Finds the projector view; the page's auto-scroll scrolls it instead of the page while it is open. */
export const PRESENT_SELECTOR = "[data-present]";

export const PRESENT_FONT = { min: 20, max: 64, step: 2, initial: 34 } as const;

// Set while moving to the next song of a setlist: the page that is leaving keeps fullscreen for the projector that opens next.
let handoff = false;
const noSubscribe = () => () => {};

/**
 * The song for a projector or a TV: fullscreen where the browser allows it, always night colours, big one-column lyrics.
 * Esc leaves (the browser's own Esc ends fullscreen, which closes it too); + and − size the text;
 * ← and → step through a setlist. Fullscreen is on the whole page, so it survives the move to the next song.
 */
export function Presenter({
  title,
  songKey,
  fontSize,
  onFont,
  onTone,
  onClose,
  setlist,
  children,
}: {
  title: string;
  songKey: string;
  fontSize: number;
  onFont: (size: number) => void;
  onTone: (step: number) => void;
  onClose: () => void;
  setlist: SetlistNav | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false); // the portal needs document.body
  const font = (d: number) => onFont(Math.min(PRESENT_FONT.max, Math.max(PRESENT_FONT.min, fontSize + d)));
  const go = (href: string) => {
    handoff = true;
    router.push(href);
  };
  // The handlers change every render; the listeners below read the latest through this ref instead of re-binding.
  const latest = useRef({ onClose, font, go, setlist });
  latest.current = { onClose, font, go, setlist };

  useEffect(() => {
    handoff = false;
    let entered = document.fullscreenElement !== null;
    if (!entered)
      document.documentElement.requestFullscreen?.().then(
        () => (entered = true),
        () => {}, // iPhone Safari, embedded webviews, or no tap to allow it: the overlay still fills the window
      );
    const onFullscreen = () => entered && !document.fullscreenElement && latest.current.onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") latest.current.onClose();
      else if (e.key === "+" || e.key === "=") latest.current.font(PRESENT_FONT.step);
      else if (e.key === "-") latest.current.font(-PRESENT_FONT.step);
      else if (e.key === "ArrowRight" && latest.current.setlist?.next) latest.current.go(latest.current.setlist.next.presentHref);
      else if (e.key === "ArrowLeft" && latest.current.setlist?.prev) latest.current.go(latest.current.setlist.prev.presentHref);
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("keydown", onKey);
      if (handoff) return; // the next song's loading screen shows first; its projector takes fullscreen over
      // Leave fullscreen only if no projector is left once React is done (a re-run effect mounts this one straight back).
      setTimeout(() => {
        if (!document.querySelector(PRESENT_SELECTOR) && document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      });
    };
  }, []);

  if (!mounted) return null;
  const round = "inline-flex size-11 items-center justify-center rounded-full bg-hover font-extrabold";
  return createPortal(
    <div
      data-present=""
      data-mode="night"
      role="dialog"
      aria-modal="true"
      aria-label={`Trình chiếu: ${title}`}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-bg text-ink"
    >
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur sm:px-8">
        <button type="button" onClick={onClose} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-hover px-4 text-sm font-extrabold">
          ✕ Thoát
        </button>
        <p className="mr-auto min-w-0 truncate font-serif text-xl">{title}</p>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-soft">
          Tone
          <button type="button" aria-label="Hạ nửa cung" onClick={() => onTone(-1)} className={round}>
            −
          </button>
          <span className="min-w-9 text-center text-base font-extrabold text-ink">{songKey}</span>
          <button type="button" aria-label="Nâng nửa cung" onClick={() => onTone(1)} className={round}>
            +
          </button>
        </span>
        <span className="inline-flex gap-1">
          <button type="button" aria-label="Thu nhỏ chữ" onClick={() => font(-PRESENT_FONT.step)} className={`${round} text-sm`}>
            A−
          </button>
          <button type="button" aria-label="Phóng to chữ" onClick={() => font(PRESENT_FONT.step)} className={`${round} text-lg`}>
            A+
          </button>
        </span>
      </div>
      <div className="mx-auto max-w-5xl px-5 pt-4 pb-[40vh] sm:px-10">
        {children}
        {setlist && (
          <nav aria-label="Danh sách bài" className="mt-16 flex flex-wrap items-center gap-3 border-t border-line pt-6 text-lg">
            <span className="mr-auto font-bold text-soft">
              Bài {setlist.index + 1}/{setlist.total}
            </span>
            {setlist.prev && (
              <Link href={setlist.prev.presentHref} onClick={() => (handoff = true)} className="inline-flex h-12 items-center rounded-full bg-hover px-5 font-bold">
                ← {setlist.prev.title}
              </Link>
            )}
            {setlist.next && (
              <Link href={setlist.next.presentHref} onClick={() => (handoff = true)} className="fx inline-flex h-12 items-center rounded-full bg-accent px-6 font-extrabold text-on-accent">
                Bài tiếp: {setlist.next.title} →
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>,
    document.body,
  );
}
