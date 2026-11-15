// Internal: runs one queued job inside a request (see src/jobs/worker.ts). Only this server's worker holds the secret.
import { z } from "zod";
import { publishSong } from "@/db/publish";
import { ensureSongRhythms } from "@/db/rhythms";
import { findBySourceUrl, getSong } from "@/db/songs";
import { ImportJobData, isJobCaller, QUEUES, RhythmJobData } from "@/jobs/boss";
import { importSong } from "@/lib/ai";
import { fetchPage } from "@/lib/crawl";
import { runImport } from "@/lib/import-job";

const Body = z.discriminatedUnion("queue", [
  z.object({ queue: z.literal(QUEUES.importSong), data: ImportJobData }),
  z.object({ queue: z.literal(QUEUES.songRhythms), data: RhythmJobData }),
]);

async function run(body: z.infer<typeof Body>): Promise<object> {
  switch (body.queue) {
    case QUEUES.importSong: {
      const { url, user } = body.data;
      return runImport({ url, deps: { findBySourceUrl, fetchPage, importSong, publish: (draft) => publishSong({ user, input: draft }) } });
    }
    case QUEUES.songRhythms: {
      const song = await getSong(body.data.slug);
      // Deleted since it was queued: nothing to do, and retrying would not change that.
      if (!song) return { skipped: "song not found" };
      return { rhythms: (await ensureSongRhythms(song)).map((r) => r.slug) };
    }
    default: {
      const _exhaustive: never = body;
      return _exhaustive;
    }
  }
}

export async function POST(req: Request) {
  if (!isJobCaller(req.headers.get("authorization"))) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: `bad job: ${body.error.message}` }, { status: 400 });
  try {
    return Response.json(await run(body.data));
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
