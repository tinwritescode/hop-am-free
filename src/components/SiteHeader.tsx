import Link from "next/link";
import { currentUser } from "@/db/auth";
import { NavAuth } from "./NavAuth";
import { CategoryNav, HeaderSearch, ModeToggle } from "./site/HeaderControls";

export async function SiteHeader() {
  const user = await currentUser();
  return (
    <header className="bar border-b-[3px] border-accent bg-bar pt-[var(--app-inset-top,0px)] text-bar-ink">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-x-4 gap-y-1 px-5 py-1.5 text-sm font-semibold">
        <Link href="/" className="mr-2 flex min-h-11 items-center gap-2 font-serif text-xl font-normal">
          <svg className="anim-lit" width="20" height="28" viewBox="0 0 60 84" aria-hidden="true">
            <rect x="21" y="2" width="18" height="6" rx="2" style={{ fill: "var(--bar-ink)" }} />
            <ellipse cx="30" cy="36" rx="25" ry="28" style={{ fill: "var(--accent)" }} />
            <path d="M36 22v20a6 6 0 1 1-3-5.2V26l-9 2" style={{ stroke: "var(--on-accent)" }} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="21" y="62" width="18" height="6" rx="2" style={{ fill: "var(--bar-ink)" }} />
            <path d="M30 68v14" style={{ stroke: "var(--accent)" }} strokeWidth="3" strokeLinecap="round" />
          </svg>
          Hợp Âm Free
        </Link>
        <CategoryNav />
        <HeaderSearch />
        <nav aria-label="Tài khoản" className="flex flex-wrap items-center">
          <ModeToggle />
          {user?.isAdmin && (
            <Link href="/admin/bai-hat/moi" className="flex h-11 items-center px-2.5">
              Đăng bài
            </Link>
          )}
          <NavAuth />
        </nav>
      </div>
    </header>
  );
}
