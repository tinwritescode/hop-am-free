// Reading guitar tab written as text (the "e|--0--|" blocks most tab sites use) into timed notes.

export type Technique = "hammer" | "pull" | "slide-up" | "slide-down";

/** `string` 0 is the low E (6th string), 5 the high e. Frets count from the capo. */
export type TabNote = { kind: "fret"; string: number; fret: number; via: Technique | null } | { kind: "dead"; string: number };

/**
 * Everything struck in one column. `at` is the column across the whole tab: text tab carries no rhythm, so its
 * spacing stands in for time.
 */
export type TabStep = { at: number; notes: TabNote[]; thump: boolean };

/** One printed block of six lines, with the columns of its bar lines. */
export type TabSystem = { start: number; width: number; bars: number[] };

export type TabSection = { name: string; start: number; end: number };

export type CapoChange = { at: number; fret: number };

export type Tab = { steps: TabStep[]; systems: TabSystem[]; sections: TabSection[]; capos: CapoChange[]; length: number };

/** "e|", "Eb|", "D |": a string name, then the line. */
const STRING_LINE = /^[A-Ga-g][#b]?\s*\|/;
/** The end of a too-long block, printed under it without string names. */
const OVERFLOW = /^[-\dxXhp/\\|~]*-[-\dxXhp/\\|~]*$/;
const HEADER = /^\[(.+)\]$/;
/** "| x4" after a bar line: play the part that ends there four times. */
const REPEAT = /\|\s*[xX](\d+)(?=\s|\||$)/;
const THUMP = /(?<![A-Za-z])o(?![A-Za-z])/g;
const CAPO = /Capo\s*(\d+)/gi;
const VIA = new Map<string, Technique>([
  ["h", "hammer"],
  ["p", "pull"],
  ["/", "slide-up"],
  ["\\", "slide-down"],
]);

/**
 * Writes out each part marked "| xN" N times, so the tab shown and played holds every pass. A part runs back from its
 * bar line to the start of the block or to the gap before it, when parts are printed side by side.
 */
function expandRepeats(lines: string[]): string[] {
  const width = Math.max(...lines.map((l) => l.length));
  let rows = lines.map((l) => l.padEnd(width));
  for (;;) {
    const r = rows.findIndex((row) => REPEAT.test(row));
    const hit = r < 0 ? null : REPEAT.exec(rows[r]);
    if (!hit) return rows.map((row) => row.trimEnd());
    const bar = hit.index;
    const row = rows[r];
    rows[r] = row.slice(0, bar + 1) + " ".repeat(hit[0].length - 1) + row.slice(bar + hit[0].length);
    const start = Math.max(...rows.map((l) => l.lastIndexOf(" ", bar) + 1));
    rows = rows.map((l) => l.slice(0, bar + 1) + l.slice(start, bar + 1).repeat(Number(hit[1]) - 1) + l.slice(bar + 1));
  }
}

type Block = { section: string | null; above: string | null; prefix: number; rows: string[] };

function blocksOf(lines: readonly string[]): Block[] {
  const blocks: Block[] = [];
  let section: string | null = null;
  for (let i = 0; i < lines.length; ) {
    const header = HEADER.exec(lines[i].trim());
    if (header) {
      section = header[1];
      i++;
      continue;
    }
    const six = lines.slice(i, i + 6);
    if (six.length < 6 || !six.every((l) => STRING_LINE.test(l))) {
      i++;
      continue;
    }
    const prefix = STRING_LINE.exec(six[0])?.[0].length ?? 0;
    const rows = six.map((l) => l.replace(STRING_LINE, ""));
    const overflow = lines.slice(i + 6, i + 12);
    const wraps = overflow.length === 6 && overflow.every((l) => OVERFLOW.test(l.trim()));
    if (wraps) overflow.forEach((l, r) => (rows[r] += l.trim()));
    const prev = i > 0 ? lines[i - 1] : "";
    const above = prev.trim() && !HEADER.test(prev.trim()) ? prev : null;
    blocks.push({ section, above, prefix, rows: expandRepeats(rows) });
    section = null; // a header names the blocks after it until the next header; null here means "same section"
    i += wraps ? 12 : 6;
  }
  return blocks;
}

/** Notes of one string line, by column within the block. */
function readRow({ body, string }: { body: string; string: number }): { col: number; note: TabNote }[] {
  const out: { col: number; note: TabNote }[] = [];
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "x" || ch === "X") out.push({ col: i, note: { kind: "dead", string } });
    if (!/\d/.test(ch)) continue;
    const digits = /^\d{1,2}/.exec(body.slice(i))?.[0] ?? ch;
    out.push({ col: i, note: { kind: "fret", string, fret: Number(digits), via: VIA.get(body[i - 1] ?? "") ?? null } });
    i += digits.length - 1;
  }
  return out;
}

export function parseTab(text: string): Tab {
  const steps = new Map<number, TabStep>();
  const systems: TabSystem[] = [];
  const sections: TabSection[] = [];
  const capos: CapoChange[] = [];
  let offset = 0;
  for (const block of blocksOf(text.split(/\r?\n/).map((l) => l.trimEnd()))) {
    const width = Math.max(...block.rows.map((r) => r.length));
    const bars = new Set<number>();
    block.rows.forEach((body, r) => {
      for (const { col, note } of readRow({ body, string: 5 - r })) {
        const step = steps.get(offset + col) ?? { at: offset + col, notes: [], thump: false };
        step.notes.push(note);
        steps.set(step.at, step);
      }
      [...body].forEach((ch, col) => ch === "|" && bars.add(offset + col));
    });
    const above = block.above ?? "";
    const colOf = (index: number) => offset + Math.max(0, index - block.prefix);
    for (const m of above.matchAll(CAPO)) capos.push({ at: colOf(m.index), fret: Number(m[1]) });
    for (const m of above.matchAll(THUMP)) {
      const col = colOf(m.index);
      // Hand-aligned marks drift by a column; one beside a note belongs to it.
      const near = [col, col - 1, col + 1].map((c) => steps.get(c)).find((s) => s !== undefined);
      if (near) near.thump = true;
      else steps.set(col, { at: col, notes: [], thump: true });
    }
    if (block.section !== null) sections.push({ name: block.section, start: offset, end: offset });
    const last = sections.at(-1);
    if (last) last.end = offset + width;
    systems.push({ start: offset, width, bars: [...bars].sort((a, b) => a - b) });
    offset += width;
  }
  const sorted = [...steps.values()].sort((a, b) => a.at - b.at);
  for (const s of sorted) s.notes.sort((a, b) => a.string - b.string);
  return { steps: sorted, systems, sections, capos, length: offset };
}
