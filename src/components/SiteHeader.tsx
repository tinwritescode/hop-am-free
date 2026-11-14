import Link from "next/link";
import { Mascot } from "./Mascot";
import { NavAuth } from "./NavAuth";
import { currentUser } from "@/db/auth";

export async function SiteHeader({ query = "" }: { query?: string }) {
  const user = await currentUser();
  return (
    <header className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3.5 sm:px-8">
      <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-ink">
        <Mascot size={34} />
        Hợp Âm Free
      </Link>
      <form action="/" role="search" className="flex h-[46px] min-w-0 max-w-[520px] flex-[1_1_280px] items-center gap-2 rounded-full bg-white/90 px-4 shadow-[0_2px_10px_rgba(47,107,71,0.12)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52675a" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <label htmlFor="q" className="sr-only">Tìm kiếm</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Tìm bài hát, ca sĩ, hoặc hợp âm: Am C G"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        {user?.isAdmin && (
          <Link href="/admin/bai-hat/moi" className="rounded-full bg-forest px-4 py-2 text-[15px] font-extrabold text-white">
            + Thêm bài
          </Link>
        )}
        <NavAuth />
      </div>
    </header>
  );
}
