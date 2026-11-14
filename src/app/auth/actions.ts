"use server";

import { signOut } from "@workos-inc/authkit-nextjs";

// The environment's default Sign-out URI is localhost; return to this deployment's home instead (registered per domain).
export async function signOutAction() {
  const callback = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;
  await signOut(callback ? { returnTo: `${new URL(callback).origin}/` } : undefined);
}
