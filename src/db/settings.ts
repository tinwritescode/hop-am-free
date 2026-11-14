import "server-only";
import { eq } from "drizzle-orm";
import { db } from ".";
import { userSettings } from "./schema";
import { parseSettings, type Settings } from "@/lib/settings";

/** null when the user has never saved settings, so the client can adopt what it had in localStorage. */
export async function getSettings(userId: string): Promise<Settings | null> {
  const [row] = await db().select({ settings: userSettings.settings }).from(userSettings).where(eq(userSettings.userId, userId));
  return row ? parseSettings(row.settings) : null;
}

export async function saveSettings({ userId, settings }: { userId: string; settings: Settings }): Promise<void> {
  await db()
    .insert(userSettings)
    .values({ userId, settings })
    .onConflictDoUpdate({ target: userSettings.userId, set: { settings, updatedAt: new Date() } });
}
