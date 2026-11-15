import { describe, expect, it } from "vitest";
import { linkAction } from "./links";

const origin = "https://hopam.tyvn.online";

describe("linkAction", () => {
  it("lets in-app pages navigate inside the Mini App", () => {
    expect(linkAction({ href: "/bai-hat/de-no-den", origin })).toEqual({ kind: "app" });
    expect(linkAction({ href: "/#hop-am", origin })).toEqual({ kind: "app" });
    expect(linkAction({ href: `${origin}/agents`, origin })).toEqual({ kind: "app" });
  });

  it("opens other sites in the external browser", () => {
    expect(linkAction({ href: "https://github.com/x/y", origin })).toEqual({ kind: "browser", url: "https://github.com/x/y" });
  });

  it("opens t.me links inside Telegram", () => {
    expect(linkAction({ href: "https://t.me/HopAmBot", origin })).toEqual({ kind: "telegram", url: "https://t.me/HopAmBot" });
    expect(linkAction({ href: "https://telegram.me/x", origin })).toEqual({ kind: "telegram", url: "https://telegram.me/x" });
  });

  it("sends sign-in, admin pages and raw files to the browser, since they leave the app or need a WorkOS session", () => {
    for (const path of ["/sign-in", "/sign-in?returnTo=%2Fcli", "/cli", "/cli?code=AB", "/admin/bai-hat/moi", "/agents.md", "/api/songs"])
      expect(linkAction({ href: path, origin })).toEqual({ kind: "browser", url: `${origin}${path}` });
  });

  it("does not treat look-alike paths as browser-only", () => {
    expect(linkAction({ href: "/client", origin })).toEqual({ kind: "app" });
    expect(linkAction({ href: "/administrator", origin })).toEqual({ kind: "app" });
  });

  it("leaves non-web links to the webview", () => {
    expect(linkAction({ href: "mailto:a@b.c", origin })).toEqual({ kind: "app" });
  });
});
