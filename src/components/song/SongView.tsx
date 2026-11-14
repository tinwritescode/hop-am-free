"use client";

import { useEffect, useMemo, useState } from "react";
import type { Song } from "@/lib/song";
import type { SongRhythm } from "@/lib/rhythm";
import type { Settings } from "@/lib/settings";
import { applyFixes, chordsInOrder, type Line, type LineFix } from "@/lib/chordsheet";
import { midiOf, transposeChord, transposeKey, voicingsFor } from "@/lib/chords";
import type { ReviewIssue, Substitution } from "@/lib/ai-schema";
import { Mascot } from "@/components/Mascot";
import { ActiveChordCard, ChordGrid, ChordTile, currentVoicing, ListenButton, TourCard, TourCta, VoicingStrip, type RailChord } from "./ChordPanels";
import { RhythmPanel } from "./RhythmPanel";
import { useAi } from "./useAi";
import { useSettings } from "./useSettings";

type Mode = "orig" | "easy" | "rich";
const MODES: { id: Mode; label: string }[] = [
  { id: "orig", label: "Gốc" },
  { id: "easy", label: "Dễ đánh" },
  { id: "rich", label: "Nâng cấp" },
];
const ISSUE_KIND: Record<ReviewIssue["kind"], string> = { chord: "Hợp âm", lyric: "Lời bài hát", consistency: "Không thống nhất" };
const issueKey = (i: ReviewIssue) => `${i.line}:${i.title}`;

