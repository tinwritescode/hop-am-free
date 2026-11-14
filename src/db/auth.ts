import "server-only";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { isAdmin } from "@/lib/admin";
import { bearerToken } from "@/lib/cli-auth";
import { userFromToken } from "./cli";

export type CurrentUser = { id: string; email: string; name: string; isAdmin: boolean };

export async function currentUser(): Promise<CurrentUser | null> {
  const { user } = await withAuth();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.firstName ?? user.email,
    isAdmin: isAdmin({ email: user.email, emailVerified: user.emailVerified, allowlist: process.env.ADMIN_EMAILS }),
  };
}

/** API routes accept either a CLI token (`Authorization: Bearer haf_…`) or the browser session. */
export async function requestUser(req: Request): Promise<CurrentUser | null> {
  const token = bearerToken(req.headers.get("authorization"));
  return token ? userFromToken(token) : currentUser();
}
