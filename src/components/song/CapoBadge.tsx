import { soundingKey, type Capo } from "@/lib/capo";

export const AI_CAPO_NOTE = "AI đoán, nên nghe lại bản thu";

/** "Capo 3 · nghe như Eb", with AI estimates marked. Renders nothing when the capo is unknown. */
export function CapoBadge({ songKey, capo }: { songKey: string; capo: Capo | null }) {
  if (!capo) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="rounded-md border border-line-strong bg-surface px-3 py-1 font-mono font-bold text-ink">{capo.fret === 0 ? "Không capo" : `Capo ${capo.fret}`}</span>
      {capo.fret > 0 && (
        <span>
          nghe như <strong className="font-mono font-bold text-ink">{soundingKey({ key: songKey, fret: capo.fret })}</strong>
        </span>
      )}
      {capo.source === "ai" && <span className="rounded-md bg-warn-bg px-2 py-0.5 font-semibold text-warn">{AI_CAPO_NOTE}</span>}
    </span>
  );
}
