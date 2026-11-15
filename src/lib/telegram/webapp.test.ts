import { describe, expect, it } from "vitest";
import { hoianTokens } from "@/themes/hoian/tokens";
import { applyChrome, colorMode, hasLaunchHint, offscreenBottom, telegramWebApp } from "./webapp";

// A stand-in for what telegram-web-app.js puts on window.Telegram.WebApp, recording the calls the app makes.
// The real script defines every method whatever the client version; isVersionAtLeast reports what the client supports.
function fakeWebApp({ platform = "ios", version = "8.0", colorScheme = "light", viewportStableHeight = 800 }: { platform?: string; version?: string; colorScheme?: string; viewportStableHeight?: unknown } = {}) {
  const calls: string[] = [];
  const record = (name: string) => (arg?: unknown) => void calls.push(arg === undefined ? name : `${name}(${String(arg)})`);
  const atLeast = (want: string) => {
    const [a, b] = [version, want].map((v) => v.split(".").map(Number));
    for (let i = 0; i < 2; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
    return true;
  };
  const webApp = {
    platform,
    version,
    initData: "",
    colorScheme,
    viewportStableHeight,
    isVersionAtLeast: atLeast,
    ready: record("ready"),
    expand: record("expand"),
    setHeaderColor: record("setHeaderColor"),
    setBackgroundColor: record("setBackgroundColor"),
    setBottomBarColor: record("setBottomBarColor"),
    onEvent: record("onEvent"),
    offEvent: record("offEvent"),
    openLink: record("openLink"),
    openTelegramLink: record("openTelegramLink"),
    BackButton: { show: record("BackButton.show"), hide: record("BackButton.hide"), onClick: record("BackButton.onClick"), offClick: record("BackButton.offClick") },
  };
  return { calls, win: { Telegram: { WebApp: webApp } } };
}

/** The detected WebApp for a fake client, failing the test if detection misses it. */
function detected(options: Parameters<typeof fakeWebApp>[0] = {}) {
  const { calls, win } = fakeWebApp(options);
  const webApp = telegramWebApp(win);
  if (!webApp) throw new Error("fake Telegram client not detected");
  return { calls, webApp };
}

describe("telegramWebApp (detection)", () => {
  it("finds the WebApp when Telegram launched the page", () => {
    expect(telegramWebApp(fakeWebApp().win)).not.toBeNull();
  });

  it("ignores the script's object in an ordinary browser, where the platform stays 'unknown'", () => {
    expect(telegramWebApp(fakeWebApp({ platform: "unknown" }).win)).toBeNull();
  });

  it("ignores a missing or malformed window.Telegram", () => {
    expect(telegramWebApp({})).toBeNull();
    expect(telegramWebApp({ Telegram: {} })).toBeNull();
    expect(telegramWebApp({ Telegram: { WebApp: { platform: "ios" } } })).toBeNull();
    expect(telegramWebApp(undefined)).toBeNull();
  });
});

describe("colorMode", () => {
  it("maps Telegram's colour scheme to the site's day/night mode", () => {
    expect(colorMode(detected({ colorScheme: "dark" }).webApp)).toBe("night");
    expect(colorMode(detected({ colorScheme: "light" }).webApp)).toBe("day");
  });

  it("treats an unexpected value as light", () => {
    expect(colorMode(detected({ colorScheme: "sepia" }).webApp)).toBe("day");
  });
});

describe("applyChrome", () => {
  const run = (version: string, mode: "day" | "night" = "day") => {
    const { calls, webApp } = detected({ version });
    applyChrome({ webApp, tokens: hoianTokens[mode] });
    return calls;
  };

  it("paints Telegram's header with the site's header bar and the background and bottom bar with the page colour", () => {
    expect(run("8.0")).toEqual(["setHeaderColor(#3A1B3E)", "setBackgroundColor(#FFFDF8)", "setBottomBarColor(#FFFDF8)"]);
    expect(run("8.0", "night")).toEqual(["setHeaderColor(#1E0C22)", "setBackgroundColor(#2A122E)", "setBottomBarColor(#2A122E)"]);
  });

  it("only calls what the client supports", () => {
    expect(run("7.0")).toEqual(["setHeaderColor(#3A1B3E)", "setBackgroundColor(#FFFDF8)"]);
    expect(run("6.4")).toEqual(["setBackgroundColor(#FFFDF8)"]);
    expect(run("6.0")).toEqual([]);
  });

  it("skips a token that is not a #RRGGBB colour", () => {
    const { calls, webApp } = detected();
    applyChrome({ webApp, tokens: { ...hoianTokens.day, base: { ...hoianTokens.day.base, bar: "rgba(0,0,0,.5)" } } });
    expect(calls).toEqual(["setBackgroundColor(#FFFDF8)", "setBottomBarColor(#FFFDF8)"]);
  });
});

describe("offscreenBottom", () => {
  const app = (h: unknown) => detected({ viewportStableHeight: h }).webApp;

  it("is how much of the page sits below the visible part of a half-open Mini App", () => {
    expect(offscreenBottom({ webApp: app(500), innerHeight: 800 })).toBe(300);
  });

  it("is zero when the Mini App is fully open, or the height is not known yet", () => {
    expect(offscreenBottom({ webApp: app(800), innerHeight: 800 })).toBe(0);
    expect(offscreenBottom({ webApp: app(900), innerHeight: 800 })).toBe(0);
    expect(offscreenBottom({ webApp: app(false), innerHeight: 800 })).toBe(0);
  });
});

describe("hasLaunchHint", () => {
  it("is set by the launch parameters Telegram puts in the URL fragment", () => {
    expect(hasLaunchHint({ hash: "#tgWebAppData=query_id%3D1&tgWebAppVersion=8.0&tgWebAppPlatform=ios", remembered: false })).toBe(true);
    expect(hasLaunchHint({ hash: "#tgWebAppVersion=6.0&tgWebAppPlatform=tdesktop", remembered: false })).toBe(true);
  });

  it("is set after a full reload inside a session that was launched by Telegram", () => {
    expect(hasLaunchHint({ hash: "", remembered: true })).toBe(true);
  });

  it("is not set in an ordinary visit, so normal browsers never download Telegram's script", () => {
    expect(hasLaunchHint({ hash: "", remembered: false })).toBe(false);
    expect(hasLaunchHint({ hash: "#hop-am", remembered: false })).toBe(false);
    expect(hasLaunchHint({ hash: "#notgWebAppVersion=1", remembered: false })).toBe(false);
  });
});
