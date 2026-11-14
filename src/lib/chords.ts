import guitar from "@tombatossals/chords-db/lib/guitar.json";

// Spelling follows the chord database keys, so transposed names always resolve.
const NOTES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
type Note = (typeof NOTES)[number];
const ENHARMONIC: Record<string, Note> = { Db: "C#", "D#": "Eb", Gb: "F#", "G#": "Ab", "A#": "Bb", Cb: "B", "B#": "C", Fb: "E", "E#": "F" };
const DB_KEY: Record<Note, string> = { C: "C", "C#": "Csharp", D: "D", Eb: "Eb", E: "E", F: "F", "F#": "Fsharp", G: "G", Ab: "Ab", A: "A", Bb: "Bb", B: "B" };

const SUFFIX_ALIAS: Record<string, string> = {
  "": "major", M: "major", maj: "major",
  m: "minor", min: "minor", "-": "minor",
  M7: "maj7", "Δ": "maj7", "Δ7": "maj7",
  min7: "m7", "-7": "m7",
  sus: "sus4", "+": "aug", "°": "dim",
  add2: "add9", "6/9": "69",
};

export type Position = { frets: number[]; fingers?: number[]; barres: number[]; baseFret: number; midi?: number[] };
export type ChordEntry = { key: string; suffix: string; positions: Position[] };
export type Difficulty = "easy" | "medium" | "hard";

function toNote(raw: string): Note | null {
  if ((NOTES as readonly string[]).includes(raw)) return NOTES.find((n) => n === raw) ?? null;
  return ENHARMONIC[raw] ?? null;
}

type ParsedName = { root: Note; quality: string; bass: Note | null };
function parseName(name: string): ParsedName | null {
  const m = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/.exec(name.trim());
  if (!m) return null;
  const root = toNote(m[1]);
  const bass = m[3] ? toNote(m[3]) : null;
  if (!root || (m[3] && !bass)) return null;
  return { root, quality: m[2], bass };
}

function shift(note: Note, semitones: number): Note {
  const i = NOTES.indexOf(note);
  return NOTES[(((i + semitones) % 12) + 12) % 12];
}

export function transposeChord({ name, semitones }: { name: string; semitones: number }): string {
  const p = parseName(name);
  if (!p) return name;
  const bass = p.bass ? `/${shift(p.bass, semitones)}` : "";
  return `${shift(p.root, semitones)}${p.quality}${bass}`;
}

export function transposeKey({ key, semitones }: { key: string; semitones: number }): string {
  return transposeChord({ name: key, semitones });
}

const CHORDS: Record<string, ChordEntry[]> = guitar.chords;

export function lookupChord(name: string): ChordEntry | null {
  const p = parseName(name);
  if (!p) return null;
  const list = CHORDS[DB_KEY[p.root]] ?? [];
  const suffix = SUFFIX_ALIAS[p.quality] ?? p.quality;
  if (p.bass) {
    // DB only has plain major ("/B") and minor ("m/B") slash chords; anything else has no honest diagram.
    if (suffix !== "major" && suffix !== "minor") return null;
    const slash = `${suffix === "minor" ? "m" : ""}/${p.bass}`;
    return list.find((c) => c.suffix === slash) ?? null;
  }
  return list.find((c) => c.suffix === suffix) ?? null;
}

function barreSpan(position: Position, barre: number): number {
  const idx = position.frets.flatMap((f, i) => (f === barre ? [i] : []));
  return idx.length ? idx[idx.length - 1] - idx[0] + 1 : 0;
}

export function difficultyOf(position: Position): Difficulty {
  const widest = Math.max(0, ...position.barres.map((b) => barreSpan(position, b)));
  if (widest >= 5 || (widest > 0 && position.baseFret > 5)) return "hard";
  if (widest > 0 || position.baseFret > 1) return "medium";
  return "easy";
}

const RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

export function voicingsFor({ name, easiestFirst = false }: { name: string; easiestFirst?: boolean }): Position[] {
  const positions = lookupChord(name)?.positions ?? [];
  if (!easiestFirst) return positions;
  return positions
    .map((p, i) => ({ p, i }))
    .sort((a, b) => RANK[difficultyOf(a.p)] - RANK[difficultyOf(b.p)] || a.p.baseFret - b.p.baseFret || a.i - b.i)
    .map(({ p }) => p);
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "Dễ", medium: "Vừa", hard: "Khó" };

// Positions store frets relative to baseFret (1 = baseFret); these convert to absolute frets.
const absFret = (p: Position, f: number) => (f <= 0 ? f : f + p.baseFret - 1);
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]; // standard tuning E A D G B E

export function midiOf(p: Position): number[] {
  return p.frets.flatMap((f, i) => (f < 0 ? [] : [OPEN_STRING_MIDI[i] + absFret(p, f)]));
}

export function tabOf(p: Position): string {
  return p.frets.map((f) => (f < 0 ? "x" : String(absFret(p, f)))).join(" ");
}

export function handHint(p: Position): string {
  const widest = p.barres.map((b) => ({ fret: absFret(p, b), span: barreSpan(p, b) })).sort((a, b) => b.span - a.span)[0];
  if (widest && widest.span >= 5) return `Ngón trỏ chặn cả cần ở ngăn ${widest.fret}. Đặt ngón sát phím đàn để đỡ rè.`;
  if (widest) return `Chặn ${widest.span} dây ở ngăn ${widest.fret}, không cần chặn cả cần.`;
  if (p.baseFret > 1) return `Bấm từ ngăn ${p.baseFret}, tắt các dây đánh dấu ×.`;
  return "Thế tay mở, không cần chặn.";
}
