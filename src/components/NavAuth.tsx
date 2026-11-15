"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { signOutAction } from "@/app/auth/actions";

export function NavAuth() {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (!user) {
    return (
      <a href="/sign-in" className="flex h-11 items-center px-2.5">
        Đăng nhập
      </a>
    );
  }

  return (
    <form action={signOutAction} className="flex items-center gap-1">
      <span className="hidden px-2.5 sm:inline">{user.firstName ?? user.email}</span>
      <button type="submit" className="h-11 px-2.5 font-semibold text-bar-ink transition-colors hover:text-accent">
        Đăng xuất
      </button>
    </form>
  );
}
