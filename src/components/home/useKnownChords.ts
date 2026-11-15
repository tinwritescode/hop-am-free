"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

const STORAGE_KEY = "hopamfree:known-chords";
const Stored = z.array(z.string().min(1).max(16)).max(200);
const EMPTY: ReadonlySet<string> = new Set();

// One store for the whole page, so every chip, row and card sees a toggle at once (and other tabs via "storage").
let current: ReadonlySet<string> | null = null;
const listeners = new Set<() => void>();

function load(): ReadonlySet<string> {
  try {
    const parsed = Stored.safeParse(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
    return parsed.success ? new Set(parsed.data) : EMPTY;
  } catch {
    return EMPTY; // blocked storage or bad JSON: start empty
  }
}

function snapshot(): ReadonlySet<string> {
  current ??= load();
  return current;
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    current = load();
    onChange();
  };
  listeners.add(onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function save(next: ReadonlySet<string>) {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // private mode: the choice lasts for this page only
  }
  for (const l of listeners) l();
}

/** The chords this visitor says they can play. Lives in localStorage only; empty on the server and until hydrated. */
export function useKnownChords() {
  const known = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  /** Adds or removes one chord; returns the new set. */
  const toggle = (chord: string): ReadonlySet<string> => {
    const next = new Set(snapshot()); // the store, not this render's `known`: two quick taps both count
    if (next.has(chord)) next.delete(chord);
    else next.add(chord);
    save(next);
    return next;
  };
  return { known, toggle };
}
