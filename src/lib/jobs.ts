// Background job vocabulary shared by the queue (src/jobs), its API routes and the admin page.
import { z } from "zod";

/** pg-boss job states. created/retry wait, active runs, the other three are done. */
export const JOB_STATES = ["created", "retry", "active", "completed", "cancelled", "failed"] as const;
export type JobState = (typeof JOB_STATES)[number];

export const MAX_BATCH = 200;

const HttpUrl = z.url({ protocol: /^https?$/ });

/** One link per line; blank lines and `#` comments are skipped, repeats are queued once. */
export function parseUrlList(text: string): { urls: string[]; invalid: string[] } {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const urls = new Set<string>();
  const invalid: string[] = [];
  for (const line of lines) {
    if (HttpUrl.safeParse(line).success) urls.add(line);
    else invalid.push(line);
  }
  return { urls: [...urls], invalid };
}

export type Progress = { total: number; done: number; counts: Record<JobState, number> };

export function progress(states: JobState[]): Progress {
  const counts: Record<JobState, number> = { created: 0, retry: 0, active: 0, completed: 0, cancelled: 0, failed: 0 };
  for (const s of states) counts[s] += 1;
  return { total: states.length, done: counts.completed + counts.cancelled + counts.failed, counts };
}

/** What an admin cares about: queue states, with a finished import split by what happened to its song. */
export const JOB_STATUSES = ["running", "retrying", "waiting", "failed", "review", "published", "duplicate", "done", "cancelled"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export function jobStatus({ state, outcome }: { state: JobState; outcome: "published" | "duplicate" | "review" | null }): JobStatus {
  switch (state) {
    case "created":
      return "waiting";
    case "retry":
      return "retrying";
    case "active":
      return "running";
    case "completed":
      return outcome ?? "done";
    case "failed":
    case "cancelled":
      return state;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function countStatuses(statuses: JobStatus[]): Record<JobStatus, number> {
  const counts: Record<JobStatus, number> = { running: 0, retrying: 0, waiting: 0, failed: 0, review: 0, published: 0, duplicate: 0, done: 0, cancelled: 0 };
  for (const s of statuses) counts[s] += 1;
  return counts;
}
