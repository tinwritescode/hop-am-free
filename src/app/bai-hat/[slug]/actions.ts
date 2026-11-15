"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "@/db/auth";
import { writeCapo, type CapoWrite } from "@/db/capo";
import { songChanged } from "@/db/read-cache";
import { CapoFretSchema } from "@/lib/capo";

const Input = z.object({ slug: z.string().min(1).max(120), fret: CapoFretSchema.nullable() });

/** Admin correction from the song page. Clearing stores "unknown, by an editor", so the backfill will not guess it again. */
export async function setCapoAction(input: unknown): Promise<{ error: string } | { ok: true }> {
  const user = await currentUser();
  if (!user?.isAdmin) return { error: "Chỉ admin được sửa capo" };
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { error: "Capo phải từ 0 đến 11, hoặc Không rõ" };
  const { slug, fret } = parsed.data;
  const value: CapoWrite = fret === null ? { capo: null, capoSource: "editor" } : { capo: fret, capoSource: "editor" };
  if (!(await writeCapo({ where: { slug }, value }))) return { error: "Không tìm thấy bài hát" };
  songChanged(slug);
  revalidatePath(`/bai-hat/${slug}`);
  return { ok: true };
}
