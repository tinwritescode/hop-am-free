// What one queued import does: crawl, let the AI clean the sheet, publish when it is safe to.
import { z } from "zod";
import type { Publish } from "@/db/publish";
import type { PageText } from "./crawl";
import { CapoDraftSchema } from "./capo";
import { unknownChords, type SongDraft } from "./song";

/** SongDraft's shape without its rules: a draft an admin still has to finish. */
export const LooseDraftSchema = z.object({
  title: z.string().catch(""),
  artist: z.string().catch(""),
  composer: z.string().catch(""),
  key: z.string().catch(""),
  genre: z.string().catch(""),
  rhythm: z.string().catch(""),
  sheet: z.string().catch(""),
  sourceUrl: z.string().nullable().catch(null),
  capo: CapoDraftSchema.catch(null),
}) satisfies z.ZodType<SongDraft>;

/** The import produced a draft an admin must finish (bad fields, or the AI refused); asking the AI again rarely helps. */
export class InvalidDraftError extends Error {
  readonly reason: string;
  readonly partial: Omit<SongDraft, "sourceUrl">;
  constructor({ reason, partial }: { reason: string; partial: Omit<SongDraft, "sourceUrl"> }) {
    super(reason);
    this.reason = reason;
    this.partial = partial;
  }
}

/** A job's output. Errors are not outcomes: the handler throws them so the queue retries. */
export const ImportOutcomeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("published"), slug: z.string() }),
  z.object({ kind: z.literal("duplicate"), slug: z.string() }),
  // An admin fixes the draft and publishes it by hand (the "Sửa nháp" link, or `hopamfree create`).
  z.object({ kind: z.literal("review"), reason: z.string(), draft: LooseDraftSchema, unknownChords: z.array(z.string()) }),
]);
export type ImportOutcome = z.infer<typeof ImportOutcomeSchema>;

export type ImportDeps = {
  findBySourceUrl: (url: string) => Promise<{ slug: string } | null>;
  fetchPage: (url: string) => Promise<PageText>;
  importSong: (args: { url: string; page: PageText }) => Promise<Omit<SongDraft, "sourceUrl">>;
  publish: (draft: SongDraft) => Promise<Publish>;
};

export async function runImport({ url, deps }: { url: string; deps: ImportDeps }): Promise<ImportOutcome> {
  const dup = await deps.findBySourceUrl(url);
  if (dup) return { kind: "duplicate", slug: dup.slug };
  const page = await deps.fetchPage(url);
  let imported: Omit<SongDraft, "sourceUrl">;
  try {
    imported = await deps.importSong({ url, page });
  } catch (err) {
    if (!(err instanceof InvalidDraftError)) throw err;
    const draft = { ...err.partial, sourceUrl: url };
    return { kind: "review", reason: err.reason, draft, unknownChords: unknownChords(draft.sheet) };
  }
  const draft: SongDraft = { ...imported, sourceUrl: url };
  const missing = unknownChords(draft.sheet);
  if (missing.length) return { kind: "review", reason: `Hợp âm chưa có hình bấm: ${missing.join(", ")}`, draft, unknownChords: missing };

  const res = await deps.publish(draft);
  if (res.ok) return { kind: "published", slug: res.song.slug };
  if (res.status === 409 && res.slug) return { kind: "duplicate", slug: res.slug };
  if (res.status === 403) throw new Error(res.error);
  return { kind: "review", reason: res.error, draft, unknownChords: [] };
}
