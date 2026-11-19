"use client";

import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { strum } from "@/lib/audio";
import { NOTES } from "@hopamfree/core/chords";
import { listenPitch } from "@/lib/mic";
import { sfx } from "@/lib/sfx";
import { centsOff, median, nearestString, TUNINGS, verdict, type Tuning } from "@/lib/tuner";
import { midiName } from "@/lib/voice";

const READ_EVERY_MS = 50;
const SMOOTH = 5; // readings in the median
const SILENT = 10; // empty readings (half a second) before the needle rests
const HOLD = 12; // in-tune readings in a row (0.6 s) before a string counts as done
const SCALE = 50; // cents from the centre to either end of the meter
const FLAT_END = -SCALE;

type Mic = { kind: "off" } | { kind: "asking" } | { kind: "denied" } | { kind: "on" };
type Reading = { hz: number; string: number; cents: number };

// Pegs as they sit on a 3+3 headstock, top to bottom: the 4th, 5th and 6th strings on the left, 3rd, 2nd, 1st on the right.
const LEFT = [2, 1, 0];
const RIGHT = [3, 4, 5];
const POST_Y = [70, 140, 210];
const nutX = (i: number) => 75 + i * 10;

const noteOf = (midi: number) => NOTES[midi % 12];
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

export function Tuner() {
  const [tuning, setTuning] = useState<Tuning>(TUNINGS[0]);
  const [auto, setAuto] = useState(true);
  const [picked, setPicked] = useState(0);
  const [mic, setMic] = useState<Mic>({ kind: "off" });
  const [reading, setReading] = useState<Reading | null>(null);
  const [tuned, setTuned] = useState<ReadonlySet<number>>(new Set());

  // The pitch callback outlives renders, so it reads the current choices from here.
  const choice = useRef({ auto, picked, strings: tuning.strings as readonly number[] });
  useEffect(() => {
    choice.current = { auto, picked, strings: tuning.strings };
  }, [auto, picked, tuning]);
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);

  const start = async () => {
    sfx("pop"); // inside the tap: also wakes the audio for the chime later
    setMic({ kind: "asking" });
    const recent: number[] = [];
    let silent = 0;
    let held = { string: -1, count: 0 };
    try {
      stop.current = await listenPitch({
        everyMs: READ_EVERY_MS,
        onPitch: (hz) => {
          if (hz === null) {
            silent += 1;
            if (silent === SILENT) {
              recent.length = 0;
              setReading(null);
            }
            return;
          }
          silent = 0;
          recent.push(hz);
          if (recent.length > SMOOTH) recent.shift();
          const smooth = median(recent);
          const { auto, picked, strings } = choice.current;
          const string = auto ? nearestString({ hz: smooth, strings }) : picked;
          const cents = centsOff({ hz: smooth, midi: strings[string] });
          setReading({ hz: smooth, string, cents });
          held = verdict(cents) === "in-tune" ? { string, count: held.string === string ? held.count + 1 : 1 } : { string: -1, count: 0 };
          if (held.count === HOLD) {
            sfx("chime");
            setTuned((done) => new Set(done).add(string));
          }
        },
      });
      setMic({ kind: "on" });
    } catch {
      setMic({ kind: "denied" });
    }
  };

  const pick = (string: number) => {
    setAuto(false);
    setPicked(string);
    strum([tuning.strings[string]]);
  };

  const changeTuning = (id: string) => {
    const next = TUNINGS.find((t) => t.id === id);
    if (!next) return;
    setTuning(next);
    setTuned(new Set());
    setReading(null);
  };

  const target = reading?.string ?? (auto ? null : picked);
  const state = reading ? verdict(reading.cents) : null;
  const allDone = tuned.size === tuning.strings.length;
  useEffect(() => {
    if (allDone) sfx("success");
  }, [allDone]);

  return (
    <section aria-label="Lên dây đàn" className="bar overflow-hidden rounded-lg bg-bar text-bar-ink">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bar-ink/15 px-5 py-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <span className="sr-only">Kiểu lên dây</span>
          <select value={tuning.id} onChange={(e) => changeTuning(e.target.value)} className="min-h-10 rounded-full border border-bar-ink/30 bg-transparent px-4 font-bold text-bar-ink">
            {TUNINGS.map((t) => (
              <option key={t.id} value={t.id} className="text-ink">
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" role="switch" aria-checked={auto} onClick={() => setAuto(!auto)} className="flex min-h-10 items-center gap-3 text-sm font-bold">
          Tự nhận dây
          <span className={`relative h-6 w-11 rounded-full transition-colors ${auto ? "bg-accent" : "bg-bar-ink/25"}`}>
            <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-bar-ink transition-transform ${auto ? "translate-x-5" : ""}`} />
          </span>
        </button>
      </div>

      <Meter reading={reading} />

      <div className="px-5 pb-2 text-center" aria-live="polite">
        <p className="font-serif text-6xl leading-none">
          {target === null ? "–" : noteOf(tuning.strings[target])}
          {target !== null && <sub className="ml-0.5 font-sans text-xl text-bar-ink/60">{midiName(tuning.strings[target]).slice(-1)}</sub>}
        </p>
        <p className={`mt-3 min-h-7 text-lg font-bold ${state === "in-tune" ? "text-accent" : ""}`}>
          <Advice mic={mic} state={state} auto={auto} allDone={allDone} name={target === null ? null : noteOf(tuning.strings[target])} />
        </p>
        <p className="min-h-5 text-sm text-bar-ink/60">{reading && `${reading.hz.toFixed(1).replace(".", ",")} Hz, lệch ${signed(Math.round(reading.cents))} cent`}</p>
      </div>

      <div className="flex items-start justify-center gap-3 px-5 pt-4 pb-6">
        <Pegs strings={LEFT} tuning={tuning} target={target} tuned={tuned} onPick={pick} />
        <Headstock target={target} />
        <Pegs strings={RIGHT} tuning={tuning} target={target} tuned={tuned} onPick={pick} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-bar-ink/15 px-5 py-4 text-sm">
        {mic.kind === "on" ? (
          <>
            <span className="flex items-center gap-2 text-bar-ink/70">
              <span aria-hidden className="h-2 w-2 rounded-full bg-accent motion-safe:animate-pulse" />
              Đang nghe. Âm thanh không rời khỏi máy.
            </span>
            <button
              type="button"
              onClick={() => {
                sfx("unpop");
                stop.current?.();
                stop.current = null;
                setReading(null);
                setMic({ kind: "off" });
              }}
              className="min-h-10 rounded-full border border-bar-ink/30 px-4 font-bold"
            >
              Tắt micro
            </button>
          </>
        ) : (
          <>
            <Mascot size={40} motion={allDone ? "bob" : "idle"} />
            <span className={mic.kind === "denied" ? "text-accent" : "text-bar-ink/70"}>
              {mic.kind === "denied" ? "Trình duyệt chưa cho dùng micro. Bật quyền micro cho trang này rồi thử lại." : "Bấm một dây để nghe nốt mẫu, hoặc bật micro để Mầm nghe bạn gảy."}
            </span>
            <button type="button" disabled={mic.kind === "asking"} onClick={() => void start()} className="fx min-h-11 rounded-full bg-accent px-5 font-extrabold text-on-accent disabled:opacity-50">
              Bật micro
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function Advice({ mic, state, auto, allDone, name }: { mic: Mic; state: "low" | "high" | "in-tune" | null; auto: boolean; allDone: boolean; name: string | null }) {
  if (allDone) return <>Cả sáu dây đã chuẩn. Đàn thôi!</>;
  if (state === "in-tune") return <>Chuẩn rồi</>;
  if (state === "low") return <>Thấp quá, vặn chặt dây lên</>;
  if (state === "high") return <>Cao quá, nới dây ra</>;
  if (mic.kind !== "on") return null;
  return <>{auto || !name ? "Gảy một dây cho ngân" : `Gảy dây ${name} cho ngân`}</>;
}

/** A line of cents with a lantern hung on it: off to the left is flat, to the right sharp; it lights up in tune. */
function Meter({ reading }: { reading: Reading | null }) {
  const offset = reading ? Math.max(-1, Math.min(1, reading.cents / SCALE)) : 0;
  const lit = reading !== null && verdict(reading.cents) === "in-tune";
  return (
    <div className="relative mx-5 mt-6 mb-4 h-36 sm:mx-10" role="meter" aria-label="Độ lệch so với nốt chuẩn" aria-valuemin={FLAT_END} aria-valuemax={SCALE} aria-valuenow={reading ? Math.round(reading.cents) : 0}>
      <div aria-hidden className="absolute inset-x-0 top-3 h-px bg-bar-ink/35" />
      <div aria-hidden className={`absolute top-0 left-1/2 h-[calc(100%-1.5rem)] w-[10%] -translate-x-1/2 rounded-md transition-colors duration-300 ${lit ? "bg-accent/25" : "bg-bar-ink/8"}`} />
      <div aria-hidden className="absolute inset-x-0 bottom-6 flex items-end justify-between">
        {Array.from({ length: 21 }, (_, i) => (
          <span key={i} className={`w-px ${i % 5 === 0 ? "h-4 bg-bar-ink/60" : "h-2 bg-bar-ink/30"}`} />
        ))}
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 flex justify-between text-xs font-semibold text-bar-ink/60">
        <span>Thấp</span>
        <span>Chuẩn</span>
        <span>Cao</span>
      </div>
      <div
        aria-hidden
        className={`absolute top-3 -translate-x-1/2 transition-[left,opacity] duration-150 ease-out ${reading ? "opacity-100" : "opacity-40"}`}
        style={{ left: `${50 + offset * 50}%` }}
      >
        <svg width="44" height="76" viewBox="0 0 60 104" className={`transition-[filter] duration-300 ${lit ? "drop-shadow-[0_0_14px_var(--accent)]" : ""}`}>
          <path d="M30 0v14" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <rect x="21" y="14" width="18" height="6" rx="2" fill="currentColor" />
          <ellipse cx="30" cy="48" rx="25" ry="28" style={{ fill: lit ? "var(--accent)" : "color-mix(in oklab, var(--accent) 35%, var(--bar))" }} className="transition-[fill] duration-300" />
          <path d="M14 48h32M30 22v52" stroke="var(--bar)" strokeWidth="1.5" opacity="0.25" />
          <rect x="21" y="74" width="18" height="6" rx="2" fill="currentColor" />
          <path d="M30 80v16" style={{ stroke: "var(--accent)" }} strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function Pegs({ strings, tuning, target, tuned, onPick }: { strings: number[]; tuning: Tuning; target: number | null; tuned: ReadonlySet<number>; onPick: (string: number) => void }) {
  return (
    <div className="flex flex-col gap-2 pt-8">
      {strings.map((s) => {
        const midi = tuning.strings[s];
        const on = target === s;
        const done = tuned.has(s);
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            aria-label={`Dây ${6 - s}, ${midiName(midi)}${done ? ", đã chuẩn" : ""}. Bấm để nghe nốt mẫu`}
            aria-pressed={on}
            className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 font-serif text-xl transition-colors duration-300 ${on ? "border-accent bg-accent text-on-accent" : done ? "border-accent text-accent" : "border-bar-ink/30 text-bar-ink hover:border-bar-ink/60"}`}
          >
            {noteOf(midi)}
            {done && !on && (
              <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="absolute -top-1 -right-1 rounded-full bg-accent p-0.5 text-on-accent">
                <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** A plain 3+3 headstock: three posts a side, strings fanning down to the nut. The string being tuned glows. */
function Headstock({ target }: { target: number | null }) {
  const post = (s: number) => ({ x: LEFT.includes(s) ? 70 : 130, y: POST_Y[(LEFT.includes(s) ? LEFT : RIGHT).indexOf(s)] });
  return (
    <svg aria-hidden width="160" height="240" viewBox="0 0 200 300" className="shrink-0">
      <path d="M62 300 L58 250 C44 150 30 70 48 26 Q100 -6 152 26 C170 70 156 150 142 250 L138 300 Z" style={{ fill: "color-mix(in oklab, var(--link) 70%, var(--bar))" }} />
      <path d="M48 26 Q100 -6 152 26" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      {[...LEFT, ...RIGHT].map((s) => {
        const p = post(s);
        const on = target === s;
        return (
          <g key={s}>
            <line x1={p.x < 100 ? 20 : 180} y1={p.y} x2={p.x} y2={p.y} stroke="currentColor" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
            <line x1={p.x} y1={p.y} x2={nutX(s)} y2={290} stroke={on ? "var(--accent)" : "currentColor"} strokeOpacity={on ? 1 : 0.55} strokeWidth={on ? 2.5 : s < 3 ? 1.8 : 1.2} className="transition-[stroke] duration-300" />
            <circle cx={p.x} cy={p.y} r="7" fill="currentColor" fillOpacity="0.85" />
          </g>
        );
      })}
      <rect x="66" y="286" width="68" height="8" rx="2" fill="currentColor" fillOpacity="0.85" />
    </svg>
  );
}
