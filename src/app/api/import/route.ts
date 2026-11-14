import { z } from "zod";
import { requestUser } from "@/db/auth";
import { findBySourceUrl } from "@/db/songs";
import { importSong } from "@/lib/ai";
import { fetchPage } from "@/lib/crawl";
import { unknownChords } from "@/lib/song";

const Body = z.object({ url: z.url({ protocol: /^https?$/ }) });

export async function POST(req: Request) {
  const user = await requestUser(req);
  if (!user?.isAdmin) return Response.json({ error: "Chỉ admin được import" }, { status: 403 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Link không hợp lệ" }, { status: 400 });
  const url = body.data.url;
  const dup = await findBySourceUrl(url);
  if (dup) return Response.json({ error: `Link này đã được đăng: /bai-hat/${dup.slug}`, slug: dup.slug }, { status: 409 });

  let page;
  try {
    page = await fetchPage(url);
  } catch (err) {
    return Response.json({ error: `Không tải được trang: ${err instanceof Error ? err.message : "lỗi mạng"}` }, { status: 422 });
  }
  try {
    const draft = await importSong({ url, page });
    return Response.json({ draft: { ...draft, sourceUrl: url }, unknownChords: unknownChords(draft.sheet) });
  } catch (err) {
    console.error("import failed", { url, err: err instanceof Error ? err.message : String(err) });
    return Response.json({ error: "Mầm chưa đọc được bài từ trang này" }, { status: 502 });
  }
}
