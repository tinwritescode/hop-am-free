import "server-only";
import { eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from ".";
import { aiCache } from "./schema";

const inflight = new Map<string, Promise<unknown>>();

/**
 * Returns the stored value for `key`, or computes, stores and returns it.
 * Concurrent callers in this process share one computation; a stored value that no longer fits `schema` is recomputed.
 */
export async function cached<S extends z.ZodType>({ key, schema, compute }: { key: string; schema: S; compute: () => Promise<z.infer<S>> }): Promise<z.infer<S>> {
  const [row] = await db().select({ value: aiCache.value }).from(aiCache).where(eq(aiCache.key, key));
  const hit = row ? schema.safeParse(row.value) : null;
  if (hit?.success) return hit.data;

  const running = inflight.get(key);
  if (running) return schema.parse(await running);
  const job = compute()
    .then(async (value) => {
      await db()
        .insert(aiCache)
        .values({ key, value })
        .onConflictDoUpdate({ target: aiCache.key, set: { value, createdAt: new Date() } });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}
