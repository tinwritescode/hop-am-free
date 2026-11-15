"use client";

import { useMemo } from "react";
import { z } from "zod";
import { localStore } from "@/components/store/localStore";

const EMPTY: readonly string[] = [];
const store = localStore({ key: "hopamfree:known-chords", schema: z.array(z.string().min(1).max(16)).max(200).readonly(), empty: EMPTY });

/** The chords this visitor says they can play. Lives in localStorage only; empty on the server and until hydrated. */
export function useKnownChords() {
  const list = store.useValue();
  const known: ReadonlySet<string> = useMemo(() => new Set(list), [list]);
  /** Adds or removes one chord; returns the new set. */
  const toggle = (chord: string): ReadonlySet<string> => {
    const next = new Set(store.get());
    if (next.has(chord)) next.delete(chord);
    else next.add(chord);
    store.set([...next]);
    return next;
  };
  return { known, toggle };
}
