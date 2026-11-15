// Telegram's BackButton: shown on every page but home, it walks back through the pages opened inside the Mini App.

export function backButtonVisible(pathname: string): boolean {
  return pathname !== "/";
}

export type BackStack = {
  /** Call on every route change, including the first page. */
  visit: () => void;
  /** What a BackButton press should do: step back in history, or (nothing to go back to) replace the page with home. */
  back: () => "history" | "home";
};

/**
 * Counts in-app navigations instead of reading history.length, which in Telegram Web's iframe also counts the
 * parent page's history. Every back in the Mini App goes through the BackButton (Android's system back included),
 * so the count stays true; a full reload starts over, and then back falls back to home.
 */
export function createBackStack(): BackStack {
  let depth = -1; // the first visit is the landing page, depth 0
  let returning = false;
  return {
    visit() {
      if (returning) returning = false;
      else depth++;
    },
    back() {
      if (depth > 0) {
        depth--;
        returning = true;
        return "history";
      }
      depth = -1; // home replaces the landing page and becomes the new bottom
      return "home";
    },
  };
}