function useAutoScroll(on: boolean, stop: () => void) {
  useEffect(() => {
    if (!on) return;
    let id = 0;
    let last = performance.now();
    let carry = 0;
    const tick = (now: number) => {
      carry += (now - last) * 0.03; // ~30px per second
      last = now;
      if (carry >= 1) {
        window.scrollBy(0, Math.floor(carry));
        carry -= Math.floor(carry);
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) return stop();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [on, stop]);
}

export function SongView({ song, rhythms, savedSettings, signedIn }: { song: Song; rhythms: SongRhythm[]; savedSettings: Settings | null; signedIn: boolean }) {
  const { states, request } = useAi(song.slug);
  const { settings, update } = useSettings({ saved: savedSettings, signedIn });
  const { fontSize, chordStyle: layout } = settings;
  const [mode, setMode] = useState<Mode>("orig");
  const [semitones, setSemitones] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [voicingIndex, setVoicingIndex] = useState<Record<string, number>>({});
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [fixes, setFixes] = useState<Record<number, LineFix>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [autoScroll, setAutoScroll] = useState(false);
  const stopScroll = useMemo(() => () => setAutoScroll(false), []);
  useAutoScroll(autoScroll, stopScroll);

  const sheet = useMemo(() => applyFixes(song.sheet, fixes), [song.sheet, fixes]);
  const modeState = mode === "orig" ? null : states[mode];
  const subs = useMemo(
    () => new Map<string, Substitution>(modeState?.status === "ready" ? modeState.data.subs.map((s) => [s.from, s]) : []),
    [modeState],
  );
  const display = (orig: string) => transposeChord({ name: subs.get(orig)?.to ?? orig, semitones });

  const tour = states.tour;
  const tourOn = tourStep !== null;
  const tourChords = new Set(tourOn && tour.status === "ready" ? (tour.data.steps[tourStep]?.chords ?? []) : []);

  const counts = new Map<string, number>();
  for (const s of sheet) for (const l of s.lines) for (const t of l.tokens) if (t.chord) counts.set(display(t.chord), (counts.get(display(t.chord)) ?? 0) + 1);

  const rail: RailChord[] = [];
  for (const orig of chordsInOrder(sheet)) {
    const name = display(orig);
    const existing = rail.find((c) => c.name === name);
    if (existing) {
      existing.inTour ||= tourChords.has(orig);
      continue;
    }
    rail.push({
      name,
      sub: subs.get(orig) ?? null,
      voicings: voicingsFor({ name, easiestFirst: mode === "easy" }),
      voicingIndex: voicingIndex[name] ?? 0,
      inTour: tourChords.has(orig),
    });
  }
  const active = rail.find((c) => c.name === picked) ?? rail[0];

  const review = states.review;
  const issuesByLine = new Map<number, ReviewIssue[]>();
  if (showIssues && review.status === "ready")
    for (const issue of review.data.issues)
      if (!dismissed.has(issueKey(issue))) issuesByLine.set(issue.line, [...(issuesByLine.get(issue.line) ?? []), issue]);

  const chooseMode = (m: Mode) => {
    setMode(m);
    setVoicingIndex({}); // each mode orders voicings differently; start from its first pick
    if (m !== "orig") void request(m);
  };
  const goStep = (i: number) => {
    setTourStep(i);
    const first = tour.status === "ready" ? tour.data.steps[i]?.chords[0] : undefined;
    if (first) setPicked(display(first));
  };
  const startTour = () => {
    void request("tour");
    goStep(0);
  };
  const toggleIssues = () => {
    setShowIssues((v) => !v);
    void request("review");
  };
  const pickVoicing = (i: number) => active && setVoicingIndex((v) => ({ ...v, [active.name]: i }));
  const activeVoicing = active ? currentVoicing(active) : null;

  const chordStyle = (orig: string, name: string) => {
    if (active?.name === name) return "bg-leaf text-white";
    if (tourChords.has(orig)) return "bg-sun text-sun-ink";
    if (subs.has(orig)) return "bg-sprout text-sprout-ink";
    return "text-leaf hover:bg-moss";
  };

  const tourCard = (compact: boolean) => (
    <TourCard
      state={tour}
      step={tourStep ?? 0}
      display={display}
      onStep={goStep}
      onClose={() => setTourStep(null)}
      onPick={setPicked}
      onRetry={() => void request("tour")}
      compact={compact}
    />
  );

  return (
    <div className="flex flex-wrap items-start gap-7 pb-44 lg:pb-0">
      <article className="min-w-0 flex-[999_1_560px] rounded-[26px] bg-white shadow-[0_1px_0_#dce8d8,0_12px_32px_rgba(47,107,71,0.10)]">
        {/* Toolbar */}
        <div className="z-10 flex lg:sticky lg:top-0 flex-wrap items-center gap-x-5 gap-y-2.5 rounded-t-[26px] border-b border-[#e3ede0] bg-white/95 px-5 py-3 backdrop-blur">
          <div role="group" aria-label="Chế độ hợp âm" className="inline-flex gap-0.5 rounded-full bg-[#eaf2e6] p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mode === m.id}
                onClick={() => chooseMode(m.id)}
                className={`h-9 rounded-full px-4 text-sm font-extrabold ${mode === m.id ? `bg-white shadow-[0_1px_3px_rgba(47,107,71,0.18)] ${m.id === "orig" ? "text-ink" : "text-sprout-ink"}` : "text-muted"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={showIssues}
            onClick={toggleIssues}
            className={`inline-flex h-11 items-center gap-2 rounded-full border pr-3.5 pl-1.5 text-sm font-extrabold text-clay-ink ${showIssues ? "border-clay-line bg-clay-bg" : "border-line bg-white"}`}
          >
            <Mascot size={32} />
            Mầm soát lỗi
            {review.status === "ready" && (
              <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-clay px-1.5 text-xs text-white">{review.data.issues.length}</span>
            )}
          </button>
          <button type="button" onClick={startTour} className="inline-flex h-11 items-center rounded-full bg-forest px-4 text-sm font-extrabold text-white lg:hidden">
            Mầm dẫn bài
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm font-semibold text-muted">
            <span>Tone</span>
            <span className="inline-flex items-center rounded-full border border-line">
              <button type="button" aria-label="Hạ nửa cung" onClick={() => setSemitones((s) => s - 1)} className="size-9 text-lg text-ink">
                −
              </button>
              <span className="min-w-8 text-center font-extrabold text-ink">{transposeKey({ key: song.key, semitones })}</span>
              <button type="button" aria-label="Nâng nửa cung" onClick={() => setSemitones((s) => s + 1)} className="size-9 text-lg text-ink">
                +
              </button>
            </span>
            <span className="inline-flex items-center rounded-full border border-line">
              <button type="button" aria-label="Thu nhỏ chữ" onClick={() => update({ fontSize: Math.max(14, fontSize - 1) })} className="size-9 text-sm font-extrabold text-ink">
                A−
              </button>
              <button type="button" aria-label="Phóng to chữ" onClick={() => update({ fontSize: Math.min(28, fontSize + 1) })} className="size-9 text-base font-extrabold text-ink">
                A+
              </button>
            </span>
            <span role="group" aria-label="Vị trí hợp âm" className="inline-flex rounded-full border border-line p-0.5">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={layout === l.id}
                  onClick={() => update({ chordStyle: l.id })}
                  className={`h-8 rounded-full px-3 text-[13px] font-bold ${layout === l.id ? "bg-moss text-sprout-ink" : "text-ink"}`}
                >
                  {l.label}
                </button>
              ))}
            </span>
            <button
              type="button"
              aria-pressed={autoScroll}
              onClick={() => setAutoScroll((v) => !v)}
              className={`h-[38px] rounded-full border px-3.5 text-sm font-bold ${autoScroll ? "border-leaf bg-moss text-sprout-ink" : "border-line bg-white text-ink"}`}
            >
              {autoScroll ? "Dừng cuộn" : "Tự cuộn"}
            </button>
          </div>
        </div>

        <RhythmPanel slug={song.slug} initial={rhythms} chordName={active?.name ?? ""} midi={activeVoicing ? midiOf(activeVoicing) : null} />

        {/* Mầm status banners */}
        {modeState && (
          <MamBanner>
            {modeState.status === "loading" && "Mầm đang tìm hợp âm phù hợp…"}
            {modeState.status === "error" && (
              <>
                {modeState.message}{" "}
                <button type="button" className="font-extrabold underline" onClick={() => mode !== "orig" && void request(mode)}>
                  Thử lại
                </button>
              </>
            )}
            {modeState.status === "ready" && (
              <>
                <strong className="text-sprout-ink">{mode === "easy" ? "Dễ đánh:" : "Nâng cấp:"}</strong> {modeState.data.summary}
                {mode === "easy" && " Mỗi hợp âm cũng đã được chọn sẵn thế bấm dễ nhất."} Hợp âm Mầm đổi có nền xanh nhạt.
              </>
            )}
          </MamBanner>
        )}
        {showIssues && review.status !== "ready" && (
          <MamBanner>
            {review.status === "loading" && "Mầm đang soát từng dòng…"}
            {review.status === "error" && review.message}
          </MamBanner>
        )}
        {showIssues && review.status === "ready" && review.data.issues.length === 0 && <MamBanner>Mầm không thấy lỗi nào trong bản này.</MamBanner>}

        {/* Lyrics */}
        <div className="px-5 pt-2 pb-10 sm:px-8">
          {sheet.map((section, si) => (
            <section key={si} className="mt-7">
              {section.title && (
                <h2 className="mb-2.5 flex items-center gap-1.5 font-serif text-[17px] font-semibold text-leaf italic">
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 19C5 10 11 4 20 4C20 13 14 19 5 19Z" fill="#8fcb8a" />
                    <path d="M5 19 14 10" stroke="#2f6b47" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  {section.title}
                </h2>
              )}
              {section.lines.map((line) => {
                const issues = issuesByLine.get(line.index) ?? [];
                return (
                  <div key={line.index} className={`-mx-3 rounded-2xl px-3 py-0.5 ${issues.length ? "bg-[#fff8f2]" : ""}`}>
                    <LyricLine
                      line={line}
                      layout={layout}
                      fontSize={fontSize}
                      label={display}
                      chipStyle={chordStyle}
                      onPick={(orig) => setPicked(display(orig))}
                    />
                    {issues.map((issue) => {
                      const dismiss = () => setDismissed((d) => new Set(d).add(issueKey(issue)));
                      const fix = issue.fix;
                      return (
                        <IssueNote
                          key={issueKey(issue)}
                          issue={issue}
                          onFix={
                            fix
                              ? () => {
                                  setFixes((f) => ({ ...f, [issue.line]: fix }));
                                  dismiss();
                                }
                              : null
                          }
                          onDismiss={dismiss}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
        <footer className="border-t border-[#e3ede0] px-5 py-5 text-sm leading-relaxed text-muted sm:px-8">
          Đóng góp bởi <strong className="text-ink">{song.contributor}</strong>. Thấy sai? Nhờ <strong className="text-ink">Mầm soát lỗi</strong> ở thanh công cụ.
        </footer>
      </article>

      {/* Desktop rail */}
      <aside aria-label="Hợp âm" className="sticky top-4 hidden max-w-[380px] flex-[1_1_340px] flex-col gap-4 lg:flex">
        {tourOn ? tourCard(false) : <TourCta onStart={startTour} />}
        {active && <ActiveChordCard chord={active} count={counts.get(active.name) ?? 0} onPickVoicing={pickVoicing} />}
        <ChordGrid chords={rail} active={active?.name ?? ""} onPick={setPicked} />
      </aside>

      {/* Mobile dock */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 rounded-t-3xl border-t border-line bg-white px-3 pt-2.5 pb-4 shadow-[0_-8px_24px_rgba(47,107,71,0.10)] lg:hidden">
        {tourOn && tourCard(true)}
        {picked && active && (
          <section aria-label={`Thế bấm ${active.name}`} className="flex flex-col gap-1.5 rounded-2xl bg-[#f7faf5] p-2.5">
            <div className="flex items-center gap-2">
              <strong className="flex-1 font-serif text-xl text-leaf">{active.name}</strong>
              <ListenButton position={activeVoicing} />
              <button type="button" onClick={() => setPicked(null)} aria-label="Đóng thế bấm" className="size-9 rounded-full border border-line bg-white text-sm">
                ✕
              </button>
            </div>
            <VoicingStrip chord={active} onPick={pickVoicing} />
          </section>
        )}
        <p className="px-1 text-xs font-extrabold text-leaf">Hợp âm trong bài · chạm để xem thế bấm</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rail.map((c) => (
            <div key={c.name} className="w-[86px] shrink-0">
              <ChordTile chord={c} on={c.name === active?.name} onPick={setPicked} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const LAYOUTS: { id: Settings["chordStyle"]; label: string }[] = [
  { id: "above", label: "Trên chữ" },
  { id: "inline", label: "[C] trong dòng" },
];

function LyricLine({
  line,
  layout,
  fontSize,
  label,
  chipStyle,
  onPick,
}: {
  line: Line;
  layout: Settings["chordStyle"];
  fontSize: number;
  label: (orig: string) => string;
  chipStyle: (orig: string, name: string) => string;
  onPick: (orig: string) => void;
}) {
  const chip = (orig: string, inline: boolean) => (
    <button
      type="button"
      onClick={() => onPick(orig)}
      style={inline ? { fontSize: Math.round(fontSize * 0.88) } : { height: Math.round(fontSize * 1.4), fontSize: Math.round(fontSize * 0.88) }}
      className={`rounded-full px-[7px] leading-none font-extrabold whitespace-nowrap ${inline ? "mx-0.5 py-[3px] align-[0.1em]" : "-ml-[7px]"} ${chipStyle(orig, label(orig))}`}
    >
      {inline ? (
        <>
          <span aria-hidden="true" className="opacity-45">
            [
          </span>
          {label(orig)}
          <span aria-hidden="true" className="opacity-45">
            ]
          </span>
        </>
      ) : (
        label(orig)
      )}
    </button>
  );

  if (layout === "inline")
    return (
      <p style={{ fontSize }} className="py-[3px] leading-[1.9]">
        {line.tokens.map((t, i) => (
          <span key={i}>
            {t.chord && chip(t.chord, true)}
            {t.text}{" "}
          </span>
        ))}
      </p>
    );

  return (
    <div className="flex flex-wrap items-end gap-x-[0.3em] gap-y-0.5 py-[3px]">
      {line.tokens.map((t, i) => (
        <span key={i} className="inline-flex flex-col items-start">
          {line.hasChords && (t.chord ? chip(t.chord, false) : <span style={{ height: Math.round(fontSize * 1.4) }} />)}
          {!line.chordOnly && (
            <span style={{ fontSize }} className="leading-normal whitespace-nowrap">
              {t.text}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function MamBanner({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="mx-5 mt-4 flex items-center gap-2.5 rounded-[18px] bg-[#eaf5e5] py-3 pr-4 pl-2.5 text-sm leading-relaxed text-[#24392c]">
      <Mascot size={40} className="shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function IssueNote({ issue, onFix, onDismiss }: { issue: ReviewIssue; onFix: (() => void) | null; onDismiss: () => void }) {
  return (
    <div className="mt-1 mb-3 flex items-start gap-3 rounded-[18px] border border-clay-line bg-white px-4 py-3.5">
      <span className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full bg-clay-bg">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a3f12" strokeWidth="2.2" aria-hidden="true">
          <path d="M12 3 2 20h20L12 3z" />
          <path d="M12 10v4M12 17.5v.01" />
        </svg>
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-[15px]">{issue.title}</strong>
          <span className="rounded-full bg-clay-bg px-2.5 py-0.5 text-xs font-extrabold text-clay-ink">{ISSUE_KIND[issue.kind]}</span>
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">{issue.body}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {onFix && issue.fix !== null && (
            <button type="button" onClick={onFix} className="h-9 rounded-full bg-leaf px-3.5 text-[13px] font-extrabold text-white">
              Đổi {issue.fix.from} → {issue.fix.to}
            </button>
          )}
          <button type="button" onClick={onDismiss} className="h-9 rounded-full border border-line bg-white px-3.5 text-[13px] font-bold">
            Giữ nguyên
          </button>
        </div>
      </div>
    </div>
  );
}
