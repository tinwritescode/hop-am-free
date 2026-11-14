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
  D: { glyph: "↓", title: "Quạt xuống", tone: "bg-leaf text-white" },
  U: { glyph: "↑", title: "Quạt lên", tone: "bg-sprout text-sprout-ink" },
  B: { glyph: "B", title: "Ngón cái gảy bass", tone: "bg-forest text-white" },
  X: { glyph: "✕", title: "Chặn tiếng", tone: "bg-clay text-white" },
  "1": { glyph: "1", title: "Móc dây 1", tone: "bg-sun text-sun-ink" },
  "2": { glyph: "2", title: "Móc dây 2", tone: "bg-sun text-sun-ink" },
  "3": { glyph: "3", title: "Móc dây 3", tone: "bg-sun text-sun-ink" },
  "-": { glyph: "·", title: "Nghỉ", tone: "bg-[#f1f5ef] text-muted" },
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
    <div className="border-b border-[#e3ede0] px-5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-extrabold text-leaf">Điệu gợi ý</span>
        {load.status === "loading" && <span className="text-sm text-muted">Mầm đang chọn điệu hợp với bài…</span>}
        {load.status === "error" && (
          <span className="text-sm text-clay-ink">
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
            className={`h-9 rounded-full border px-3.5 text-sm font-extrabold ${open === r.slug ? "border-leaf bg-moss text-sprout-ink" : "border-line bg-white text-ink"}`}
          >
            {r.name} <span className="font-semibold text-muted">{r.timeSignature}</span>
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
    <section aria-label={`Cách đánh điệu ${rhythm.name}`} className="mt-3 flex flex-col gap-3 rounded-[20px] bg-[#f7faf5] p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-serif text-xl font-bold">{rhythm.name}</h3>
        <span className="text-sm font-semibold text-muted">
          Nhịp {rhythm.timeSignature} · khoảng {rhythm.bpm} BPM
        </span>
      </div>
      <p className="flex items-start gap-2 text-sm leading-relaxed text-ink-soft">
        <Mascot size={28} className="shrink-0" />
        <span>
          <strong className="text-sprout-ink">Hợp bài vì:</strong> {rhythm.reason} {rhythm.feel}
        </span>
      </p>
      <div className="overflow-x-auto pb-1">
        <ol className="flex gap-1" aria-label="Một ô nhịp">
          {rhythm.steps.map((s, i) => {
            const view = STROKE_VIEW[s];
            return (
              <li key={i} className="flex w-9 shrink-0 flex-col items-center gap-1">
                <span
                  title={view.title}
                  aria-label={`${labels[i]}: ${view.title}`}
                  className={`flex size-9 items-center justify-center rounded-xl text-lg font-extrabold ${view.tone} ${step === i ? "ring-4 ring-sun" : ""}`}
                >
                  {view.glyph}
                </span>
                <span className={`text-xs font-bold ${/^\d+$/.test(labels[i]) ? "text-ink" : "text-muted"}`}>{labels[i]}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-sm leading-relaxed">{rhythm.howTo}</p>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
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
        className="h-10 self-start rounded-full bg-forest px-4 text-sm font-extrabold text-white disabled:opacity-40"
      >
        {step === null ? `Nghe thử với ${chordName}` : "Dừng"}
      </button>
    </section>
  );
}
