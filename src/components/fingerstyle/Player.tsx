"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Tab, TabSection } from "@/lib/tab/parse";
import { describeStep, FINGER_ORDER, FINGERS } from "@/lib/tab/describe";
import { playStep, playTab, type TabRun, type Voice } from "@/lib/tab/player";
import { capoAt, stepIndexAt } from "@/lib/tab/timeline";
import { boardWidth, FINGER_COLOR, Fretboard, xOf } from "./Fretboard";
import { TabSystemRow, type SystemView } from "./TabSheet";

const SPEEDS = [
  { value: 0.5, label: "Chậm" },
  { value: 0.75, label: "Vừa" },
  { value: 1, label: "Gốc" },
] as const;
type Speed = (typeof SPEEDS)[number]["value"];

/**
 * Learning a fingerstyle tab: the neck shows where each note is and which finger plucks it, the tab below follows
 * along, and the player can slow down, loop a section or walk through note by note.
 */
export function Player({ tab, voice, columnsPerSecond }: { tab: Tab; voice: Voice; columnsPerSecond: number }) {
  const { steps } = tab;
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(0.75);
  const [loop, setLoop] = useState(false);
  const run = useRef<TabRun | null>(null);
  const frame = useRef(0);
  const neck = useRef<HTMLDivElement>(null);

  const step = index >= 0 ? steps[index] : null;
  const at = step?.at ?? 0;
  const section = tab.sections.findLast((s) => s.start <= at) ?? null;
  const capo = capoAt({ capos: voice.capos, at, initial: voice.capo });
  const capoChanged = index > 0 && capo !== capoAt({ capos: voice.capos, at: steps[index - 1].at, initial: voice.capo });
  const frets = useMemo(() => Math.max(12, ...steps.flatMap((s) => s.notes.map((n) => (n.kind === "fret" ? n.fret + 1 : 0)))), [steps]);

  const views = useMemo<SystemView[]>(
    () =>
      tab.systems.map((system) => {
        const end = system.start + system.width;
        const sec = tab.sections.findLast((s) => s.start <= system.start) ?? null;
        return {
          system,
          steps: steps.filter((s) => s.at >= system.start && s.at < end),
          capos: tab.capos.filter((c) => c.at >= system.start && c.at < end),
          section: sec,
          opensSection: sec?.start === system.start,
        };
      }),
    [tab, steps],
  );

  const halt = useCallback(() => {
    cancelAnimationFrame(frame.current);
    run.current?.stop();
    run.current = null;
    setPlaying(false);
  }, []);
  useEffect(() => halt, [halt]);

  const start = ({ from, looping, pace }: { from: number; looping: boolean; pace: Speed }) => {
    halt();
    const sec = tab.sections.findLast((s) => s.start <= from) ?? null;
    const [lo, hi] = looping && sec ? [sec.start, sec.end] : [0, tab.length];
    const lastInRange = steps.findLast((s) => s.at < hi)?.at ?? lo;
    const r = playTab({ steps, voice, from: from >= lo && from < lastInRange ? from : lo, lo, hi, loop: looping, columnsPerSecond: columnsPerSecond * pace });
    run.current = r;
    setPlaying(true);
    const tick = () => {
      const col = r.columnNow();
      if (col === null) return halt();
      setIndex(stepIndexAt({ steps, at: col }));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const toggle = () => (playing ? halt() : start({ from: at, looping: loop, pace: speed }));
  const go = (delta: number) => {
    halt();
    const i = Math.min(steps.length - 1, Math.max(0, index + delta));
    setIndex(i);
    playStep({ step: steps[i], voice });
  };
  const seek = (column: number) => {
    const i = Math.max(0, stepIndexAt({ steps, at: column }));
    if (playing) return start({ from: steps[i].at, looping: loop, pace: speed });
    setIndex(i);
    playStep({ step: steps[i], voice });
  };
  const practice = (s: TabSection) => {
    halt();
    setLoop(true);
    setIndex(Math.max(0, steps.findIndex((x) => x.at >= s.start)));
  };
  const changeSpeed = (pace: Speed) => {
    setSpeed(pace);
    if (playing) start({ from: at, looping: loop, pace });
  };
  const changeLoop = () => {
    setLoop(!loop);
    if (playing) start({ from: at, looping: !loop, pace: speed });
  };

  // On a narrow screen the neck scrolls: keep the highest note of the step in view.
  useEffect(() => {
    const box = neck.current;
    const top = Math.max(0, ...(step?.notes.map((n) => (n.kind === "fret" ? n.fret : 0)) ?? []));
    if (!box || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({ left: (xOf(top) * box.scrollWidth) / boardWidth(frets) - box.clientWidth * 0.6, behavior: "smooth" });
  }, [step, frets]);

  // Keyboard: space plays or pauses, the arrows walk note by note. Read through a ref so the listener stays put.
  const keys = useRef({ toggle, go });
  useEffect(() => {
    keys.current = { toggle, go };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest("input, select, textarea, button, a")) return;
      if (e.key === " ") keys.current.toggle();
      else if (e.key === "ArrowRight") keys.current.go(1);
      else if (e.key === "ArrowLeft") keys.current.go(-1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const seekRef = useRef(seek);
  const practiceRef = useRef(practice);
  useEffect(() => {
    seekRef.current = seek;
    practiceRef.current = practice;
  });
  const onSeek = useCallback((c: number) => seekRef.current(c), []);
  const onPractice = useCallback((s: TabSection) => practiceRef.current(s), []);

  const round = "inline-flex size-12 items-center justify-center rounded-full border border-line-strong bg-surface text-ink disabled:opacity-40";
  return (
    <div>
      <section aria-label="Cần đàn và điều khiển" className="sticky top-[var(--app-inset-top,0px)] z-10 -mx-5 border-b border-line bg-bg/95 px-5 pt-3 pb-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-6">
          <div ref={neck} className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-line bg-surface px-2 py-2">
            <Fretboard step={step} next={index + 1 < steps.length ? steps[index + 1] : null} frets={frets} capo={capo} />
          </div>
          <div className="flex flex-col gap-2.5 lg:w-[340px] lg:shrink-0">
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
              <span className="rounded-md bg-hover px-2.5 py-1 text-ink">{section?.name ?? "Bắt đầu"}</span>
              <span className={`rounded-md px-2.5 py-1 font-mono ${capoChanged ? "bg-warn text-surface" : "border border-line-strong text-ink"}`}>
                {capoChanged ? `Đổi sang Capo ${capo}!` : `Capo ${capo}`}
              </span>
            </div>
            <ul aria-live="polite" className="min-h-[54px] text-[13px] leading-snug text-ink sm:text-sm">
              {step ? (
                describeStep(step).map((line) => <li key={line}>{line}</li>)
              ) : (
                <li className="text-soft">Bấm ▶ để nghe cả bài, hoặc → để đi từng nốt. Bấm vào nốt bất kỳ trong tab để bắt đầu từ đó.</li>
              )}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" aria-label="Nốt trước" disabled={index <= 0} onClick={() => go(-1)} className={round}>
                ⏮
              </button>
              <button type="button" aria-label={playing ? "Tạm dừng" : "Phát"} onClick={toggle} className="inline-flex size-14 items-center justify-center rounded-full bg-accent text-xl text-on-accent">
                {playing ? "❚❚" : "▶"}
              </button>
              <button type="button" aria-label="Nốt sau" disabled={index >= steps.length - 1} onClick={() => go(1)} className={round}>
                ⏭
              </button>
              <div role="group" aria-label="Tốc độ" className="ml-auto inline-flex gap-0.5 rounded-full bg-hover p-1">
                {SPEEDS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={speed === s.value}
                    onClick={() => changeSpeed(s.value)}
                    className={`h-9 rounded-full px-3 text-[13px] font-extrabold ${speed === s.value ? "bg-surface text-ink shadow-sm" : "text-soft"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3">
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={loop} onChange={changeLoop} className="size-[18px]" />
          Lặp lại đoạn {section?.name ?? "đang tập"}
        </label>
        <ul aria-label="Ngón tay phải" className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-soft">
          {FINGER_ORDER.map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <span aria-hidden className="size-3.5 rounded-full border-[3px] bg-surface" style={{ borderColor: FINGER_COLOR[f] }} />
              <strong className="text-ink">{FINGERS[f].name}</strong> {FINGERS[f].strings}
            </li>
          ))}
        </ul>
      </div>
      <div className="pb-10">
        {views.map((v) => (
          <TabSystemRow
            key={v.system.start}
            view={v}
            active={step && step.at >= v.system.start && step.at < v.system.start + v.system.width ? step.at : null}
            follow={playing}
            onSeek={onSeek}
            onPractice={onPractice}
          />
        ))}
      </div>
    </div>
  );
}
