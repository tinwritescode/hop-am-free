"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "@/db/auth";
import { approveCliLogin, revokeCliToken } from "@/db/cli";
import { normalizeUserCode } from "@/lib/cli-auth";

export async function approveAction(form: FormData) {
  const user = await currentUser();
  const userCode = normalizeUserCode(String(form.get("code") ?? ""));
  if (!user || !userCode) redirect("/cli?status=invalid");
  const ok = await approveCliLogin({ userCode, user });
  redirect(ok ? "/cli?status=approved" : `/cli?code=${userCode}&status=invalid`);
}

export async function revokeAction(form: FormData) {
  const user = await currentUser();
  const id = z.coerce.number().int().positive().safeParse(form.get("id"));
  if (!user || !id.success) return;
  await revokeCliToken({ id: id.data, userId: user.id });
  revalidatePath("/cli");
}
