"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLook } from "@/components/look/LookProvider";
import { LIST_PATH } from "@/lib/song-list";

const ICON = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

type Category = { href: string; label: string; icon: React.ReactNode; current: (pathname: string) => boolean };

const CATEGORIES: Category[] = [
  {
    href: LIST_PATH,
    label: "Bài hát",
    current: (p) => p === LIST_PATH || p.startsWith(`${LIST_PATH}/`),
    icon: (
      <svg {...ICON}>
        <path d="M9 18V5l10-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </svg>
    ),
  },
  {
    href: "/ca-si",
    label: "Ca sĩ",
    current: (p) => p === "/ca-si",
    icon: (
      <svg {...ICON}>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
      </svg>
    ),
  },
  {
    href: `${LIST_PATH}#dieu-dem`,
    label: "Điệu đệm",
    current: () => false,
    icon: (
      <svg {...ICON}>
        <path d="M2 12h3l2-6 4 12 3-9 2 3h6" />
      </svg>
    ),
  },
  {
    href: `${LIST_PATH}#hop-am`,
    label: "Hợp âm",
    current: () => false,
    icon: (
      <svg {...ICON}>
        <rect x="5" y="4" width="14" height="16" />
        <path d="M5 9h14M5 14h14M12 4v16" />
        <circle cx="12" cy="11.5" r="1.6" fill="currentColor" />
      </svg>
    ),
  },  {
    href: "/len-day",
    label: "Lên dây",
    current: (p) => p === "/len-day",
    icon: (
      <svg {...ICON}>
        <path d="M12 3v18M8 6h-2M8 11h-2M16 6h2M16 11h2" />
        <path d="M8 3h8l-1 12H9z" />
      </svg>
    ),
  },
];

export function CategoryNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Danh mục" className="flex flex-wrap">
      {CATEGORIES.map((c) => (
        <Link key={c.href} href={c.href} aria-current={c.current(pathname) ? "page" : undefined} className="flex h-11 items-center gap-1.5 px-2 sm:px-2.5">
          {/* Icons drop below sm so all four items share one row at 375px, as the old three did. */}
          <span className="hidden sm:contents">{c.icon}</span>
          {c.label}
        </Link>
      ))}
    </nav>
  );
}

/** The header search, except on the home page, which has its own big search box. */
export function HeaderSearch() {
  if (usePathname() === "/") return <div className="ml-auto" />;
  return (
    <Suspense fallback={<SearchFields />}>
      <SearchForm />
    </Suspense>
  );
}

function SearchForm() {
  const params = useSearchParams();
  const query = usePathname() === LIST_PATH ? (params.get("q") ?? "") : "";
  return <SearchFields key={query} query={query} />;
}

export function SearchFields({ query = "" }: { query?: string }) {
  return (
    <form action={LIST_PATH} role="search" className="ml-auto flex max-w-[360px] min-w-0 flex-[1_1_200px]">
      <label htmlFor="q" className="sr-only">
        Tìm bài hát
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={query}
        placeholder="Tìm bài hát, ca sĩ, hợp âm"
        className="h-[38px] min-w-0 flex-auto rounded-l-md border-0 bg-field px-3 text-sm font-normal text-field-ink placeholder:text-field-ink/60"
      />
      <button type="submit" className="fx h-[38px] rounded-r-md bg-accent px-3.5 font-bold text-on-accent">
        Tìm
      </button>
    </form>
  );
}

export function ModeToggle() {
  const { prefs, skin, setMode } = useLook();
  const label = skin.modeLabels[prefs.mode];
  return (
    <button
      type="button"
      onClick={() => setMode(prefs.mode === "day" ? "night" : "day")}
      aria-label={label}
      title={label}
      className="fx flex size-11 items-center justify-center rounded-full text-accent"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
      </svg>
    </button>
  );
}
