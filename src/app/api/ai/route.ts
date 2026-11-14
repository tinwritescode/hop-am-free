import { z } from "zod";
import { getSong } from "@/db/songs";
import { AI_TASKS } from "@/lib/ai-schema";
import { runAiTask } from "@/lib/ai";

// Only known songs are sent to the model, so this route is not an open proxy for the API key.
const Body = z.object({ slug: z.string(), task: z.enum(AI_TASKS) });

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  const song = await getSong(body.data.slug);
  if (!song) return Response.json({ error: "Không tìm thấy bài hát" }, { status: 404 });
  try {
    return Response.json(await runAiTask(body.data.task, song));
  } catch (err) {
    console.error("ai task failed", { slug: song.slug, task: body.data.task, err: err instanceof Error ? err.message : String(err) });
    return Response.json({ error: "Mầm đang bận, thử lại sau nhé" }, { status: 502 });
  }
}
