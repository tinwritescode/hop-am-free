"use client";

import { usePathname } from "next/navigation";
import { isSongPath } from "@/lib/song-list";

/** The page column under the header: the site's 1160px container, or the full width (with side padding) on song pages and the admin queue dashboard. */
export function SiteMain({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const wide = isSongPath(path) || path.startsWith("/admin/jobs");
  return <div className={wide ? "px-5 pb-12 lg:px-6" : "mx-auto max-w-[1160px] px-5 pb-12"}>{children}</div>;
}
