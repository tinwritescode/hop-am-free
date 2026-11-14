import { z } from "zod";
import { startCliLogin } from "@/db/cli";

const Body = z.object({ clientName: z.string().trim().min(1).max(80).default("hopamfree CLI") });

/** Step 1 of `hopamfree login`: returns a secret device code (kept by the CLI) and a short user code (typed on /cli). */
export async function POST(req: Request) {
  const body = Body.safeParse((await req.json().catch(() => ({}))) ?? {});
  if (!body.success) return Response.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  const login = await startCliLogin(body.data.clientName);
  const origin = new URL(req.url).origin;
  return Response.json({
    deviceCode: login.deviceCode,
    userCode: login.userCode,
    verificationUrl: `${process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ? new URL(process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI).origin : origin}/cli?code=${login.userCode}`,
    expiresAt: login.expiresAt.toISOString(),
    intervalSeconds: 3,
  });
}
