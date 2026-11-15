"use client";

import { usePathname } from "next/navigation";
import { useLook } from "@/components/look/LookProvider";
import { isSongPath } from "@/lib/song-list";

/** The skin's scenery under the header. Left out on desktop song pages, where the lyrics need the height. */
export function SceneStrip() {
  const { Scene } = useLook().skin;
  const song = isSongPath(usePathname());
  return (
    <div aria-hidden="true" className={`relative h-[132px] overflow-hidden ${song ? "lg:hidden" : ""}`}>
      <Scene />
    </div>
  );
}
