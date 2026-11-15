import { z } from "zod";

// Deep links into the Mini App: t.me/HopAmBot?startapp=<song slug> opens the bot's Main Mini App with
// ?tgWebAppStartParam=<slug> on its URL, and the middleware sends that request on to the song.

export const BOT_USERNAME = "HopAmBot";

/** The GET parameter Telegram adds to the Mini App URL for a non-empty `startapp`. */
export const START_PARAM_QUERY = "tgWebAppStartParam";

/**
 * Telegram allows only A-Z, a-z, 0-9, _ and - in start parameters. Its deep-linking docs cap `start` at 64 characters
 * and give no figure for `startapp`, so 64 it is. slugify() only emits a-z, 0-9 and -, so every slug is passed verbatim;
 * a slug that still does not fit (over 64 characters) gets no deep link, and sharing uses the web page instead.
 */
const StartParamSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

const songPath = (slug: string) => `/bai-hat/${slug}`;

export function songStartParam(slug: string): string | null {
  const param = StartParamSchema.safeParse(slug);
  return param.success ? param.data : null;
}

/** Where a Mini App launch carrying a song's start parameter should go, or null to serve the request as is. */
export function startParamRedirect(url: URL): URL | null {
  const param = StartParamSchema.safeParse(url.searchParams.get(START_PARAM_QUERY));
  if (!param.success) return null;
  const target = new URL(songPath(param.data), url);
  target.search = url.search;
  target.searchParams.delete(START_PARAM_QUERY);
  return target;
}

/** A t.me share link (Telegram's chat picker) for a song: the Mini App deep link when the slug allows one, else the web page. */
export function songShareUrl({ slug, title, origin }: { slug: string; title: string; origin: string }): string {
  const param = songStartParam(slug);
  const link = param ? `https://t.me/${BOT_USERNAME}?startapp=${param}` : `${origin}${songPath(slug)}`;
  const share = new URL("https://t.me/share/url");
  share.searchParams.set("url", link);
  share.searchParams.set("text", `Hợp âm ${title}`);
  return share.href;
}
