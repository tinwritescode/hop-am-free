"use client";

import { ChordDiagram } from "@/components/ChordDiagram";
import { Mascot } from "@/components/Mascot";
import { DIFFICULTY_LABEL, difficultyOf, handHint, midiOf, tabOf, type Difficulty, type Position } from "@/lib/chords";
import type { Substitution, TourStep } from "@/lib/ai-schema";
import { strum } from "@/lib/audio";
import type { AiState } from "./useAi";

export type RailChord = { name: string; sub: Substitution | null; voicings: Position[]; voicingIndex: number; inTour: boolean };

const LEVEL_TEXT: Record<Difficulty, string> = { easy: "text-[#1e5a32]", medium: "text-[#7a5a08]", hard: "text-[#8e2f12]" };
const LEVEL_PILL: Record<Difficulty, string> = { easy: "bg-[#e3f3e0]", medium: "bg-[#fbf0c8]", hard: "bg-[#fbe6de]" };

export function currentVoicing(c: RailChord): Position | null {
  return c.voicings.length ? c.voicings[c.voicingIndex % c.voicings.length] : null;
}

export function ActiveChordCard({ chord, count, onPickVoicing }: { chord: RailChord; count: number; onPickVoicing: (i: number) => void }) {
  const position = currentVoicing(chord);
  const level = position ? difficultyOf(position) : null;
  return (
    <section aria-label="Hợp âm đang xem" className="flex flex-col gap-3.5 rounded-3xl bg-white p-[18px] shadow-[0_1px_0_#dce8d8,0_12px_32px_rgba(47,107,71,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-muted">Đang xem · bấm hợp âm bất kỳ trong bài</p>
          <p className="font-serif text-[42px] leading-tight font-bold text-leaf">{chord.name}</p>
        </div>
        {level && <span className={`mt-1 rounded-full px-3 py-1 text-xs font-extrabold ${LEVEL_PILL[level]} ${LEVEL_TEXT[level]}`}>{DIFFICULTY_LABEL[level]}</span>}
      </div>
      {position ? (
        <div className="flex items-center gap-4">
          <ChordDiagram name={chord.name} position={position} scale={1.05} showFingers />
          <div className="flex min-w-0 flex-col gap-2.5">
            <p className="font-mono text-[15px] font-semibold tracking-[0.12em]">{tabOf(position)}</p>
            <p className="text-sm leading-relaxed text-ink-soft">{handHint(position)}</p>
            <p className="text-[13px] text-muted">Xuất hiện {count} lần trong bài</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Thư viện chưa có thế bấm cho hợp âm này.</p>
      )}
      {chord.sub && (
        <p className="rounded-2xl bg-moss px-3 py-2 text-[13px] leading-normal text-sprout-ink">
          Mầm đổi từ <strong>{chord.sub.from}</strong>: {chord.sub.reason}
        </p>
      )}
      <ListenButton position={position} />
      <VoicingStrip chord={chord} onPick={onPickVoicing} />
    </section>
  );
}

