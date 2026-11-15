"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Mascot } from "@/components/Mascot";
import { playPattern, type Playback } from "@/lib/audio";
import { countLabels, RhythmPatternSchema, type SongRhythm, type Stroke } from "@/lib/rhythm";

const RhythmsResponse = z.union([
  z.object({ rhythms: z.array(z.intersection(RhythmPatternSchema, z.object({ slug: z.string(), reason: z.string() }))) }),
  z.object({ error: z.string() }),
]);

const STROKE_VIEW: Record<Stroke, { glyph: string; title: string; tone: string }> = {
  D: { glyph: "↓", title: "Quạt xuống", tone: "bg-link text-surface" },
  U: { glyph: "↑", title: "Quạt lên", tone: "bg-hover text-link ring-1 ring-link ring-inset" },
  B: { glyph: "B", title: "Ngón cái gảy bass", tone: "bg-bar text-bar-ink" },
  X: { glyph: "✕", title: "Chặn tiếng", tone: "bg-warn text-surface" },
  "1": { glyph: "1", title: "Móc dây 1", tone: "bg-accent text-on-accent" },
  "2": { glyph: "2", title: "Móc dây 2", tone: "bg-accent text-on-accent" },
  "3": { glyph: "3", title: "Móc dây 3", tone: "bg-accent text-on-accent" },
  "-": { glyph: "·", title: "Nghỉ", tone: "bg-bg text-soft" },
};

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; rhythms: SongRhythm[] };

export function RhythmPanel({ slug, initial, chordName, midi }: { slug: string; initial: SongRhythm[]; chordName: string; midi: number[] | null }) {
  const [load, setLoad] = useState<Load>(initial.length ? { status: "ready", rhythms: initial } : { status: "loading" });
  const [open, setOpen] = useState<string | null>(null);

  const fetchRhythms = async () => {
    setLoad({ status: "loading" });
    try {
      const res = RhythmsResponse.parse(await fetch(`/api/songs/${encodeURIComponent(slug)}/rhythms`, { method: "POST" }).then((r) => r.json()));
      setLoad("error" in res ? { status: "error", message: res.error } : { status: "ready", rhythms: res.rhythms });
    } catch {
      setLoad({ status: "error", message: "Mầm chưa chọn được điệu, thử lại sau nhé" });
    }
  };
  const asked = useRef(false);
  useEffect(() => {
    if (initial.length || asked.current) return;
    asked.current = true;
    void fetchRhythms();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ask once per page view
  }, []);

  const rhythms = load.status === "ready" ? load.rhythms : [];
  const current = rhythms.find((r) => r.slug === open) ?? null;

  return (
    <div className="border-b border-line px-5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-extrabold text-link">Điệu gợi ý</span>
        {load.status === "loading" && <span className="text-sm text-soft">Mầm đang chọn điệu hợp với bài…</span>}
        {load.status === "error" && (
          <span className="text-sm text-warn">
            {load.message}{" "}
            <button type="button" onClick={() => void fetchRhythms()} className="font-extrabold underline">
              Thử lại
            </button>
          </span>
        )}
        {rhythms.map((r) => (
          <button
            key={r.slug}
            type="button"
            aria-expanded={open === r.slug}
            onClick={() => setOpen((o) => (o === r.slug ? null : r.slug))}
            className={`h-9 rounded-full border px-3.5 text-sm font-extrabold ${open === r.slug ? "border-link bg-hover text-link" : "border-line-strong bg-surface text-ink"}`}
          >
            {r.name} <span className="font-semibold text-soft">{r.timeSignature}</span>
          </button>
        ))}
      </div>
      {current && <RhythmCard key={current.slug} rhythm={current} chordName={chordName} midi={midi} />}
    </div>
  );
}

function RhythmCard({ rhythm, chordName, midi }: { rhythm: SongRhythm; chordName: string; midi: number[] | null }) {
  const [step, setStep] = useState<number | null>(null);
  const playback = useRef<Playback | null>(null);
  const labels = countLabels(rhythm);

  const stop = () => {
    playback.current?.stop();
    playback.current = null;
    setStep(null);
  };
  useEffect(() => stop, []);

  const play = () => {
    if (!midi) return;
    stop();
    const p = playPattern({ pattern: rhythm, midi });
    playback.current = p;
    const tick = () => {
      if (playback.current !== p) return;
      const s = p.stepAt();
      setStep(s);
      if (s === null) playback.current = null;
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  return (
    <section aria-label={`Cách đánh điệu ${rhythm.name}`} className="mt-3 flex flex-col gap-3 rounded-lg bg-hover p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-serif text-xl font-normal">{rhythm.name}</h3>
        <span className="text-sm font-semibold text-soft">
          Nhịp {rhythm.timeSignature} · khoảng {rhythm.bpm} BPM
        </span>
      </div>
      <p className="flex items-start gap-2 text-sm leading-relaxed text-soft">
        <Mascot size={28} className="shrink-0" />
        <span>
          <strong className="text-link">Hợp bài vì:</strong> {rhythm.reason} {rhythm.feel}
        </span>
      </p>
      <div className="-m-1 overflow-x-auto p-1.5">
        <ol className="flex gap-2" aria-label="Một ô nhịp">
          {rhythm.steps.map((s, i) => {
            const view = STROKE_VIEW[s];
            return (
              <li key={i} className="flex w-9 shrink-0 flex-col items-center gap-1">
                <span
                  title={view.title}
                  aria-label={`${labels[i]}: ${view.title}`}
                  className={`flex size-9 items-center justify-center rounded-xl text-lg font-extrabold ${view.tone} ${step === i ? "ring-4 ring-accent" : ""}`}
                >
                  {view.glyph}
                </span>
                <span className={`text-xs font-bold ${/^\d+$/.test(labels[i]) ? "text-ink" : "text-soft"}`}>{labels[i]}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-sm leading-relaxed">{rhythm.howTo}</p>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-soft">
        {Object.entries(STROKE_VIEW)
          .filter(([k]) => rhythm.steps.some((s) => s === k))
          .map(([k, v]) => (
            <span key={k}>
              <strong className="text-ink">{v.glyph}</strong> {v.title}
            </span>
          ))}
      </p>
      <button
        type="button"
        disabled={!midi}
        onClick={step === null ? play : stop}
        className="fx h-11 self-start rounded-full bg-bar px-4 text-sm font-extrabold text-bar-ink disabled:opacity-40"
      >
        {step === null ? `Nghe thử với ${chordName}` : "Dừng"}
      </button>
    </section>
  );
}
