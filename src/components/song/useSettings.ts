"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, parseSettings, type Settings } from "@/lib/settings";

const STORAGE_KEY = "hopamfree:settings";

function readLocal(): Settings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseSettings(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocal(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // private mode or blocked storage: settings just won't persist
  }
}

const saveRemote = (s: Settings) =>
  fetch("/api/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(s) }).catch(() => undefined);

/**
 * Signed out: settings live in localStorage. Signed in: they come from the user's row (`saved`) and are written back to it.
 * A signed-in user with no row yet adopts whatever this browser had.
 */
export function useSettings({ saved, signedIn }: { saved: Settings | null; signedIn: boolean }) {
  const [settings, setSettings] = useState<Settings>(saved ?? DEFAULT_SETTINGS);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (saved) return;
    const local = readLocal();
    if (!local) return;
    setSettings(local);
    if (signedIn) void saveRemote(local);
  }, [saved, signedIn]);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    writeLocal(next);
    if (!signedIn) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void saveRemote(next), 500); // A+/A− clicks come in bursts
  };

  return { settings, update };
}
