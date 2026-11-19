"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Song } from "@/lib/song";
import type { SongRhythm } from "@/lib/rhythm";
import type { Settings } from "@/lib/settings";
import { applyFixes, chordsInOrder, type Line, type LineFix } from "@hopamfree/core/chordsheet";
import { midiOf, rootPitchClass, transposeChord, transposeKey, voicingsFor } from "@/lib/chords";
import { capoForTranspose, soundingKey, type Capo } from "@/lib/capo";
import { AI_CAPO_NOTE, CapoBadge } from "./CapoBadge";
import type { ReviewIssue, Substitution } from "@/lib/ai-schema";
import { Mascot } from "@/components/Mascot";
import { ActiveChordCard, ChordGrid, ChordTile, currentVoicing, ListenButton, TourCard, TourCta, VoicingStrip, type RailChord } from "./ChordPanels";
import { playEffect } from "@/components/fx/playEffect";
import { RhythmPanel } from "./RhythmPanel";
import { useRhythms } from "./useRhythms";
import { PRESENT_FONT, PRESENT_SELECTOR, Presenter } from "./Presenter";
import type { SetlistNav } from "@/lib/setlist";
import { VoiceTone } from "./VoiceTone";
import { strum } from "@/lib/audio";
import { sfx } from "@/lib/sfx";
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

