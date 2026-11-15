// Fills songs.capo for existing songs. Dry run by default; pass --write to save.
//   Step A: a capo the stored sheet states ("Capo 3", "kẹp capo ngăn 2") → source "sheet".
//   Step B: songs still unknown → ask the AI model; only high/medium guesses whose key maths checks out → source "ai".
// Never replaces a value from the sheet or an editor, and never fetches source_url. AI answers are cached in ai_cache,
// so a rerun (or --write after a dry run) asks the model nothing new and applies the same answers. Safe to rerun.
//
//   pnpm db:backfill-capo [--write] [--limit N] [--concurrency 3] [--out file.csv]
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../src/db";
import { writeCapo, type CapoWrite } from "../src/db/capo";
import { songs } from "../src/db/schema";
import { guessCapo } from "../src/lib/ai";
import { CAPO_SOURCES, checkCapoGuess, mayReplace, parseCapoMention, type CapoGuess, type CapoSource, type GuessVerdict } from "../src/lib/capo";
import { toSong, type Song } from "../src/lib/song";

const Args = z.object({
  write: z.boolean().default(false),
  limit: z.coerce.number().int().positive().optional(),
  concurrency: z.coerce.number().int().min(1).max(8).default(3),
  out: z.string().default(join(tmpdir(), `capo-backfill-${Date.now()}.csv`)),
});
const { values } = parseArgs({
  options: { write: { type: "boolean" }, "dry-run": { type: "boolean" }, limit: { type: "string" }, concurrency: { type: "string" }, out: { type: "string" } },
});
if (values.write && values["dry-run"]) throw new Error("pass either --write or --dry-run, not both");
const args = Args.parse(values);
const MIN_GAP_MS = 400; // between model calls, across workers
const RETRIES = 3;

type Outcome =
  | { step: "kept"; why: string }
  | { step: "sheet"; fret: number; written: boolean }
  | { step: "ai"; guess: CapoGuess; verdict: GuessVerdict; written: boolean }
  | { step: "error"; message: string };
type Result = { song: Song; before: string; outcome: Outcome };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let nextSlot = 0;
async function throttle() {
  const wait = nextSlot - Date.now();
  nextSlot = Math.max(Date.now(), nextSlot) + MIN_GAP_MS;
  if (wait > 0) await sleep(wait);
}

async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      await throttle();
      return await run();
    } catch (err) {
      if (attempt >= RETRIES) throw err;
      await sleep(2000 * attempt);
    }
  }
}

async function save({ song, value }: { song: Song; value: CapoWrite }): Promise<boolean> {
  return args.write ? writeCapo({ where: { id: song.id }, value }) : false;
}

async function stepA({ song, existing }: { song: Song; existing: CapoSource | null }): Promise<Outcome | null> {
  const fret = parseCapoMention(song.raw);
  if (fret === null) return null;
  if (!mayReplace({ existing, incoming: "sheet" })) return { step: "kept", why: `${existing} already set; sheet says ${fret}` };
  return { step: "sheet", fret, written: await save({ song, value: { capo: fret, capoSource: "sheet" } }) };
}

