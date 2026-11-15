"use server";

import { signOut } from "@workos-inc/authkit-nextjs";
import { siteOrigin } from "@/lib/site";

// The environment's default Sign-out URI is localhost; return to this deployment's home instead (registered per domain).
export async function signOutAction() {
  const origin = siteOrigin();
  await signOut(origin ? { returnTo: `${origin}/` } : undefined);
}
