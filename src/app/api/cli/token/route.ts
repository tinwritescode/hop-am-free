import { z } from "zod";
import { redeemCliLogin } from "@/db/cli";

const Body = z.object({ deviceCode: z.string().startsWith("hafd_").max(100) });

/** Step 3 of `hopamfree login`: the CLI polls until the admin approves on /cli, then gets its token once. */
export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  const res = await redeemCliLogin(body.data.deviceCode);
  if (res.status === "ok") return Response.json({ token: res.token, email: res.email });
  if (res.status === "pending") return Response.json({ status: "pending" }, { status: 428 });
  return Response.json({ error: "Mã đăng nhập đã hết hạn, chạy lại hopamfree login" }, { status: 410 });
}
