"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { signOutAction } from "@/app/auth/actions";

export function NavAuth() {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (!user) {
    return (
      <a href="/sign-in" className="rounded-full bg-white/90 px-4 py-2 text-[15px] font-semibold text-ink shadow-[0_2px_10px_rgba(47,107,71,0.12)]">
        Đăng nhập
      </a>
    );
  }

  return (
    <form action={signOutAction} className="flex items-center gap-3 text-[15px] text-ink">
      <span className="hidden sm:inline">{user.firstName ?? user.email}</span>
      <button type="submit" className="rounded-full bg-white/90 px-4 py-2 font-semibold shadow-[0_2px_10px_rgba(47,107,71,0.12)]">
        Đăng xuất
      </button>
    </form>
  );
}