export function ListenButton({ position }: { position: Position | null }) {
  return (
    <button
      type="button"
      disabled={!position}
      onClick={() => position && strum(midiOf(position))}
      className="inline-flex h-[42px] items-center justify-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-bold disabled:opacity-40"
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
      <p className="text-xs font-bold text-muted">
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
              className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border-[1.5px] px-1 pt-1.5 pb-1 ${on ? "border-leaf bg-[#e3f1de]" : "border-transparent bg-[#f7faf5]"}`}
            >
              <ChordDiagram name={chord.name} position={p} scale={0.45} color={on ? "#2f6b47" : "#1b2e24"} />
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
    <section aria-label="Hợp âm trong bài" className="rounded-3xl bg-white p-4 shadow-[0_1px_0_#dce8d8,0_12px_32px_rgba(47,107,71,0.10)]">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-serif text-[17px] font-bold">Hợp âm trong bài</h2>
        <span className="text-[13px] font-semibold text-muted">
          {chords.length} hợp âm · {hard} khó
        </span>
      </div>
      <div className="grid max-h-[340px] grid-cols-4 gap-1.5 overflow-y-auto">
        {chords.map((c) => (
          <ChordTile key={c.name} chord={c} on={c.name === active} onPick={onPick} />
        ))}
      </div>
    </section>
  );
}

export function ChordTile({ chord, on, onPick }: { chord: RailChord; on: boolean; onPick: (name: string) => void }) {
  const p = currentVoicing(chord);
  const level = p ? difficultyOf(p) : null;
  const tone = on ? "border-leaf bg-[#e3f1de]" : chord.inTour ? "border-[#e0b63a] bg-[#fdf5d6]" : chord.sub ? "border-transparent bg-[#eef7ea]" : "border-transparent bg-[#f7faf5]";
  return (
    <button type="button" aria-pressed={on} onClick={() => onPick(chord.name)} className={`flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border-[1.5px] px-0.5 pt-2 pb-1.5 ${tone}`}>
      <span className={`text-[13px] font-extrabold whitespace-nowrap ${chord.sub ? "text-sprout-ink" : "text-ink"}`}>{chord.name}</span>
      {p ? <ChordDiagram name={chord.name} position={p} scale={0.5} color={on ? "#2f6b47" : "#1b2e24"} /> : <span className="h-20 text-xs text-muted">—</span>}
      {level && <span className={`text-[11px] font-extrabold ${LEVEL_TEXT[level]}`}>{DIFFICULTY_LABEL[level]}</span>}
    </button>
  );
}

export function TourCta({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-3xl bg-forest py-3.5 pr-4 pl-2.5 text-white">
      <Mascot size={56} onDark className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-serif text-[17px] font-bold">Học bài này cùng Mầm</p>
        <p className="text-[13px] leading-normal text-mist">Vòng hợp âm, chỗ hay, chỗ khó</p>
      </div>
      <button type="button" onClick={onStart} className="h-[42px] rounded-full bg-sun px-4 text-sm font-extrabold text-sun-ink">
        Bắt đầu
      </button>
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
    <section aria-label="Mầm dẫn bài" aria-live="polite" className={`flex flex-col gap-3 rounded-3xl bg-forest text-white ${compact ? "p-3.5" : "p-[18px]"}`}>
      <div className="flex items-center gap-2">
        <Mascot size={36} onDark className="shrink-0" />
        <span className="flex-1 text-[13px] font-extrabold text-sun">Mầm dẫn bài{current && ` · ${step + 1}/${steps.length}`}</span>
        <button type="button" onClick={onClose} aria-label="Đóng tour" className="inline-flex size-8 items-center justify-center rounded-full bg-forest-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      {state.status === "loading" && <p className="text-sm text-mist">Mầm đang nghe bài và soạn tour…</p>}
      {state.status === "error" && (
        <p className="text-sm text-mist">
          {state.message}{" "}
          <button type="button" onClick={onRetry} className="font-extrabold text-sun underline">
            Thử lại
          </button>
        </p>
      )}
      {current && (
        <>
          {!compact && (
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <span key={i} className={`h-1 flex-1 rounded-sm ${i <= step ? "bg-sun" : "bg-[#3b6b55]"}`} />
              ))}
            </div>
          )}
          <p className={`font-serif font-bold leading-snug ${compact ? "text-base" : "text-xl"}`}>{current.title}</p>
          <p className="text-sm leading-relaxed text-[#dcebdf]">{current.body}</p>
          {current.chords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {current.chords.map((c) => (
                <button key={c} type="button" onClick={() => onPick(display(c))} className="h-[30px] rounded-full bg-sun px-3 text-[13px] font-extrabold text-sun-ink">
                  {display(c)}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" disabled={step === 0} onClick={() => onStep(step - 1)} className="h-[42px] rounded-full border border-[#3b6b55] px-4 text-sm font-bold disabled:opacity-40">
              Trước
            </button>
            <button
              type="button"
              onClick={() => (step === steps.length - 1 ? onClose() : onStep(step + 1))}
              className="h-[42px] flex-1 rounded-full bg-white px-4 text-sm font-extrabold text-ink"
            >
              {step === steps.length - 1 ? "Xong" : "Tiếp"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
