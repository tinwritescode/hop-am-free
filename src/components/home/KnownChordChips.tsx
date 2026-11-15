"use client";

import { CHIP, chipTone } from "./chip";
import { useKnownChords } from "./useKnownChords";

/**
 * Toggle chips for "chords I can play": the common ones, then any other chord the visitor already marked.
 * `onChange` hears the visitor's own toggles only (not other tabs), with the new set.
 */
export function KnownChordChips({ common, label, onChange }: { common: readonly string[]; label: string; onChange?: (known: ReadonlySet<string>) => void }) {
  const { known, toggle } = useKnownChords();
  const chips = [...common, ...[...known].filter((c) => !common.includes(c))];
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <button key={c} type="button" aria-pressed={known.has(c)} onClick={() => {
            const next = toggle(c); // not inside onChange?.(…): that skips its argument when there is no onChange
            onChange?.(next);
          }} className={`${CHIP} ${chipTone(known.has(c))}`}>
          {c}
        </button>
      ))}
    </div>
  );
}
