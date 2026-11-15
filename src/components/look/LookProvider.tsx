"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";
import { PREF_COOKIE, prefCookie, type Mode, type Prefs } from "@/lib/prefs";
import { skinById, type SkinId } from "@/themes";
import type { Skin } from "@/themes/types";

type Look = {
  prefs: Prefs<SkinId>;
  skin: Skin;
  /** The visitor's choice: saved, and from then on it wins over followMode. */
  setMode: (mode: Mode) => void;
  /** A mode suggested by the surroundings (e.g. Telegram's theme): applied, not saved, and ignored once the visitor has chosen. */
  followMode: (mode: Mode) => void;
  setSkin: (skin: SkinId) => void;
  setGlow: (on: boolean) => void;
};

const LookContext = createContext<Look | null>(null);

function writeCookie({ name, value }: { name: string; value: string }) {
  document.cookie = prefCookie({ name, value });
}

/**
 * The visitor's day/night mode, skin and glow toggle. The server renders <html data-*> from the cookies,
 * so the first paint is already right; changes here update the attributes and cookies in place, without a reload.
 * Each setter saves only its own cookie, so a missing mode cookie keeps meaning "not chosen yet".
 */
export function LookProvider({ initial, children }: { initial: Prefs<SkinId>; children: React.ReactNode }) {
  const [prefs, setPrefs] = useState(initial);

  // Before paint, so a change never shows a frame in the old mode. On mount it matches the server's attributes.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = prefs.mode;
    root.dataset.skin = prefs.skin;
    root.dataset.glow = prefs.glow ? "on" : "off";
  }, [prefs.mode, prefs.skin, prefs.glow]);

  const setMode = useCallback((mode: Mode) => {
    setPrefs((p) => ({ ...p, mode, modeSaved: true }));
    writeCookie({ name: PREF_COOKIE.mode, value: mode });
  }, []);
  const followMode = useCallback((mode: Mode) => setPrefs((p) => (p.modeSaved || p.mode === mode ? p : { ...p, mode })), []);
  const setSkin = useCallback((skin: SkinId) => {
    setPrefs((p) => ({ ...p, skin }));
    writeCookie({ name: PREF_COOKIE.skin, value: skin });
  }, []);
  const setGlow = useCallback((glow: boolean) => {
    setPrefs((p) => ({ ...p, glow }));
    writeCookie({ name: PREF_COOKIE.glow, value: glow ? "on" : "off" });
  }, []);

  const look = useMemo<Look>(
    () => ({ prefs, skin: skinById(prefs.skin), setMode, followMode, setSkin, setGlow }),
    [prefs, setMode, followMode, setSkin, setGlow],
  );
  return <LookContext.Provider value={look}>{children}</LookContext.Provider>;
}

export function useLook(): Look {
  const look = useContext(LookContext);
  if (!look) throw new Error("useLook must be used inside <LookProvider>");
  return look;
}
