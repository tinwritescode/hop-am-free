import { z } from "zod";
import type { Mode } from "@/lib/prefs";
import type { ModeTokens } from "@/themes/types";

// The slice of window.Telegram.WebApp (https://core.telegram.org/bots/webapps) the site uses, checked at the boundary.
// telegram-web-app.js always defines every method, whatever the client's Bot API version; the client's version only
// decides which ones do anything, so each call below is guarded by isVersionAtLeast.

// A runtime check can only see that a method is a function; its signature is the documented one.
const method = <T>() => z.custom<T>((v) => typeof v === "function");

type Handler = () => void;
type TelegramEvent = "themeChanged" | "viewportChanged";

const WebAppSchema = z.object({
  /** "unknown" outside Telegram: the script sets it from the tgWebAppPlatform launch parameter. */
  platform: z.string(),
  version: z.string(),
  // Live values the client updates; parsed where they are read.
  colorScheme: z.unknown(),
  viewportStableHeight: z.unknown(),
  isVersionAtLeast: method<(version: string) => boolean>(),
  ready: method<() => void>(),
  expand: method<() => void>(),
  setHeaderColor: method<(color: string) => void>(),
  setBackgroundColor: method<(color: string) => void>(),
  setBottomBarColor: method<(color: string) => void>(),
  onEvent: method<(event: TelegramEvent, handler: Handler) => void>(),
  offEvent: method<(event: TelegramEvent, handler: Handler) => void>(),
  openLink: method<(url: string) => void>(),
  openTelegramLink: method<(url: string) => void>(),
  BackButton: z.object({
    show: method<() => void>(),
    hide: method<() => void>(),
    onClick: method<(handler: Handler) => void>(),
    offClick: method<(handler: Handler) => void>(),
  }),
});
export type TelegramWebApp = z.infer<typeof WebAppSchema>;

const WindowSchema = z.object({ Telegram: z.object({ WebApp: z.unknown() }) });

// Narrows the live object itself (not a parsed copy), so its live values and methods stay attached.
function isWebApp(v: unknown): v is TelegramWebApp {
  return WebAppSchema.safeParse(v).success;
}

/**
 * The WebApp object when the page is running as a Mini App, else null. telegram-web-app.js defines
 * window.Telegram.WebApp in any browser, so its presence alone means nothing; inside Telegram the client passes a platform.
 */
export function telegramWebApp(win: unknown): TelegramWebApp | null {
  const parsed = WindowSchema.safeParse(win);
  if (!parsed.success) return null;
  const app = parsed.data.Telegram.WebApp;
  return isWebApp(app) && app.platform !== "unknown" ? app : null;
}

export function supports(webApp: TelegramWebApp, version: string): boolean {
  return webApp.isVersionAtLeast(version) === true;
}

const SchemeSchema = z.enum(["light", "dark"]);

/** Telegram's current colour scheme as the site's mode. */
export function colorMode(webApp: TelegramWebApp): Mode {
  const scheme = SchemeSchema.safeParse(webApp.colorScheme);
  return scheme.success && scheme.data === "dark" ? "night" : "day";
}

const HexSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

function hex(v: string): string | null {
  const color = HexSchema.safeParse(v);
  return color.success ? color.data : null;
}

/** Paints Telegram's header with the site's header bar, and its background and bottom bar with the page colour. */
export function applyChrome({ webApp, tokens }: { webApp: TelegramWebApp; tokens: ModeTokens }): void {
  const header = hex(tokens.base.bar);
  const page = hex(tokens.base.bg);
  // Up to Bot API 6.9 the header takes only theme keywords, not a #RRGGBB colour.
  if (header && supports(webApp, "6.9")) webApp.setHeaderColor(header);
  if (page && supports(webApp, "6.1")) webApp.setBackgroundColor(page);
  if (page && supports(webApp, "7.10")) webApp.setBottomBarColor(page);
}

const HeightSchema = z.number().positive();

/**
 * How far the page's bottom edge sits below what the visitor can see. A half-open Mini App shows only the top of the
 * webview; Telegram's docs say to pin bottom UI to viewportStableHeight, not the webview's bottom.
 */
export function offscreenBottom({ webApp, innerHeight }: { webApp: TelegramWebApp; innerHeight: number }): number {
  const height = HeightSchema.safeParse(webApp.viewportStableHeight);
  return height.success ? Math.max(0, Math.round(innerHeight - height.data)) : 0;
}

/**
 * Whether this page may be a Mini App, decided before downloading telegram-web-app.js: Telegram puts its launch
 * parameters in the URL fragment, and `remembered` carries that across full reloads within the session.
 */
export function hasLaunchHint({ hash, remembered }: { hash: string; remembered: boolean }): boolean {
  return remembered || /(?:^#|&)tgWebApp(?:Data|Version|Platform)=/.test(hash);
}
