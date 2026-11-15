"use client";

import { ChordDiagram } from "@/components/ChordDiagram";
import { playEffect } from "@/components/fx/playEffect";
import { Mascot } from "@/components/Mascot";
import { DIFFICULTY_LABEL, difficultyOf, handHint, midiOf, tabOf, type Difficulty, type Position } from "@/lib/chords";
import type { Substitution, TourStep } from "@/lib/ai-schema";
import { strum } from "@/lib/audio";
import { sfx } from "@/lib/sfx";
import type { AiState } from "./useAi";

export type RailChord = { name: string; sub: Substitution | null; voicings: Position[]; voicingIndex: number; inTour: boolean };

const LEVEL_TEXT: Record<Difficulty, string> = { easy: "text-ok", medium: "text-ink", hard: "text-warn" };
const LEVEL_PILL: Record<Difficulty, string> = { easy: "bg-hover", medium: "bg-hover", hard: "bg-warn-bg" };

export function currentVoicing(c: RailChord): Position | null {
  return c.voicings.length ? c.voicings[c.voicingIndex % c.voicings.length] : null;
}

export function ActiveChordCard({ chord, count, capo, onPickVoicing }: { chord: RailChord; count: number; capo: number; onPickVoicing: (i: number) => void }) {
  const position = currentVoicing(chord);
  const level = position ? difficultyOf(position) : null;
  return (
    <section aria-label="Hợp âm đang xem" className="flex flex-col gap-3.5 rounded-lg border border-line bg-surface p-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-soft">Đang xem · bấm hợp âm bất kỳ trong bài</p>
          <p className="font-serif text-[42px] leading-tight font-normal text-link">{chord.name}</p>
        </div>
        {level && <span className={`mt-1 rounded-full px-3 py-1 text-xs font-extrabold ${LEVEL_PILL[level]} ${LEVEL_TEXT[level]}`}>{DIFFICULTY_LABEL[level]}</span>}
      </div>
      {position ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ChordDiagram name={chord.name} position={position} scale={1.05} showFingers />
          <div className="flex min-w-[7.5rem] flex-1 flex-col gap-2.5">
            <p className="font-mono text-[15px] font-semibold tracking-[0.12em]">{tabOf(position)}</p>
            <p className="text-sm leading-relaxed text-soft">{handHint(position)}</p>
            <p className="text-[13px] text-soft">Xuất hiện {count} lần trong bài</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-soft">Thư viện chưa có thế bấm cho hợp âm này.</p>
      )}
      {chord.sub && (
        <p className="rounded-2xl bg-hover px-3 py-2 text-[13px] leading-normal text-ink">
          Mầm đổi từ <strong>{chord.sub.from}</strong>: {chord.sub.reason}
        </p>
      )}
      <ListenButton position={position} capo={capo} />
      <VoicingStrip chord={chord} onPick={onPickVoicing} />
    </section>
  );
}

export function ListenButton({ position, capo }: { position: Position | null; capo: number }) {
  return (
    <button
      type="button"
      disabled={!position}
      onClick={() => position && strum(midiOf({ position, capo }))}
      className="inline-flex h-[42px] items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-bold disabled:opacity-40"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      </svg>
      Nghe
    </button>
  );
}

