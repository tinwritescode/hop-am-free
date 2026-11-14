import { requestUser } from "@/db/auth";

export async function GET(req: Request) {
  const user = await requestUser(req);
  if (!user) return Response.json({ error: "Token không hợp lệ hoặc đã bị thu hồi" }, { status: 401 });
  return Response.json({ email: user.email, isAdmin: user.isAdmin });
}
