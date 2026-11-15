import "server-only";
import { and, eq, inArray, isNull, or, type SQL } from "drizzle-orm";
import { db } from ".";
import { songs } from "./schema";
import { REPLACEABLE, type CapoColumns, type CapoSource } from "@/lib/capo";

/** A capo value with who set it (unknown-by-nobody is not something you write). */
export type CapoWrite = CapoColumns & { capoSource: CapoSource };

/**
 * Sets a song's capo unless a stronger source already set it (mayReplace in src/lib/capo.ts, as SQL). Returns false when nothing changed hands
 * (song missing, or kept), so reruns of the backfill are no-ops.
 */
export async function writeCapo({ where, value }: { where: { id: number } | { slug: string }; value: CapoWrite }): Promise<boolean> {
  const song: SQL = "id" in where ? eq(songs.id, where.id) : eq(songs.slug, where.slug);
  const replaceable = REPLACEABLE[value.capoSource];
  const open = replaceable.length ? or(isNull(songs.capoSource), inArray(songs.capoSource, replaceable)) : isNull(songs.capoSource);
  const rows = await db().update(songs).set(value).where(and(song, open)).returning({ id: songs.id });
  return rows.length === 1;
}
