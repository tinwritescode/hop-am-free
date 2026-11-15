"use client";

import { z } from "zod";
import { localStore } from "@/components/store/localStore";
import { SETLIST_MAX, SLUG } from "@/lib/setlist";

export type SetlistItem = { slug: string; title: string };

const EMPTY: readonly SetlistItem[] = [];
const store = localStore({
  key: "hopamfree:setlist",
  schema: z
    .array(z.object({ slug: z.string().max(100).regex(SLUG), title: z.string().min(1).max(120) }))
    .max(SETLIST_MAX)
    .readonly(),
  empty: EMPTY,
});

/** This visitor's own setlist, in singing order. Lives in localStorage; shared with others as a link (see lib/setlist). */
export function useSetlist() {
  const items = store.useValue();
  const without = (slug: string) => store.get().filter((i) => i.slug !== slug);
  return {
    items,
    full: items.length >= SETLIST_MAX,
    has: (slug: string) => items.some((i) => i.slug === slug),
    /** Adds the song at the end, or takes it out. */
    toggle: (item: SetlistItem) => {
      const rest = without(item.slug);
      if (rest.length < store.get().length) store.set(rest);
      else if (rest.length < SETLIST_MAX) store.set([...rest, item]);
    },
    remove: (slug: string) => store.set(without(slug)),
    /** Moves a song one place up (-1) or down (+1). */
    move: (slug: string, by: -1 | 1) => {
      const list = [...store.get()];
      const from = list.findIndex((i) => i.slug === slug);
      const to = from + by;
      if (from < 0 || to < 0 || to >= list.length) return;
      [list[from], list[to]] = [list[to], list[from]];
      store.set(list);
    },
    replace: (next: readonly SetlistItem[]) => store.set(next.slice(0, SETLIST_MAX)),
  };
}
