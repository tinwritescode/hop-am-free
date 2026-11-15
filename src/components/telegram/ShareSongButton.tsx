"use client";

import { songShareUrl } from "@/lib/telegram/start-param";
import { supports } from "@/lib/telegram/webapp";
import { useTelegram } from "./TelegramBridge";

/**
 * "Chia sẻ" inside the Telegram Mini App only: opens Telegram's chat picker with a link that reopens the Mini App on this
 * song. Needs Bot API 7.0, where openTelegramLink stops closing the Mini App. Renders nothing in a browser.
 */
export function ShareSongButton({ slug, title }: { slug: string; title: string }) {
  const webApp = useTelegram();
  if (!webApp || !supports(webApp, "7.0")) return null;
  return (
    <button
      type="button"
      onClick={() => webApp.openTelegramLink(songShareUrl({ slug, title, origin: window.location.origin }))}
      className="fx inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-extrabold text-on-accent"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
      </svg>
      Chia sẻ
    </button>
  );
}
