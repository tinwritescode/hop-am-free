import Link from "next/link";
import { LookControls } from "./site/LookControls";

export function SiteFooter() {
  return (
    <footer className="mt-10 flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-line pt-4 text-[13px] text-soft">
      <span className="flex min-h-11 items-center">Hợp Âm Free · do cộng đồng chơi đàn đóng góp</span>
      <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <LookControls />
        <Link href="/agents" className="flex min-h-11 items-center">
          Dành cho AI agent
        </Link>
        <Link href="/cli" className="flex min-h-11 items-center">
          CLI
        </Link>
      </span>
    </footer>
  );
}
