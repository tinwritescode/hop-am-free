"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLook } from "@/components/look/LookProvider";
import type { Mode } from "@/lib/prefs";
import { backButtonVisible, createBackStack, type BackStack } from "@/lib/telegram/back";
import { linkAction } from "@/lib/telegram/links";
import { loadTelegramSdk, mayBeTelegram, rememberTelegram } from "@/lib/telegram/sdk";
import { applyChrome, colorMode, offscreenBottom, supports, telegramWebApp, type TelegramWebApp } from "@/lib/telegram/webapp";

const TelegramContext = createContext<TelegramWebApp | null>(null);

/** The Mini App's WebApp, or null in an ordinary browser (and until telegram-web-app.js has loaded). */
export function useTelegram(): TelegramWebApp | null {
  return useContext(TelegramContext);
}

function useWebApp(followMode: (mode: Mode) => void): TelegramWebApp | null {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  useEffect(() => {
    if (!mayBeTelegram()) return;
    let live = true;
    loadTelegramSdk().then(
      () => {
        const app = telegramWebApp(window);
        if (!live || !app) return;
        rememberTelegram();
        // Batched with setWebApp, so the first chrome colours and ready() already see Telegram's scheme.
        followMode(colorMode(app));
        setWebApp(app);
      },
      (err: unknown) => console.warn("telegram: SDK unavailable, running as a plain site", { err: err instanceof Error ? err.message : String(err) }),
    );
    return () => {
      live = false;
    };
  }, [followMode]);
  return webApp;
}

/**
 * Makes the site behave as a Telegram Mini App when Telegram launched it, and does nothing otherwise
 * (telegram-web-app.js is not even downloaded). Everything Telegram-specific is wired here.
 */
export function TelegramBridge({ children }: { children: React.ReactNode }) {
  const { prefs, skin, followMode } = useLook();
  const webApp = useWebApp(followMode);
  const pathname = usePathname();
  const router = useRouter();

  // Follow Telegram's day/night until the visitor picks one; track the visible height; let CSS apply Telegram's insets.
  useEffect(() => {
    if (!webApp) return;
    const root = document.documentElement;
    const onTheme = () => followMode(colorMode(webApp));
    const onViewport = () => root.style.setProperty("--app-offscreen-bottom", `${offscreenBottom({ webApp, innerHeight: window.innerHeight })}px`);
    root.dataset.tg = "on";
    onViewport();
    webApp.onEvent("themeChanged", onTheme);
    webApp.onEvent("viewportChanged", onViewport);
    window.addEventListener("resize", onViewport);
    return () => {
      webApp.offEvent("themeChanged", onTheme);
      webApp.offEvent("viewportChanged", onViewport);
      window.removeEventListener("resize", onViewport);
      delete root.dataset.tg;
      root.style.removeProperty("--app-offscreen-bottom");
    };
  }, [webApp, followMode]);

  // Telegram's header, background and bottom bar in the skin's colours, repainted when the mode or skin changes.
  const tokens = skin.tokens[prefs.mode];
  useEffect(() => {
    if (webApp) applyChrome({ webApp, tokens });
  }, [webApp, tokens]);

  // After the colours above (effects run in order), so Telegram's placeholder lifts onto the right theme.
  useEffect(() => {
    if (!webApp) return;
    webApp.expand();
    webApp.ready();
  }, [webApp]);

  useBackButton({ webApp, pathname, router });
  useExternalLinks(webApp);

  return <TelegramContext.Provider value={webApp}>{children}</TelegramContext.Provider>;
}

type Router = ReturnType<typeof useRouter>;

function useBackButton({ webApp, pathname, router }: { webApp: TelegramWebApp | null; pathname: string; router: Router }) {
  const stack = useRef<BackStack>(null);
  const visited = useRef<string>(null);

  // Counted from the first page on, before Telegram is detected, so the landing page is the bottom of the stack.
  useEffect(() => {
    if (visited.current === pathname) return; // a re-run (Strict Mode), not a navigation
    visited.current = pathname;
    stack.current ??= createBackStack();
    stack.current.visit();
  }, [pathname]);

  useEffect(() => {
    if (!webApp || !supports(webApp, "6.1")) return;
    if (backButtonVisible(pathname)) webApp.BackButton.show();
    else webApp.BackButton.hide();
  }, [webApp, pathname]);

  useEffect(() => {
    if (!webApp || !supports(webApp, "6.1")) return;
    const onClick = () => {
      if ((stack.current?.back() ?? "home") === "history") router.back();
      else router.replace("/");
    };
    webApp.BackButton.onClick(onClick);
    return () => webApp.BackButton.offClick(onClick);
  }, [webApp, router]);
}

/**
 * Taps on links that would take the webview off the site open through Telegram instead: t.me links in Telegram,
 * everything else (and the sign-in and admin pages, see linkAction) in the external browser. Capture phase on window,
 * so it runs before next/link's own click handling.
 */
function useExternalLinks(webApp: TelegramWebApp | null) {
  useEffect(() => {
    if (!webApp) return;
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download")) return;
      const action = linkAction({ href: anchor.href, origin: window.location.origin });
      if (action.kind === "app") return;
      e.preventDefault();
      e.stopPropagation();
      if (action.kind === "telegram") webApp.openTelegramLink(action.url);
      else webApp.openLink(action.url);
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [webApp]);
}
