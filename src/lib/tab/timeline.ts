// Where a tab run is and what each note sounds like: the pure half of the tab player.
import type { CapoChange } from "./parse";

/** The capo in place at column `at`: the latest change at or before it, else the arrangement's own. */
export function capoAt({ capos, at, initial }: { capos: readonly CapoChange[]; at: number; initial: number }): number {
  return capos.findLast((c) => c.at <= at)?.fret ?? initial;
}

/** `strings` are the open strings low to high as MIDI notes; the fret counts from the capo. */
export const noteMidi = ({ strings, string, fret, capo }: { strings: readonly number[]; string: number; fret: number; capo: number }) => strings[string] + capo + fret;

/**
 * The column under the playhead `elapsed` columns after starting at `from` inside [lo, hi). A loop goes back to `lo`;
 * otherwise the run ends (null) at `hi`.
 */
export function columnAt({ from, lo, hi, loop, elapsed }: { from: number; lo: number; hi: number; loop: boolean; elapsed: number }): number | null {
  const at = from + Math.max(0, elapsed);
  if (at < hi) return at;
  if (!loop || hi <= lo) return null;
  return lo + ((at - hi) % (hi - lo));
}

/** Index of the last step at or before column `at`, or -1 before the first. Steps are sorted by column. */
export function stepIndexAt({ steps, at }: { steps: readonly { at: number }[]; at: number }): number {
  let lo = 0;
  let hi = steps.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (steps[mid].at <= at) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}
