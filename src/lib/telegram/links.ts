// Where a tapped link should open when the site runs as a Telegram Mini App.

export type LinkAction = { kind: "app" } | { kind: "telegram"; url: string } | { kind: "browser"; url: string };

const TELEGRAM_HOSTS = new Set(["t.me", "telegram.me"]);

/**
 * Same-site paths that must not load inside the webview: sign-in (and the admin pages that redirect to it) goes to
 * WorkOS's hosted login, which Telegram's iframe and Google's webview policy can block, and the raw files are not
 * app pages, so the BackButton would be left with no page to drive it. They open in the external browser instead.
 */
const BROWSER_ONLY = ["/sign-in", "/cli", "/admin", "/agents.md", "/api"];

function browserOnly(path: string): boolean {
  return BROWSER_ONLY.some((p) => path === p || path.startsWith(`${p}/`));
}

// Not URL.canParse: older Android System WebViews that Telegram may run in lack it.
function parse(href: string, origin: string): URL | null {
  try {
    return new URL(href, origin);
  } catch {
    return null;
  }
}

export function linkAction({ href, origin }: { href: string; origin: string }): LinkAction {
  const url = parse(href, origin);
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) return { kind: "app" };
  if (TELEGRAM_HOSTS.has(url.hostname)) return { kind: "telegram", url: url.href };
  if (url.origin !== origin || browserOnly(url.pathname)) return { kind: "browser", url: url.href };
  return { kind: "app" };
}
