// Pulls jobs off the queue and runs each one through POST /api/jobs/run on this same server.
// The detour is needed because publishing and rhythm suggestions call revalidateTag(), which Next only
// allows inside a request; a job's HTTP status decides success (output) or failure (pg-boss retries).
import "server-only";
import { z } from "zod";
import { boss, jobSecret, QueueName } from "./boss";

const ErrorBody = z.object({ error: z.string() });
const Output = z.record(z.string(), z.unknown());

async function runInApp({ queue, data }: { queue: QueueName; data: unknown }): Promise<Record<string, unknown>> {
  const res = await fetch(`http://127.0.0.1:${process.env.PORT ?? 3000}/api/jobs/run`, {
    method: "POST",
    headers: { authorization: `Bearer ${jobSecret()}`, "content-type": "application/json" },
    body: JSON.stringify({ queue, data }),
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = ErrorBody.safeParse(body);
    throw new Error(err.success ? err.data.error : `HTTP ${res.status}`);
  }
  return Output.parse(body);
}

export async function startWorkers(): Promise<void> {
  const b = await boss();
  for (const queue of QueueName.options) {
    await b.work(queue, { localConcurrency: 2 }, ([job]) => runInApp({ queue, data: job?.data }));
  }
}
