import { z } from "zod";
import { requestUser } from "@/db/auth";
import { retryFailedInBatch } from "@/jobs/boss";

const Body = z.object({ batchId: z.uuid() });

/** Re-queues every failed import of a batch. */
export async function POST(req: Request) {
  const user = await requestUser(req);
  if (!user?.isAdmin) return Response.json({ error: "Chỉ admin được thử lại" }, { status: 403 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Cần { batchId }" }, { status: 400 });
  return Response.json({ retried: await retryFailedInBatch(body.data.batchId) });
}
