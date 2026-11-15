import { z } from "zod";
import { requestUser } from "@/db/auth";
import { enqueueImports, importBatch } from "@/jobs/boss";
import { MAX_BATCH, parseUrlList } from "@/lib/jobs";

// Raw lines: the server trims, skips blanks and # comments, and dedupes, so every client parses the same way.
const Body = z.object({ urls: z.array(z.string().max(2000)).min(1).max(MAX_BATCH * 2) });

/** Queue a batch of imports: each link is crawled, cleaned by the AI and published unless it needs review. */
export async function POST(req: Request) {
  const user = await requestUser(req);
  if (!user?.isAdmin) return Response.json({ error: "Chỉ admin được import" }, { status: 403 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Cần { urls: string[] }" }, { status: 400 });
  const { urls, invalid } = parseUrlList(body.data.urls.join("\n"));
  if (!urls.length) return Response.json({ error: "Không có link http(s) hợp lệ", invalid }, { status: 400 });
  if (urls.length > MAX_BATCH) return Response.json({ error: `Tối đa ${MAX_BATCH} link mỗi lần` }, { status: 400 });
  const batch = await enqueueImports({ urls, user: { ...user, isAdmin: true } });
  return Response.json({ ...batch, invalid }, { status: 202 });
}

/** Progress of one batch: `?batch=<batchId>`. */
export async function GET(req: Request) {
  const user = await requestUser(req);
  if (!user?.isAdmin) return Response.json({ error: "Chỉ admin xem được hàng đợi" }, { status: 403 });
  const batchId = z.uuid().safeParse(new URL(req.url).searchParams.get("batch"));
  if (!batchId.success) return Response.json({ error: "Cần ?batch=<batchId>" }, { status: 400 });
  return Response.json(await importBatch(batchId.data));
}