/** Every known hand shape for the chord; picking one makes it the shape shown everywhere for this chord. */
export function VoicingStrip({ chord, onPick }: { chord: RailChord; onPick: (i: number) => void }) {
  if (chord.voicings.length < 2) return null;
  const selected = chord.voicingIndex % chord.voicings.length;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-bold text-soft">
        {chord.voicings.length} thế bấm {chord.name} · chạm để chọn
      </p>
      <div role="group" aria-label={`Các thế bấm ${chord.name}`} className="flex gap-1.5 overflow-x-auto pb-1">
        {chord.voicings.map((p, i) => {
          const level = difficultyOf(p);
          const on = i === selected;
          return (
            <button
              key={i}
              type="button"
              aria-pressed={on}
              aria-label={`Thế ${i + 1}: ${tabOf(p)}, ${DIFFICULTY_LABEL[level]}`}
              onClick={() => onPick(i)}
              className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border-[1.5px] px-1 pt-1.5 pb-1 ${on ? "border-link bg-hover" : "border-transparent bg-bg"}`}
            >
              <ChordDiagram name={chord.name} position={p} scale={0.45} color={on ? "var(--link)" : "var(--ink)"} />
              <span className={`text-[11px] font-extrabold ${LEVEL_TEXT[level]}`}>{DIFFICULTY_LABEL[level]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChordGrid({ chords, active, onPick }: { chords: RailChord[]; active: string; onPick: (name: string) => void }) {
  const hard = chords.filter((c) => {
    const p = currentVoicing(c);
    return p && difficultyOf(p) === "hard";
  }).length;
  return (
    <section aria-label="Hợp âm trong bài" className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-serif text-[17px] font-normal">Hợp âm trong bài</h2>
        <span className="text-[13px] font-semibold text-soft">
          {chords.length} hợp âm · {hard} khó
        </span>
      </div>
      <div className="grid max-h-[340px] grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-1.5 overflow-y-auto">
        {chords.map((c) => (
          <ChordTile key={c.name} chord={c} on={c.name === active} onPick={onPick} scale={0.45} />
        ))}
      </div>
    </section>
  );
}

export function ChordTile({ chord, on, onPick, scale = 0.5 }: { chord: RailChord; on: boolean; onPick: (name: string) => void; scale?: number }) {
  const p = currentVoicing(chord);
  const level = p ? difficultyOf(p) : null;
  const tone = on ? "border-link bg-hover" : chord.inTour ? "border-accent bg-hover" : chord.sub ? "border-dashed border-line-strong bg-bg" : "border-transparent bg-bg";
  return (
    <button type="button" aria-pressed={on} onClick={() => onPick(chord.name)} className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border-[1.5px] px-0.5 pt-2 pb-1.5 ${tone}`}>
      <span className={`text-[13px] font-extrabold whitespace-nowrap ${chord.sub ? "text-link" : "text-ink"}`}>{chord.name}</span>
      {p ? <ChordDiagram name={chord.name} position={p} scale={scale} color={on ? "var(--link)" : "var(--ink)"} /> : <span className="h-20 text-xs text-soft">—</span>}
      {level && <span className={`text-[11px] font-extrabold ${LEVEL_TEXT[level]}`}>{DIFFICULTY_LABEL[level]}</span>}
    </button>
  );
}

export function TourCta({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-bar py-3.5 pr-4 pl-3 text-bar-ink">
      <Mascot size={84} className="shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <div>
          <p className="font-serif text-[17px] leading-snug font-normal">Học bài này cùng Mầm</p>
          <p className="text-[13px] leading-normal text-bar-ink/80">Vòng hợp âm, chỗ hay, chỗ khó</p>
        </div>
        <button type="button" onClick={onStart} className="fx h-10 rounded-full bg-accent px-4 text-sm font-extrabold text-on-accent">
          Bắt đầu
        </button>
      </div>
    </div>
  );
}

export function TourCard({
  state,
  step,
  display,
  onStep,
  onClose,
  onPick,
  onRetry,
  compact = false,
}: {
  state: AiState<"tour">;
  step: number;
  display: (orig: string) => string;
  onStep: (i: number) => void;
  onClose: () => void;
  onPick: (name: string) => void;
  onRetry: () => void;
  compact?: boolean;
}) {
  const steps: TourStep[] = state.status === "ready" ? state.data.steps : [];
  const current = steps[step];
  return (
    <section aria-label="Mầm dẫn bài" aria-live="polite" className={`flex flex-col gap-3 rounded-lg bg-bar text-bar-ink ${compact ? "p-3.5" : "p-[18px]"}`}>
      <div className="flex items-center gap-2">
        <Mascot size={40} className="shrink-0" />
        <span className="flex-1 text-[13px] font-extrabold text-accent">Mầm dẫn bài{current && ` · ${step + 1}/${steps.length}`}</span>
        <button type="button" onClick={onClose} aria-label="Đóng tour" className="inline-flex size-11 items-center justify-center rounded-full bg-white/10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      {state.status === "loading" && <p className="text-sm text-bar-ink/80">Mầm đang nghe bài và soạn tour…</p>}
      {state.status === "error" && (
        <p className="text-sm text-bar-ink/80">
          {state.message}{" "}
          <button type="button" onClick={onRetry} className="font-extrabold text-accent underline">
            Thử lại
          </button>
        </p>
      )}
      {current && (
        <>
          {!compact && (
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <span key={i} className={`h-1 flex-1 rounded-sm ${i <= step ? "bg-accent" : "bg-white/20"}`} />
              ))}
            </div>
          )}
          <p className={`font-serif font-normal leading-snug ${compact ? "text-base" : "text-xl"}`}>{current.title}</p>
          <p className="text-sm leading-relaxed text-bar-ink/90">{current.body}</p>
          {current.chords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {current.chords.map((c) => (
                <button key={c} type="button" onClick={() => onPick(display(c))} className="h-[30px] rounded-full bg-accent px-3 text-[13px] font-extrabold text-on-accent">
                  {display(c)}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" disabled={step === 0} onClick={() => onStep(step - 1)} className="h-11 rounded-full border border-white/30 px-4 text-sm font-bold disabled:opacity-40">
              Trước
            </button>
            <button
              type="button"
              onClick={(e) => {
                if (step < steps.length - 1) return onStep(step + 1);
                sfx("success");
                playEffect({ effect: "confetti", from: e.currentTarget });
                onClose();
              }}
              className="h-11 flex-1 rounded-full bg-bar-ink px-4 text-sm font-extrabold text-bar"
            >
              {step === steps.length - 1 ? "Xong" : "Tiếp"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
