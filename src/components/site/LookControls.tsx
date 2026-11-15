"use client";

import { useLook } from "@/components/look/LookProvider";
import { isSkinId, SKINS, UPCOMING_SKINS } from "@/themes";

export function LookControls() {
  const { prefs, setGlow, setSkin } = useLook();
  return (
    <>
      <label className="flex min-h-11 items-center gap-2 pointer-coarse:hidden">
        <input type="checkbox" checked={prefs.glow} onChange={(e) => setGlow(e.target.checked)} className="size-[18px]" />
        Ánh sáng theo chuột
      </label>
      <label className="flex items-center gap-2">
        Giao diện
        <span className="relative inline-flex items-center">
          <select
            value={prefs.skin}
            onChange={(e) => isSkinId(e.target.value) && setSkin(e.target.value)}
            className="h-11 appearance-none rounded-md border border-line-strong bg-surface pr-[34px] pl-3 font-semibold text-ink"
          >
            {SKINS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            {UPCOMING_SKINS.map((name) => (
              <option key={name} disabled>
                {name} (sắp có)
              </option>
            ))}
          </select>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="pointer-events-none absolute right-3 text-ink">
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </label>
    </>
  );
}
