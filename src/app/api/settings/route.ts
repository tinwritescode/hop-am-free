import { currentUser } from "@/db/auth";
import { saveSettings } from "@/db/settings";
import { SettingsSchema } from "@/lib/settings";

export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Cần đăng nhập" }, { status: 401 });
  const body = SettingsSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Cài đặt không hợp lệ" }, { status: 400 });
  await saveSettings({ userId: user.id, settings: body.data });
  return Response.json(body.data);
}
