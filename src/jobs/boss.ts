// The pg-boss job queue (tables in the `pgboss` schema of the app database): queue names, job payloads,
// and the reads and writes the API routes and admin page use. Workers live in ./worker.ts.
import "server-only";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { PgBoss, type JobWithMetadata, type Queue } from "pg-boss";
import { z } from "zod";
import { databaseUrl } from "@/db";
import { ImportOutcomeSchema, type ImportOutcome } from "@/lib/import-job";
import { bearerToken, hashSecret, newSecret } from "@/lib/cli-auth";
import { jobStatus, progress, type JobState, type JobStatus, type Progress } from "@/lib/jobs";
import { pgSsl } from "@/lib/pg";

export const QUEUES = { importSong: "import-song", songRhythms: "song-rhythms" } as const;
export const QueueName = z.enum([QUEUES.importSong, QUEUES.songRhythms]);
export type QueueName = z.infer<typeof QueueName>;

export const ImportJobData = z.object({
  url: z.url(),
  batchId: z.uuid(),
  // The admin who queued it; the job publishes under their name.
  user: z.object({ id: z.string(), email: z.string(), name: z.string(), isAdmin: z.literal(true) }),
});
export type ImportJobData = z.infer<typeof ImportJobData>;
export const RhythmJobData = z.object({ slug: z.string() });

// exclusive + singletonKey: at most one queued or running job per link (imports) or per song (rhythms).
const QUEUE_OPTIONS = {
  policy: "exclusive",
  retryLimit: 3,
  retryDelay: 30,
  retryBackoff: true,
  expireInSeconds: 300,
} satisfies Omit<Queue, "name">;

declare global {
  var __boss: Promise<PgBoss> | undefined;
  var __jobSecret: string | undefined;
}

async function start(): Promise<PgBoss> {
  const url = databaseUrl();
  // Small pool: the app's own postgres-js pool already holds 5 Supabase session-pooler connections.
  const boss = new PgBoss({ connectionString: url, ssl: pgSsl(url), max: 2 });
  boss.on("error", (err) => console.error("pg-boss error", { err: err.message }));
  await boss.start();
  for (const name of QueueName.options) await boss.createQueue(name, QUEUE_OPTIONS);
  return boss;
}

/** One started pg-boss per server process (instrumentation and routes share it through globalThis). */
export function boss(): Promise<PgBoss> {
  globalThis.__boss ??= start().catch((err: unknown) => {
    globalThis.__boss = undefined;
    throw err;
  });
  return globalThis.__boss;
}

/** Per-process secret the worker uses to call /api/jobs/run on this same server; never leaves memory. */
export function jobSecret(): string {
  globalThis.__jobSecret ??= newSecret("job_");
  return globalThis.__jobSecret;
}

export function isJobCaller(authorization: string | null): boolean {
  const token = bearerToken(authorization);
  return token !== null && timingSafeEqual(Buffer.from(hashSecret(token)), Buffer.from(hashSecret(jobSecret())));
}

export async function enqueueRhythms(slug: string): Promise<void> {
  await (await boss()).send(QUEUES.songRhythms, { slug }, { singletonKey: slug });
}

/** `id` is null when that link is already queued or running (from this batch or an earlier one). */
export async function enqueueImports({ urls, user }: { urls: string[]; user: ImportJobData["user"] }) {
  const b = await boss();
  const batchId = randomUUID();
  const jobs: { url: string; id: string | null }[] = [];
  for (const url of urls) {
    const data: ImportJobData = { url, batchId, user };
    jobs.push({ url, id: await b.send(QUEUES.importSong, data, { singletonKey: url }) });
  }
  return { batchId, jobs };
}

export type JobView = {
  id: string;
  queue: QueueName;
  state: JobState;
  status: JobStatus;
  label: string;
  batchId: string | null;
  retryCount: number;
  retryLimit: number;
  createdOn: Date;
  completedOn: Date | null;
  outcome: ImportOutcome | null;
  error: string | null;
};

const ErrorOutput = z.object({ message: z.string() });

function view(queue: QueueName, job: JobWithMetadata<unknown>): JobView {
  const imp = ImportJobData.safeParse(job.data);
  const rhythm = RhythmJobData.safeParse(job.data);
  const outcome = queue === QUEUES.importSong && job.state === "completed" ? ImportOutcomeSchema.safeParse(job.output) : null;
  const error = job.state === "failed" || job.state === "retry" ? ErrorOutput.safeParse(job.output) : null;
  const parsedOutcome = outcome?.success ? outcome.data : null;
  return {
    id: job.id,
    queue,
    state: job.state,
    status: jobStatus({ state: job.state, outcome: parsedOutcome?.kind ?? null }),
    label: imp.success ? imp.data.url : rhythm.success ? rhythm.data.slug : job.id,
    batchId: imp.success ? imp.data.batchId : null,
    retryCount: job.retryCount,
    retryLimit: job.retryLimit,
    createdOn: job.createdOn,
    completedOn: job.completedOn,
    outcome: parsedOutcome,
    error: error?.success ? error.data.message : null,
  };
}

export async function importBatch(batchId: string): Promise<{ progress: Progress; jobs: JobView[] }> {
  const jobs = (await (await boss()).findJobs(QUEUES.importSong, { data: { batchId } })).map((j) => view(QUEUES.importSong, j));
  return { progress: progress(jobs.map((j) => j.state)), jobs };
}

/** Newest first. shortcut: reads every kept job (pg-boss deletes them after 7 days); page through findJobs if a queue grows past a few thousand. */
export async function allJobs(queue: QueueName): Promise<JobView[]> {
  const jobs = await (await boss()).findJobs(queue, { limit: 5000 });
  return jobs.reverse().map((j) => view(queue, j));
}

export async function findJob({ queue, id }: { queue: QueueName; id: string }): Promise<JobView | null> {
  const [job] = await (await boss()).findJobs(queue, { id });
  return job ? view(queue, job) : null;
}

export async function retryJobs({ queue, ids }: { queue: QueueName; ids: string[] }): Promise<number> {
  if (!ids.length) return 0;
  return (await (await boss()).retry(queue, ids)).affected;
}

/** Re-queues every failed import of a batch; returns how many. */
export async function retryFailedInBatch(batchId: string): Promise<number> {
  const { jobs } = await importBatch(batchId);
  return retryJobs({ queue: QUEUES.importSong, ids: jobs.filter((j) => j.state === "failed").map((j) => j.id) });
}

export async function cancelJob({ queue, id }: { queue: QueueName; id: string }): Promise<void> {
  await (await boss()).cancel(queue, id);
}
