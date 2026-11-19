"use client";

import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { transposeKey } from "@hopamfree/core/chords";
import { listenPitch } from "@/lib/mic";
import { sfx } from "@/lib/sfx";
import { hzToMidi, midiName, suggestShift, voiceRange, type VoiceRange } from "@/lib/voice";

const LISTEN_MS = 12_000;
const READ_EVERY_MS = 60;

type Check = { kind: "idle" } | { kind: "asking" } | { kind: "listening"; note: string | null; left: number } | { kind: "denied" } | { kind: "too-little" };

/**
 * "Tone hợp giọng": the visitor sings low to high into the microphone, the page keeps their range, and every song then
 * suggests the key that suits it. Sound never leaves the browser.
 */
export function VoiceTone({
  range,
  songKey,
  tonic,
  semitones,
  onRange,
  onApply,
}: {
  range: VoiceRange | null;
  songKey: string;
  /** Pitch class the song sounds in now that the capo is counted, before any transpose. */
  tonic: number | null;
  semitones: number;
  onRange: (r: VoiceRange) => void;
  onApply: (semitones: number) => void;
}) {
  const [check, setCheck] = useState<Check>({ kind: "idle" });
  const finish = useRef<((keep: boolean) => void) | null>(null);
  useEffect(() => () => finish.current?.(false), []);

  const listen = async () => {
    sfx("pop"); // inside the tap: also wakes the audio for the sound at the end
    setCheck({ kind: "asking" });
    const readings: number[] = [];
    const started = performance.now();
    let stop: () => void;
    try {
      stop = await listenPitch({
        everyMs: READ_EVERY_MS,
        onPitch: (hz) => {
          if (hz) readings.push(hzToMidi(hz));
          const left = LISTEN_MS - (performance.now() - started);
          if (left <= 0) finish.current?.(true);
          else setCheck({ kind: "listening", note: hz ? midiName(Math.round(hzToMidi(hz))) : null, left });
        },
      });
    } catch {
      setCheck({ kind: "denied" });
      return;
    }
    finish.current = (keep) => {
      finish.current = null;
      stop();
      if (!keep) return;
      const heard = voiceRange(readings);
      sfx(heard ? "success" : "unpop");
      if (heard) onRange(heard);
      setCheck(heard ? { kind: "idle" } : { kind: "too-little" });
    };
  };

  const suggestion = range && tonic !== null ? suggestShift({ tonic, range }) : null;
  const button = "inline-flex h-10 items-center rounded-full px-4 text-sm font-extrabold";
  return (
    <section aria-label="Tone hợp giọng" aria-live="polite" className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-5 py-3.5">
      <Mascot size={36} motion={check.kind === "listening" ? "busy" : "idle"} className="shrink-0" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-extrabold text-link">Tone hợp giọng</p>
        {check.kind === "listening" ? (
          <p className="text-soft">
            Hát “a” từ nốt thấp nhất lên cao nhất mà vẫn thoải mái, mỗi nốt giữ một chút ·{" "}
            <strong className="font-mono text-ink">{check.note ?? "…"}</strong> · còn {Math.ceil(check.left / 1000)} giây
          </p>
        ) : check.kind === "asking" ? (
          <p className="text-soft">Cho phép trang dùng micro để Mầm nghe giọng bạn…</p>
        ) : check.kind === "denied" ? (
          <p className="text-warn">Trình duyệt chưa cho dùng micro. Bật quyền micro cho trang này rồi thử lại.</p>
        ) : check.kind === "too-little" ? (
          <p className="text-warn">Mầm chưa nghe rõ. Hát to hơn một chút, giữ mỗi nốt lâu hơn, rồi thử lại.</p>
        ) : range && suggestion ? (
          <p className="text-soft">
            Giọng bạn khoảng <strong className="font-mono text-ink">{midiName(range.low)}–{midiName(range.high)}</strong>.{" "}
            {suggestion.shift === semitones ? (
              <>Tone đang chọn đã hợp giọng bạn nhất.</>
            ) : (
              <>
                Bài này hợp với bạn nhất ở tone <strong className="text-ink">{transposeKey({ key: songKey, semitones: suggestion.shift })}</strong>.
              </>
            )}
            {suggestion.over > 0 && ` Bài rộng hơn giọng bạn khoảng ${suggestion.over} nửa cung, vài chỗ sẽ hơi với.`} Đây là ước lượng, nghe thử rồi chỉnh thêm.
          </p>
        ) : (
          <p className="text-soft">Hát thử 12 giây, Mầm đoán tone hợp giọng bạn cho mọi bài. Âm thanh không rời khỏi máy.</p>
        )}
      </div>
      {check.kind === "listening" ? (
        <button type="button" onClick={() => finish.current?.(true)} className={`${button} bg-bar text-bar-ink`}>
          ■ Xong
        </button>
      ) : (
        <>
          {suggestion && suggestion.shift !== semitones && (
            <button type="button" onClick={() => onApply(suggestion.shift)} className={`fx ${button} bg-accent text-on-accent`}>
              Đổi sang {transposeKey({ key: songKey, semitones: suggestion.shift })}
            </button>
          )}
          <button
            type="button"
            disabled={check.kind === "asking"}
            onClick={() => void listen()}
            className={`${button} ${range ? "border border-line-strong bg-surface text-ink" : "bg-accent text-on-accent"} disabled:opacity-40`}
          >
            🎤 {range ? "Đo lại" : "Đo giọng"}
          </button>
        </>
      )}
    </section>
  );
}