/** Scrolls the page, or the projector view while it is open, slowly down to the end. */
function useAutoScroll(on: boolean, stop: () => void) {
  useEffect(() => {
    if (!on) return;
    let id = 0;
    let last = performance.now();
    let carry = 0;
    const tick = (now: number) => {
      const box = document.querySelector(PRESENT_SELECTOR) ?? document.documentElement;
      carry += (now - last) * 0.03; // ~30px per second
      last = now;
      if (carry >= 1) {
        box.scrollBy(0, Math.floor(carry));
        carry -= Math.floor(carry);
      }
      if (box.clientHeight + box.scrollTop >= box.scrollHeight - 2) return stop();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [on, stop]);
}

const DESKTOP = "(min-width: 1024px)"; // Tailwind lg: where the lyrics flow into columns

/** True when the whole of `ref` is on screen with the page scrolled to the top (desktop only; mobile has the dock over it). */
function useFitsScreen(ref: React.RefObject<HTMLElement | null>): boolean {
  const [fits, setFits] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const desktop = window.matchMedia(DESKTOP);
    const check = () => setFits(desktop.matches && el.getBoundingClientRect().bottom + window.scrollY <= window.innerHeight);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    window.addEventListener("resize", check);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [ref]);
  return fits;
}

export function SongView({
  song,
  rhythms,
  savedSettings,
  signedIn,
  setlist,
  present,
}: {
  song: Song;
  rhythms: SongRhythm[];
  savedSettings: Settings | null;
  signedIn: boolean;
  /** Set when the song was opened from a setlist; the projector steps to the songs either side. */
  setlist: SetlistNav | null;
  /** Open the projector at once (the previous song's projector moved on to this one). */
  present: boolean;
}) {
  const { states, request } = useAi(song.slug);
  const { settings, update } = useSettings({ saved: savedSettings, signedIn });
  const { fontSize, chordStyle: layout, chordSound } = settings;
  const [mode, setMode] = useState<Mode>("orig");
  const [semitones, setSemitones] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [voicingIndex, setVoicingIndex] = useState<Record<string, number>>({});
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [fixes, setFixes] = useState<Record<number, LineFix>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [autoScroll, setAutoScroll] = useState(false);
  const [presenting, setPresenting] = useState(present);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [presentSize, setPresentSize] = useState<number>(PRESENT_FONT.initial);
  const stopScroll = useMemo(() => () => setAutoScroll(false), []);
  useAutoScroll(autoScroll, stopScroll);
  const lyricsRef = useRef<HTMLDivElement>(null);
  // Columns put the whole song on one desktop screen; then there is nothing to scroll. Auto-scroll reads top to bottom,
  // so while it runs the lyrics go back to one column.
  const fits = useFitsScreen(lyricsRef);
  const rhythmsState = useRhythms({ slug: song.slug, initial: rhythms });

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
  const capo = song.capo?.fret ?? 0;
  const keyClass = rootPitchClass(song.key);
  /** Shows a chord's shape and, with the sound switch on, strums it. Called inside the tap, so phones allow the sound. */
  const pickChord = (name: string) => {
    setPicked(name);
    const chord = chordSound ? rail.find((c) => c.name === name) : undefined;
    const position = chord ? currentVoicing(chord) : null;
    if (position) strum(midiOf({ position, capo }));
  };

  const chordStyle = (orig: string, name: string) => {
    if (active?.name === name) return "bg-link text-surface";
    if (tourChords.has(orig)) return "bg-accent text-on-accent";
    if (subs.has(orig)) return "bg-hover text-link ring-1 ring-line-strong";
    return "text-link hover:bg-hover";
  };
  // The projector keeps chips plain: the picked chord and tour marks are for the reader at the screen.
  const plainChip = () => "text-link";
  const lyricLine = (line: Line, size: number, chipStyle: (orig: string, name: string) => string = chordStyle) => (
    <LyricLine
      line={line}
      layout={layout}
      fontSize={size}
      label={display}
      chipStyle={chipStyle}
      onPick={(orig) => pickChord(display(orig))}
    />
  );

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
    <div className="flex flex-wrap items-start gap-7 pb-[calc(11rem+var(--app-inset-bottom,0px))] lg:flex-nowrap lg:gap-5 lg:pb-0">
      <article className="min-w-0 flex-[999_1_560px] rounded-lg border border-line bg-surface">
        {/* Toolbar */}
        <div className="z-10 flex lg:sticky lg:top-[var(--app-inset-top,0px)] flex-wrap items-center gap-x-5 gap-y-2.5 rounded-t-lg border-b border-line bg-surface/95 px-5 py-3 backdrop-blur">
          <div role="group" aria-label="Chế độ hợp âm" className="inline-flex gap-0.5 rounded-full bg-hover p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mode === m.id}
                onClick={() => chooseMode(m.id)}
                className={`h-9 rounded-full px-4 text-sm font-extrabold ${mode === m.id ? "bg-surface text-ink shadow-sm" : "text-soft"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={showIssues}
            onClick={toggleIssues}
            className={`inline-flex h-11 items-center gap-2 rounded-full border pr-3.5 pl-1.5 text-sm font-extrabold text-warn ${showIssues ? "border-warn bg-warn-bg" : "border-line-strong bg-surface"}`}
          >
            <Mascot size={32} />
            Mầm soát lỗi
            {review.status === "ready" && (
              <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-warn px-1.5 text-xs text-surface">{review.data.issues.length}</span>
            )}
          </button>
          <button type="button" onClick={startTour} className="inline-flex h-11 items-center rounded-full bg-bar px-4 text-sm font-extrabold text-bar-ink lg:hidden">
            Mầm dẫn bài
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm font-semibold text-soft">
            <span>Tone</span>
            <span className="inline-flex items-center rounded-full border border-line">
              <button
                type="button"
                aria-label="Hạ nửa cung"
                onClick={() => {
                  sfx("tick");
                  setSemitones((s) => s - 1);
                }}
                className="size-9 text-lg text-ink"
              >
                −
              </button>
              <span className="min-w-8 text-center font-extrabold text-ink">{transposeKey({ key: song.key, semitones })}</span>
              <button
                type="button"
                aria-label="Nâng nửa cung"
                onClick={() => {
                  sfx("tick");
                  setSemitones((s) => s + 1);
                }}
                className="size-9 text-lg text-ink"
              >
                +
              </button>
            </span>
            <button
              type="button"
              aria-pressed={voiceOpen}
              onClick={() => setVoiceOpen((v) => !v)}
              title="Hát thử để Mầm gợi ý tone hợp giọng bạn"
              className={`h-9 rounded-full border px-3 text-[13px] font-bold ${voiceOpen ? "border-link bg-hover text-link" : "border-line text-ink"}`}
            >
              🎤 Hợp giọng
            </button>
            <span className="inline-flex items-center rounded-full border border-line">
              <button
                type="button"
                aria-label="Thu nhỏ chữ"
                onClick={() => {
                  sfx("tick");
                  update({ fontSize: Math.max(14, fontSize - 1) });
                }}
                className="size-9 text-sm font-extrabold text-ink">
                A−
              </button>
              <button
                type="button"
                aria-label="Phóng to chữ"
                onClick={() => {
                  sfx("tick");
                  update({ fontSize: Math.min(28, fontSize + 1) });
                }}
                className="size-9 text-base font-extrabold text-ink">
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
                  className={`h-8 rounded-full px-3 text-[13px] font-bold ${layout === l.id ? "bg-hover text-link" : "text-ink"}`}
                >
                  {l.label}
                </button>
              ))}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={chordSound}
              aria-label="Tiếng đàn khi bấm hợp âm"
              title="Bấm vào hợp âm để nghe tiếng đàn"
              onClick={() => update({ chordSound: !chordSound })}
              className={`inline-flex h-[38px] items-center gap-2 rounded-full border pr-1.5 pl-3 text-sm font-bold transition-colors ${chordSound ? "border-link bg-hover text-link" : "border-line-strong bg-surface text-ink"}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                {chordSound ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6m0-6-5 6" />}
              </svg>
              Tiếng đàn
              <span className={`relative h-6 w-10 rounded-full transition-colors ${chordSound ? "bg-link" : "bg-line-strong"}`}>
                <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform ${chordSound ? "translate-x-4" : ""}`} />
              </span>
            </button>
            <button
              type="button"
              aria-pressed={autoScroll}
              disabled={fits && !autoScroll}
              title={fits && !autoScroll ? "Cả bài đã nằm gọn trong màn hình" : undefined}
              onClick={() => setAutoScroll((v) => !v)}
              className={`h-[38px] rounded-full border px-3.5 text-sm font-bold disabled:opacity-40 ${autoScroll ? "border-link bg-hover text-link" : "border-line-strong bg-surface text-ink"}`}
            >
              {autoScroll ? "Dừng cuộn" : "Tự cuộn"}
            </button>
            <button
              type="button"
              onClick={() => setPresenting(true)}
              title="Toàn màn hình, chữ to, nền tối: cho máy chiếu hoặc TV"
              className="inline-flex h-[38px] items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-sm font-bold text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="12" rx="1.5" />
                <path d="M12 16v4M8 20h8" />
              </svg>
              Trình chiếu
            </button>
          </div>
        </div>

        {voiceOpen && (
          <VoiceTone
            range={settings.voiceRange}
            songKey={song.key}
            tonic={keyClass === null ? null : (keyClass + capo) % 12}
            semitones={semitones}
            onRange={(voiceRange) => update({ voiceRange })}
            onApply={setSemitones}
          />
        )}
        <RhythmPanel load={rhythmsState.load} onRetry={rhythmsState.retry} chordName={active?.name ?? ""} midi={activeVoicing ? midiOf({ position: activeVoicing, capo }) : null} />

        {/* Mầm status banners */}
        {modeState && (
          <MamBanner busy={modeState.status === "loading"}>
            {modeState.status === "loading" && "Mầm đang tìm hợp âm phù hợp"}
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
                <strong className="text-link">{mode === "easy" ? "Dễ đánh:" : "Nâng cấp:"}</strong> {modeState.data.summary}
                {mode === "easy" && " Mỗi hợp âm cũng đã được chọn sẵn thế bấm dễ nhất."} Hợp âm Mầm đổi được tô nền.
              </>
            )}
          </MamBanner>
        )}
        {showIssues && review.status !== "ready" && (
          <MamBanner busy={review.status === "loading"}>
            {review.status === "loading" && "Mầm đang soát từng dòng"}
            {review.status === "error" && review.message}
          </MamBanner>
        )}
        {showIssues && review.status === "ready" && review.data.issues.length === 0 && <MamBanner>Mầm không thấy lỗi nào trong bản này.</MamBanner>}

        {/* What a player sets up before the first chord, right where they start reading. Follows the transpose. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 pt-5 text-[15px] text-soft sm:px-8 lg:px-6">
          <span className="rounded-md border border-line-strong bg-surface px-3 py-1 font-mono font-bold text-ink">Tone {transposeKey({ key: song.key, semitones })}</span>
          {semitones === 0 ? <CapoBadge songKey={song.key} capo={song.capo} /> : song.capo && <TransposedCapo songKey={song.key} capo={song.capo} semitones={semitones} />}
          {song.rhythm && <span className="rounded-md bg-hover px-3 py-1 font-semibold text-ink">Điệu {song.rhythm}</span>}
        </div>

        {/* Lyrics: one column on mobile; on desktop as many ~18em columns as fit (font size included), sections kept whole. */}
        <div
          ref={lyricsRef}
          style={{ fontSize }}
          className={`px-5 pt-2 pb-10 sm:px-8 lg:px-6 lg:pb-6 ${autoScroll ? "" : "lg:[column-gap:2.25em] lg:[column-rule:1px_solid_var(--line)] lg:[column-width:18em]"}`}
        >
          {sheet.map((section, si) => (
            <section key={si} className="break-inside-avoid pt-7 lg:pt-4">
              {section.title && (
                <h2 className="mb-2.5 flex items-center gap-1.5 font-serif text-[17px] font-normal text-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 19C5 10 11 4 20 4C20 13 14 19 5 19Z" style={{ fill: "var(--accent)" }} />
                    <path d="M5 19 14 10" style={{ stroke: "var(--link)" }} strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  {section.title}
                </h2>
              )}
              {section.lines.map((line) => {
                const issues = issuesByLine.get(line.index) ?? [];
                return (
                  <div
                    key={line.index}
                    data-line={line.index}
                    className={`-mx-3 break-inside-avoid rounded-2xl px-3 py-0.5 transition-colors ${issues.length ? "bg-warn-bg/50" : ""}`}
                  >
                    {lyricLine(line, fontSize)}
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
        <footer className="border-t border-line px-5 py-5 text-sm leading-relaxed text-soft sm:px-8">
          Đóng góp bởi <strong className="text-ink">{song.contributor}</strong>. Thấy sai? Nhờ <strong className="text-ink">Mầm soát lỗi</strong> ở thanh công cụ.
        </footer>
      </article>

      {/* Desktop rail */}
      {/* Narrow and sticky, scrolling on its own, so the chord diagram and "Nghe" stay next to the lyrics. */}
      <aside
        aria-label="Hợp âm"
        className="sticky top-[calc(1rem+var(--app-inset-top,0px))] hidden max-h-[calc(100dvh-2rem)] w-[280px] shrink-0 flex-col gap-4 overflow-y-auto overscroll-contain lg:flex 2xl:w-[320px]"
      >
        {tourOn ? tourCard(false) : <TourCta onStart={startTour} />}
        {active && <ActiveChordCard chord={active} count={counts.get(active.name) ?? 0} capo={capo} onPickVoicing={pickVoicing} />}
        <ChordGrid chords={rail} active={active?.name ?? ""} onPick={pickChord} />
      </aside>

      {presenting && (
        <Presenter
          title={song.title}
          songKey={transposeKey({ key: song.key, semitones })}
          fontSize={presentSize}
          onFont={setPresentSize}
          onTone={(d) => setSemitones((s) => s + d)}
          onClose={() => setPresenting(false)}
          setlist={setlist}
        >
          {sheet.map((section, si) => (
            <section key={si} className="pt-8">
              {section.title && <h2 className="mb-3 font-serif text-link" style={{ fontSize: presentSize * 0.6 }}>{section.title}</h2>}
              {section.lines.map((line) => (
                <div key={line.index} data-line={line.index} className="-mx-4 px-4 py-1">
                  {lyricLine(line, presentSize, plainChip)}
                </div>
              ))}
            </section>
          ))}
        </Presenter>
      )}

      {/* Mobile dock. The --app-* offsets are zero in a browser; in the Telegram Mini App they keep it clear of the device's
          and Telegram's controls and inside the visible part of a half-open Mini App (see TelegramBridge). */}
      <div className="fixed right-[var(--app-inset-right,0px)] bottom-[var(--app-offscreen-bottom,0px)] left-[var(--app-inset-left,0px)] z-20 flex flex-col gap-2 rounded-t-3xl border-t border-line bg-surface px-3 pt-2.5 pb-[calc(1rem+var(--app-inset-bottom,0px))] shadow-[0_-8px_24px_rgba(0,0,0,0.12)] lg:hidden">
        {tourOn && tourCard(true)}
        {picked && active && (
          <section aria-label={`Thế bấm ${active.name}`} className="flex flex-col gap-1.5 rounded-2xl bg-hover p-2.5">
            <div className="flex items-center gap-2">
              <strong className="flex-1 font-serif text-xl font-normal text-link">{active.name}</strong>
              <ListenButton position={activeVoicing} capo={capo} />
              <button type="button" onClick={() => setPicked(null)} aria-label="Đóng thế bấm" className="size-11 rounded-full border border-line-strong bg-surface text-sm">
                ✕
              </button>
            </div>
            <VoicingStrip chord={active} onPick={pickVoicing} />
          </section>
        )}
        <p className="px-1 text-xs font-extrabold text-link">Hợp âm trong bài · chạm để xem thế bấm</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rail.map((c) => (
            <div key={c.name} className="w-[86px] shrink-0">
              <ChordTile chord={c} on={c.name === active?.name} onPick={pickChord} />
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
      onClick={(e) => {
        playEffect({ effect: "notes", from: e.currentTarget });
        onPick(orig);
      }}
      style={inline ? { fontSize: Math.round(fontSize * 0.88) } : { height: Math.round(fontSize * 1.4), fontSize: Math.round(fontSize * 0.88) }}
      className={`rounded-full px-[7px] leading-none font-extrabold whitespace-nowrap transition-transform active:scale-90 ${inline ? "mx-0.5 py-[3px] align-[0.1em]" : "-ml-[7px]"} ${chipStyle(orig, label(orig))}`}
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

/** After a transpose: the capo that keeps the song sounding where the sheet's capo put it, so a cover stays in the singer's key. */
function TransposedCapo({ songKey, capo, semitones }: { songKey: string; capo: Capo; semitones: number }) {
  const fret = capoForTranspose({ fret: capo.fret, semitones });
  const key = soundingKey({ key: songKey, fret: capo.fret });
  const ai = capo.source === "ai" ? ` (${AI_CAPO_NOTE})` : "";
  if (fret === null)
    return (
      <span role="status" title={`Không có capo 0–11 nào giữ được tone ${key}${ai}`} >
        Capo không giữ được tone {key}
      </span>
    );
  return (
    <span role="status" title={`Kẹp capo ${fret} để vẫn nghe như ${key}${ai}`} className="rounded-md bg-hover px-3 py-1 font-bold text-ink">
      {fret === 0 ? "Bỏ capo" : `Capo ${fret}`} · giữ tone {key}
      {capo.source === "ai" && <span className="font-semibold text-warn"> · AI đoán</span>}
    </span>
  );
}

/** Mầm's note above the lyrics. While `busy`, Mầm trots, a glow sweeps the banner and the dots bounce. */
function MamBanner({ children, busy = false }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <div role="status" className={`mx-5 mt-4 flex items-center gap-2.5 rounded-lg bg-hover py-3 pr-4 pl-2.5 text-sm leading-relaxed text-ink ${busy ? "sweep" : ""}`}>
      <Mascot size={40} motion={busy ? "busy" : "idle"} className="shrink-0" />
      <div>
        {children}
        {busy && (
          <span aria-hidden="true" className="loading-dots ml-0.5">
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
    </div>
  );
}

function IssueNote({ issue, onFix, onDismiss }: { issue: ReviewIssue; onFix: (() => void) | null; onDismiss: () => void }) {
  return (
    <div className="mt-1 mb-3 flex items-start gap-3 rounded-lg border border-warn bg-surface px-4 py-3.5">
      <span className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full bg-warn-bg text-warn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M12 3 2 20h20L12 3z" />
          <path d="M12 10v4M12 17.5v.01" />
        </svg>
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-[15px]">{issue.title}</strong>
          <span className="rounded-full bg-warn-bg px-2.5 py-0.5 text-xs font-extrabold text-warn">{ISSUE_KIND[issue.kind]}</span>
        </div>
        <p className="text-sm leading-relaxed text-soft">{issue.body}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {onFix && issue.fix !== null && (
            <button type="button" onClick={onFix} className="h-11 rounded-full bg-link px-3.5 text-[13px] font-extrabold text-surface">
              Đổi {issue.fix.from} → {issue.fix.to}
            </button>
          )}
          <button type="button" onClick={onDismiss} className="h-11 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-bold">
            Giữ nguyên
          </button>
        </div>
      </div>
    </div>
  );
}
