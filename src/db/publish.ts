import "server-only";
import type { CurrentUser } from "./auth";
import { songChanged } from "./read-cache";
import { createSong, findBySourceUrl } from "./songs";
import { SongDraftSchema, type Song } from "@/lib/song";
import { enqueueRhythms } from "@/jobs/boss";
import { describeIssues } from "@/lib/zod-issues";

export type Publish = { ok: true; song: Song } | { ok: false; status: 400 | 403 | 409; error: string; slug?: string };

/** Validates and saves a song for an admin, refusing a source link that was already imported, then queues the AI rhythm pick. */
export async function publishSong({ user, input }: { user: CurrentUser | null; input: unknown }): Promise<Publish> {
  if (!user?.isAdmin) return { ok: false, status: 403, error: "Chỉ admin được tạo bài" };
  const draft = SongDraftSchema.safeParse(input);
  if (!draft.success) return { ok: false, status: 400, error: describeIssues(draft.error) };
  if (draft.data.sourceUrl) {
    const dup = await findBySourceUrl(draft.data.sourceUrl);
    if (dup) return { ok: false, status: 409, error: `Link này đã được đăng: /bai-hat/${dup.slug}`, slug: dup.slug };
  }

  const song = await createSong({ draft: draft.data, contributor: user.name, createdBy: user.id });
  songChanged(song.slug);
  // The song page also asks on first view, so a queue outage only delays suggestions; queued, they are usually ready by then.
  await enqueueRhythms(song.slug).catch((err: unknown) =>
    console.error("rhythm job not queued", { slug: song.slug, err: err instanceof Error ? err.message : String(err) }),
  );
  return { ok: true, song };
}
