"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/db/auth";
import { publishSong } from "@/db/publish";

export async function createSongAction(input: unknown): Promise<{ error: string }> {
  const res = await publishSong({ user: await currentUser(), input });
  if (!res.ok) return { error: res.error };
  redirect(`/bai-hat/${res.song.slug}`);
}
