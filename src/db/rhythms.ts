import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from ".";
import { rhythms, songRhythms } from "./schema";
import { suggestRhythms } from "@/lib/ai";
import { planRhythms, RhythmPatternSchema, type SongRhythm } from "@/lib/rhythm";
import type { Song } from "@/lib/song";
import { cachedRhythms, rhythmsChanged } from "./read-cache";

/** For pages: cached across requests, refreshed when ensureSongRhythms adds links. */
export async function getSongRhythms(songId: number): Promise<SongRhythm[]> {
  return cachedRhythms({ songId, read: () => readSongRhythms(songId) });
}

async function readSongRhythms(songId: number): Promise<SongRhythm[]> {
  const rows = await db()
    .select({ slug: rhythms.slug, reason: songRhythms.reason, pattern: rhythms })
    .from(songRhythms)
    .innerJoin(rhythms, eq(rhythms.id, songRhythms.rhythmId))
    .where(eq(songRhythms.songId, songId))
    .orderBy(asc(songRhythms.rank));
  return rows.flatMap(({ slug, reason, pattern }) => {
    const p = RhythmPatternSchema.safeParse(pattern);
    return p.success ? [{ ...p.data, slug, reason }] : [];
  });
}

const inflight = new Map<number, Promise<SongRhythm[]>>();

/**
 * The song's rhythm suggestions, asking the AI on first use. A rhythm nobody has yet becomes a new `rhythms` row,
 * so later songs reuse it. Safe to call repeatedly or concurrently: links and slugs are unique.
 */
export function ensureSongRhythms(song: Song): Promise<SongRhythm[]> {
  const running = inflight.get(song.id);
  if (running) return running;
  const job = (async () => {
    const existing = await readSongRhythms(song.id);
    if (existing.length) return existing;

    const catalog = await db().select({ slug: rhythms.slug, name: rhythms.name, timeSignature: rhythms.timeSignature }).from(rhythms);
    const plan = planRhythms({ existing: catalog.map((r) => r.slug), suggestions: await suggestRhythms({ song, catalog }) });
    const fresh = plan.flatMap((p) => (p.pattern ? [{ slug: p.slug, ...p.pattern }] : []));
    if (fresh.length) await db().insert(rhythms).values(fresh).onConflictDoNothing({ target: rhythms.slug });

    const ids = new Map(
      (await db().select({ id: rhythms.id, slug: rhythms.slug }).from(rhythms).where(inArray(rhythms.slug, plan.map((p) => p.slug)))).map((r) => [r.slug, r.id]),
    );
    const links = plan.flatMap((p, rank) => {
      const rhythmId = ids.get(p.slug);
      return rhythmId ? [{ songId: song.id, rhythmId, rank, reason: p.reason }] : [];
    });
    if (links.length) await db().insert(songRhythms).values(links).onConflictDoNothing();
    rhythmsChanged(song.id);
    return readSongRhythms(song.id);
  })().finally(() => inflight.delete(song.id));
  inflight.set(song.id, job);
  return job;
}
