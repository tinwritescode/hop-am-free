import type { TabStep } from "@/lib/tab/parse";
import { fingerOf, type Finger } from "@/lib/tab/describe";

export const FINGER_COLOR: Record<Finger, string> = { p: "var(--link)", i: "var(--ok)", m: "var(--warn)", a: "var(--accent)" };

const LABEL_X = 7;
const OPEN_X = 25;
const NUT_X = 40;
const FRET_W = 40;
const TOP = 16;
const GAP = 18;
const INLAYS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);

/** y of a string: the high e on top, as in tab. */
const yOf = (string: number) => TOP + (5 - string) * GAP;
export const xOf = (fret: number) => (fret === 0 ? OPEN_X : NUT_X + (fret - 0.5) * FRET_W);
export const boardWidth = (frets: number) => NUT_X + frets * FRET_W + 8;

/**
 * The neck from the capo up, frets counted from the capo as the tab counts them. The step being played is drawn solid,
 * ringed in the colour of the finger that plucks it; the next step is drawn faint.
 */
export function Fretboard({ step, next, frets, capo }: { step: TabStep | null; next: TabStep | null; frets: number; capo: number }) {
  const width = boardWidth(frets);
  const height = TOP + 5 * GAP + 26;
  const mid = TOP + 2.5 * GAP;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block w-full min-w-[560px]" role="img" aria-label={`Cần đàn, capo phím ${capo}`}>
      <rect x={NUT_X} y={TOP - 6} width={frets * FRET_W} height={5 * GAP + 12} rx={4} fill="var(--hover)" />
      {Array.from({ length: frets }, (_, i) => i + 1).map((k) => {
        const physical = capo + k;
        const x = NUT_X + (k - 0.5) * FRET_W;
        return (
          <g key={k}>
            {INLAYS.has(physical) && <circle cx={x} cy={mid} r={5} fill="var(--line-strong)" />}
            {physical % 12 === 0 && (
              <>
                <circle cx={x} cy={mid - GAP} r={5} fill="var(--line-strong)" />
                <circle cx={x} cy={mid + GAP} r={5} fill="var(--line-strong)" />
              </>
            )}
            <line x1={NUT_X + k * FRET_W} x2={NUT_X + k * FRET_W} y1={TOP - 6} y2={TOP + 5 * GAP + 6} stroke="var(--line-strong)" strokeWidth={2} />
            <text x={x} y={height - 4} textAnchor="middle" fontSize={11} fill="var(--soft)">
              {k}
            </text>
          </g>
        );
      })}
      {/* The capo acts as the nut. */}
      <rect x={NUT_X - 5} y={TOP - 9} width={7} height={5 * GAP + 18} rx={3} fill="var(--ink)" />
      {[0, 1, 2, 3, 4, 5].map((s) => (
        <g key={s}>
          <line x1={NUT_X} x2={width - 8} y1={yOf(s)} y2={yOf(s)} stroke="var(--soft)" strokeWidth={1 + (5 - s) * 0.3} />
          <text x={LABEL_X} y={yOf(s) + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--soft)">
            {6 - s}
          </text>
        </g>
      ))}
      {next?.notes.map((n) =>
        n.kind === "fret" ? <circle key={`n${n.string}`} cx={xOf(n.fret)} cy={yOf(n.string)} r={7} fill="none" stroke="var(--soft)" strokeWidth={1.5} strokeDasharray="3 2" /> : null,
      )}
      {step?.notes.map((n) => {
        const color = FINGER_COLOR[fingerOf(n.string)];
        if (n.kind === "dead")
          return (
            <text key={n.string} x={OPEN_X} y={yOf(n.string) + 5} textAnchor="middle" fontSize={16} fontWeight={800} fill={color}>
              ×
            </text>
          );
        return (
          <g key={n.string}>
            <circle cx={xOf(n.fret)} cy={yOf(n.string)} r={9} fill="var(--surface)" stroke={color} strokeWidth={3.5} />
            <text x={xOf(n.fret)} y={yOf(n.string) + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill="var(--ink)">
              {n.fret}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
