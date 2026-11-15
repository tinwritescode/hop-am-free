"use client";

import { useSyncExternalStore } from "react";
import type { z } from "zod";

/**
 * A value kept in localStorage, one copy per page so every component sees a change at once (and other tabs via
 * "storage"). Reads as `empty` on the server, until hydrated, and when storage is blocked or holds something invalid.
 */
export function localStore<T>({ key, schema, empty }: { key: string; schema: z.ZodType<T>; empty: T }) {
  let current: T | null = null;
  const listeners = new Set<() => void>();

  const load = (): T => {
    try {
      const parsed = schema.safeParse(JSON.parse(localStorage.getItem(key) ?? "null"));
      return parsed.success ? parsed.data : empty;
    } catch {
      return empty; // blocked storage or bad JSON: start empty
    }
  };
  /** The latest value; read this, not a render's copy, when changing it, so two quick taps both count. */
  const get = (): T => (current ??= load());
  const subscribe = (onChange: () => void) => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      current = load();
      onChange();
    };
    listeners.add(onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  };
  const set = (next: T) => {
    current = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // private mode: the change lasts for this page only
    }
    for (const l of listeners) l();
  };
  const useValue = () => useSyncExternalStore(subscribe, get, () => empty);
  return { get, set, useValue };
}
