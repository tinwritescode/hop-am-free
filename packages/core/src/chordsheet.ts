// Chord sheet text in the "[C] lyric" format used by Vietnamese chord sites.
// "## Title" starts a named section; a blank line starts an unnamed one.

export type Token = { chord: string | null; text: string };
export type Line = { index: number; tokens: Token[]; hasChords: boolean; chordOnly: boolean };
export type Section = { title: string | null; lines: Line[] };
export type ChordSheet = Section[];

const CHORD_MARK = /\[([^\]]+)\]/;

function tokenize(line: string): Token[] {
  const parts = line.split(CHORD_MARK); // [text, chord, text, chord, text...]
  const tokens: Token[] = [];
  const pushWords = (chord: string | null, text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      if (chord) tokens.push({ chord, text: "" });
      return;
    }
    words.forEach((word, i) => tokens.push({ chord: i === 0 ? chord : null, text: word }));
  };
  pushWords(null, parts[0] ?? "");
  for (let i = 1; i < parts.length; i += 2) pushWords(parts[i].trim(), parts[i + 1] ?? "");
  return tokens;
}

export function parseChordSheet(raw: string): ChordSheet {
  const sections: Section[] = [];
  let current: Section | null = null;
  let index = 0;
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      current = { title: line.slice(3).trim(), lines: [] };
      sections.push(current);
      continue;
    }
    if (line === "") {
      if (current && current.lines.length > 0) current = null;
      continue;
    }
    if (!current) {
      current = { title: null, lines: [] };
      sections.push(current);
    }
    const tokens = tokenize(line);
    const hasChords = tokens.some((t) => t.chord !== null);
    current.lines.push({ index: index++, tokens, hasChords, chordOnly: hasChords && tokens.every((t) => t.text === "") });
  }
  return sections.filter((s) => s.lines.length > 0);
}

export function chordsInOrder(sheet: ChordSheet): string[] {
  const seen = new Set<string>();
  for (const section of sheet)
    for (const line of section.lines)
      for (const token of line.tokens) if (token.chord) seen.add(token.chord);
  return [...seen];
}

export type LineFix = { from: string; to: string };

/** Replaces one chord on specific lines (fixes accepted from the AI review). */
export function applyFixes(sheet: ChordSheet, fixes: Record<number, LineFix>): ChordSheet {
  return sheet.map((section) => ({
    ...section,
    lines: section.lines.map((line) => {
      const fix = fixes[line.index];
      if (!fix) return line;
      return { ...line, tokens: line.tokens.map((t) => (t.chord === fix.from ? { ...t, chord: fix.to } : t)) };
    }),
  }));
}

/** Numbered plain-text form, so the AI can point at lines by index. */
export function sheetForPrompt(sheet: ChordSheet): string {
  return sheet
    .map((s) => {
      const body = s.lines
        .map((l) => `${l.index}: ${l.tokens.map((t) => (t.chord ? `[${t.chord}]${t.text}` : t.text)).join(" ")}`)
        .join("\n");
      return s.title ? `## ${s.title}\n${body}` : body;
    })
    .join("\n\n");
}