async function stepB(song: Song): Promise<Outcome> {
  try {
    const guess = await withRetry(() => guessCapo(song));
    const verdict = checkCapoGuess({ key: song.key, guess });
    const written = verdict.kind === "store" && (await save({ song, value: { capo: verdict.fret, capoSource: "ai" } }));
    return { step: "ai", guess, verdict, written };
  } catch (err) {
    return { step: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

async function backfillOne({ row }: { row: typeof songs.$inferSelect }): Promise<Result> {
  const song = toSong(row);
  const existing = z.enum(CAPO_SOURCES).nullable().parse(row.capoSource);
  const before = existing ? `${row.capo ?? "unknown"} (${existing})` : "unknown";
  const fromSheet = await stepA({ song, existing });
  if (fromSheet) return { song, before, outcome: fromSheet };
  if (!mayReplace({ existing, incoming: "ai" })) return { song, before, outcome: { step: "kept", why: `${existing} already set` } };
  return { song, before, outcome: await stepB(song) };
}

async function runAll(rows: (typeof songs.$inferSelect)[]): Promise<Result[]> {
  const results: Result[] = [];
  let i = 0;
  const worker = async () => {
    while (i < rows.length) {
      const row = rows[i++];
      const result = await backfillOne({ row });
      results.push(result);
      if (results.length % 25 === 0) console.error(`… ${results.length}/${rows.length}`);
    }
  };
  await Promise.all(Array.from({ length: args.concurrency }, worker));
  return results.sort((a, b) => a.song.id - b.song.id);
}

const csvCell = (v: string | number | boolean | null) => {
  const s = v === null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function csvRow({ song, before, outcome }: Result): (string | number | boolean | null)[] {
  const base = [song.id, song.slug, song.title, song.artist, song.key, before, outcome.step];
  switch (outcome.step) {
    case "kept":
      return [...base, null, null, null, null, "kept", false, outcome.why];
    case "sheet":
      return [...base, outcome.fret, "sheet", null, null, "store", outcome.written, "sheet text states it"];
    case "ai": {
      const { guess, verdict } = outcome;
      return [...base, guess.capo, "ai", guess.confidence, guess.soundingKey, verdict.kind === "store" ? "store" : `skip:${verdict.why}`, outcome.written, guess.reason];
    }
    case "error":
      return [...base, null, null, null, null, "error", false, outcome.message];
    default: {
      const _exhaustive: never = outcome;
      return _exhaustive;
    }
  }
}

const HEADER = ["id", "slug", "title", "artist", "sheet_key", "before", "step", "capo", "source", "confidence", "sounding_key", "verdict", "written", "reason_or_error"];

function tally<T extends string | number>(items: T[]): string {
  const counts = new Map<T, number>();
  for (const x of items) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, n]) => `${k}: ${n}`).join(", ") || "(none)";
}

function summarize(results: Result[]) {
  const stored = results.flatMap(({ outcome: o }) =>
    o.step === "sheet" ? [{ source: "sheet", fret: o.fret }] : o.step === "ai" && o.verdict.kind === "store" ? [{ source: "ai", fret: o.verdict.fret }] : [],
  );
  const ai = results.flatMap(({ outcome: o }) => (o.step === "ai" ? [o] : []));
  const unknown = results.filter(({ outcome: o }) => o.step === "error" || (o.step === "ai" && o.verdict.kind === "skip"));
  const lines = [
    `mode: ${args.write ? "WRITE" : "dry run (nothing saved; pass --write)"}`,
    `songs scanned: ${results.length}`,
    `steps: ${tally(results.map((r) => r.outcome.step))}`,
    `new values by source: ${tally(stored.map((s) => s.source))}${args.write ? `; rows written: ${results.filter((r) => "written" in r.outcome && r.outcome.written).length}` : ""}`,
    `AI answers by confidence: ${tally(ai.map((o) => o.guess.confidence))}`,
    `AI verdicts: ${tally(ai.map((o) => (o.verdict.kind === "store" ? "store" : `skip:${o.verdict.why}`)))}`,
    `capo histogram (new values): ${tally(stored.map((s) => s.fret))}`,
    `capo histogram (AI stored, by confidence): high → ${tally(ai.flatMap((o) => (o.verdict.kind === "store" && o.guess.confidence === "high" ? [o.verdict.fret] : [])))}; medium → ${tally(ai.flatMap((o) => (o.verdict.kind === "store" && o.guess.confidence === "medium" ? [o.verdict.fret] : [])))}`,
    `left unknown: ${unknown.length}${unknown.length ? ` (e.g. ${unknown.slice(0, 15).map((r) => r.song.slug).join(", ")}${unknown.length > 15 ? ", …" : ""})` : ""}`,
    `errors: ${results.filter((r) => r.outcome.step === "error").length}`,
  ];
  return lines.join("\n");
}

const rows = await db().select().from(songs).orderBy(asc(songs.id)).limit(args.limit ?? 100_000);
console.error(`${rows.length} song(s); ${args.write ? "writing" : "dry run"}; concurrency ${args.concurrency}`);
const results = await runAll(rows);
await writeFile(args.out, [HEADER, ...results.map(csvRow)].map((r) => r.map(csvCell).join(",")).join("\n") + "\n");
console.log(summarize(results));
console.log(`per-song results: ${args.out}`);
await db().$client.end();
