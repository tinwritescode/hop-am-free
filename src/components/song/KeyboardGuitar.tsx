"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { strumStroke } from "@/lib/audio";
import { midiOf } from "@/lib/chords";
import { CHORD_KEYS, keyAction, type StrumDir } from "@/lib/keyboard-guitar";
import { currentVoicing, type RailChord } from "./ChordPanels";

function typingIn(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

const KBD = "inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-line-strong bg-surface px-1 font-mono text-xs font-bold text-ink shadow-[0_2px_0_var(--line-strong)]";

/** The laptop keyboard as a guitar: number keys hold a chord, Space and the arrows strum, left/right walk the lyrics. */
export function KeyboardGuitar({
  chords,
  active,
  capo,
  onPick,
  stepChords,
  step,
  onStep,
}: {
  chords: RailChord[];
  active: RailChord | undefined;
  capo: number;
  onPick: (name: string) => void;
  /** The chord name at each chord mark in the lyrics, in reading order. */
  stepChords: string[];
  step: number | null;
  onStep: (i: number) => void;
}) {
  const [lit, setLit] = useState<StrumDir | null>(null);
  const unlight = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voicing = active ? currentVoicing(active) : null;
  const stepCount = stepChords.length;
  // Keys pressed together (a chord key and Space) arrive before React re-renders, so the handler reads and writes these.
  const live = useRef({ chord: active?.name, step });
  useLayoutEffect(() => {
    live.current = { chord: active?.name, step };
  }, [active?.name, step]);

  const pick = (name: string) => {
    live.current.chord = name;
    onPick(name);
  };
  const play = (dir: StrumDir) => {
    const chord = chords.find((c) => c.name === live.current.chord);
    const position = chord ? currentVoicing(chord) : null;
    if (!position) return;
    strumStroke({ midi: midiOf({ position, capo }), dir });
    setLit(dir);
    if (unlight.current) clearTimeout(unlight.current);
    unlight.current = setTimeout(() => setLit(null), 140);
  };

  const walk = (by: 1 | -1) => {
    if (stepCount === 0) return;
    const now = live.current.step;
    const next = Math.min(stepCount - 1, Math.max(0, now === null ? (by > 0 ? 0 : stepCount - 1) : now + by));
    live.current = { chord: stepChords[next], step: next };
    onStep(next);
  };

  // Subscribed again on every render so the handler sees the current chord list and voicings.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || typingIn(e.target)) return;
      const action = keyAction({ key: e.key, chordCount: chords.length });
      if (!action) return;
      e.preventDefault(); // Space and the arrows would scroll the page or press the focused button
      switch (action.kind) {
        case "chord":
          return pick(chords[action.index].name);
        case "strum":
          return play(action.dir);
        case "step":
          return walk(action.by);
        default: {
          const _exhaustive: never = action;
          return _exhaustive;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const strumButton = (dir: StrumDir, label: string, keys: string) => (
    <button
      type="button"
      onClick={(e) => {
        e.currentTarget.blur();
        play(dir);
      }}
      disabled={!voicing}
      aria-label={label}
      className={`inline-flex h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-extrabold transition-colors disabled:opacity-40 ${lit === dir ? "border-link bg-link text-surface" : "border-line-strong bg-surface text-ink"}`}
    >
      {dir === "down" ? "↓" : "↑"} <span className="hidden font-semibold opacity-70 lg:inline">{keys}</span>
    </button>
  );

  const stepButton = (by: 1 | -1, label: string, arrow: string) => (
    <button
      type="button"
      aria-label={label}
      disabled={stepCount === 0}
      onClick={(e) => {
        e.currentTarget.blur();
        walk(by);
      }}
      className="inline-flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface text-base font-extrabold text-ink disabled:opacity-40"
    >
      {arrow}
    </button>
  );

  return (
    <section aria-label="Đàn bằng bàn phím" className="flex flex-col gap-3 border-b border-line bg-hover/50 px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="min-w-[3.5ch] font-serif text-[40px] leading-none font-normal text-link">{active?.name ?? "–"}</p>
        {strumButton("down", "Quạt xuống", "Space / ↓")}
        {strumButton("up", "Quạt lên", "↑")}
        <div className="flex items-center gap-2 text-sm text-soft">
          {stepButton(-1, "Hợp âm trước trong lời", "←")}
          <span>{step === null ? "Bấm → để đánh theo lời" : `Hợp âm ${step + 1}/${stepCount} trong lời`}</span>
          {stepButton(1, "Hợp âm sau trong lời", "→")}
        </div>
      </div>
      {!voicing && active && <p className="text-sm text-warn">Thư viện chưa có thế bấm cho {active.name}, nên chưa đánh được hợp âm này.</p>}
      <div role="group" aria-label="Phím hợp âm" className="flex flex-wrap gap-1.5">
        {chords.map((c, i) => (
          <button
            key={c.name}
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              pick(c.name);
            }}
            aria-pressed={c.name === active?.name}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm lg:pl-1.5 font-extrabold ${c.name === active?.name ? "border-link bg-surface text-link ring-2 ring-link" : "border-line bg-surface text-ink"}`}
          >
            {CHORD_KEYS[i] ? <kbd className={`${KBD} max-lg:hidden`}>{CHORD_KEYS[i].toUpperCase()}</kbd> : null}
            {c.name}
          </button>
        ))}
      </div>
      <p className="hidden text-xs text-soft lg:block">Tay trái giữ hợp âm bằng phím số, tay phải quạt bằng Space hoặc mũi tên, như cầm đàn thật.</p>
    </section>
  );
}
