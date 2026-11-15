import { hasLaunchHint } from "./webapp";

// Loading telegram-web-app.js only when the page may be a Mini App, so ordinary visits never download it.

/** The script URL as Telegram's docs give it. */
const SDK_URL = "https://telegram.org/js/telegram-web-app.js?65";

const REMEMBER_KEY = "haf-telegram";

// sessionStorage can be missing or throw (privacy modes, some iframes); then a full reload just loses the hint.
function remembered(): boolean {
  try {
    return window.sessionStorage.getItem(REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
}

/** Marks this tab's session as a Mini App, so full reloads (which lose the URL fragment) load the script again. */
export function rememberTelegram(): void {
  try {
    window.sessionStorage.setItem(REMEMBER_KEY, "1");
  } catch {}
}

export function mayBeTelegram(): boolean {
  return hasLaunchHint({ hash: window.location.hash, remembered: remembered() });
}

let loading: Promise<void> | null = null;

/** Adds the script once; resolves when it has run, or rejects if it failed to load. */
export function loadTelegramSdk(): Promise<void> {
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("telegram-web-app.js failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}
