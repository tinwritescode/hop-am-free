"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { RhythmPatternSchema, type SongRhythm } from "@/lib/rhythm";

const RhythmsResponse = z.union([
  z.object({ rhythms: z.array(z.intersection(RhythmPatternSchema, z.object({ slug: z.string(), reason: z.string() }))) }),
  z.object({ error: z.string() }),
]);

export type RhythmsLoad = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; rhythms: SongRhythm[] };

/** The song's suggested rhythms: the saved ones, or else Mầm picks some once per page view. */
export function useRhythms({ slug, initial }: { slug: string; initial: SongRhythm[] }) {
  const [load, setLoad] = useState<RhythmsLoad>(initial.length ? { status: "ready", rhythms: initial } : { status: "loading" });

  const fetchRhythms = async () => {
    setLoad({ status: "loading" });
    try {
      const res = RhythmsResponse.parse(await fetch(`/api/songs/${encodeURIComponent(slug)}/rhythms`, { method: "POST" }).then((r) => r.json()));
      setLoad("error" in res ? { status: "error", message: res.error } : { status: "ready", rhythms: res.rhythms });
    } catch {
      setLoad({ status: "error", message: "Mầm chưa chọn được điệu, thử lại sau nhé" });
    }
  };
  const asked = useRef(false);
  useEffect(() => {
    if (initial.length || asked.current) return;
    asked.current = true;
    void fetchRhythms();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ask once per page view
  }, []);

  return { load, retry: () => void fetchRhythms() };
}
