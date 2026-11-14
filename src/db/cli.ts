import "server-only";
import { and, desc, eq, gt, isNotNull, isNull, lt } from "drizzle-orm";
import { db } from ".";
import { apiTokens, cliLogins } from "./schema";
import { hashSecret, newSecret, newUserCode } from "@/lib/cli-auth";
import { isAdmin } from "@/lib/admin";
import type { CurrentUser } from "./auth";

const LOGIN_TTL_MS = 10 * 60_000;

export async function startCliLogin(clientName: string) {
  await db().delete(cliLogins).where(lt(cliLogins.expiresAt, new Date()));
  const deviceCode = newSecret("hafd_");
  const expiresAt = new Date(Date.now() + LOGIN_TTL_MS);
  for (let attempt = 0; attempt < 5; attempt++) {
    const userCode = newUserCode();
    const [row] = await db()
      .insert(cliLogins)
      .values({ deviceHash: hashSecret(deviceCode), userCode, clientName: clientName.slice(0, 80), expiresAt })
      .onConflictDoNothing()
      .returning({ userCode: cliLogins.userCode });
    if (row) return { deviceCode, userCode: row.userCode, expiresAt };
  }
  throw new Error("could not allocate a user code");
}

/** A login waiting for approval, or null if unknown, expired or already approved. */
export async function pendingCliLogin(userCode: string) {
  const [row] = await db()
    .select({ userCode: cliLogins.userCode, clientName: cliLogins.clientName })
    .from(cliLogins)
    .where(and(eq(cliLogins.userCode, userCode), isNull(cliLogins.userId), gt(cliLogins.expiresAt, new Date())));
  return row ?? null;
}

export async function approveCliLogin({ userCode, user }: { userCode: string; user: CurrentUser }): Promise<boolean> {
  if (!user.isAdmin) return false;
  const rows = await db()
    .update(cliLogins)
    .set({ userId: user.id, email: user.email })
    .where(and(eq(cliLogins.userCode, userCode), isNull(cliLogins.userId), gt(cliLogins.expiresAt, new Date())))
    .returning({ userCode: cliLogins.userCode });
  return rows.length === 1;
}

export type Redeem = { status: "pending" } | { status: "expired" } | { status: "ok"; token: string; email: string };

/** Exchanges an approved device code for a token, exactly once (the delete is the lock). */
export async function redeemCliLogin(deviceCode: string): Promise<Redeem> {
  const deviceHash = hashSecret(deviceCode);
  const [approved] = await db()
    .delete(cliLogins)
    .where(and(eq(cliLogins.deviceHash, deviceHash), isNotNull(cliLogins.userId), gt(cliLogins.expiresAt, new Date())))
    .returning();
  if (approved?.userId && approved.email) {
    const token = newSecret("haf_");
    await db().insert(apiTokens).values({ tokenHash: hashSecret(token), userId: approved.userId, email: approved.email, name: approved.clientName });
    return { status: "ok", token, email: approved.email };
  }
  const [waiting] = await db()
    .select({ expiresAt: cliLogins.expiresAt })
    .from(cliLogins)
    .where(eq(cliLogins.deviceHash, deviceHash));
  return waiting && waiting.expiresAt > new Date() ? { status: "pending" } : { status: "expired" };
}

/** The admin behind a CLI token. The allowlist is re-checked on every call, so removing an email cuts its tokens off. */
export async function userFromToken(token: string): Promise<CurrentUser | null> {
  const [row] = await db()
    .update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(and(eq(apiTokens.tokenHash, hashSecret(token)), isNull(apiTokens.revokedAt)))
    .returning();
  if (!row) return null;
  // The email was verified by WorkOS when the admin approved this token.
  const admin = isAdmin({ email: row.email, emailVerified: true, allowlist: process.env.ADMIN_EMAILS });
  return admin ? { id: row.userId, email: row.email, name: row.email, isAdmin: true } : null;
}

export async function listCliTokens(userId: string) {
  return db()
    .select({ id: apiTokens.id, name: apiTokens.name, createdAt: apiTokens.createdAt, lastUsedAt: apiTokens.lastUsedAt })
    .from(apiTokens)
    .where(and(eq(apiTokens.userId, userId), isNull(apiTokens.revokedAt)))
    .orderBy(desc(apiTokens.createdAt));
}

export async function revokeCliToken({ id, userId }: { id: number; userId: string }) {
  await db()
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiTokens.id, id), eq(apiTokens.userId, userId)));
}
