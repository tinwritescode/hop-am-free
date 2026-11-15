"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { SongDraftSchema, unknownChords, type SongDraft } from "@/lib/song";
import { Mascot } from "@/components/Mascot";
import { CapoSelect } from "@/components/song/CapoSelect";
import { createSongAction } from "./actions";

const ImportResponse = z.union([z.object({ draft: SongDraftSchema, unknownChords: z.array(z.string()) }), z.object({ error: z.string() })]);

const EMPTY: SongDraft = { title: "", artist: "", composer: "", key: "", genre: "", rhythm: "", sheet: "", sourceUrl: null, capo: null };
const FIELDS: { name: "title" | "artist" | "composer" | "key" | "genre" | "rhythm"; label: string; placeholder: string }[] = [
  { name: "title", label: "Tên bài", placeholder: "Để Nó Đến" },
  { name: "artist", label: "Ca sĩ", placeholder: "G Thắng" },
  { name: "composer", label: "Sáng tác", placeholder: "Vũ Đinh Trọng Thắng" },
  { name: "key", label: "Tone", placeholder: "G, Am, Bb…" },
  { name: "genre", label: "Thể loại", placeholder: "Pop" },
  { name: "rhythm", label: "Điệu (nếu biết)", placeholder: "Ballad" },
];
const input = "h-11 w-full rounded-md border border-line-strong bg-surface px-4 text-[15px] text-ink focus:border-link";

export function SongForm() {
  const [draft, setDraft] = useState<SongDraft>(EMPTY);
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [note, setNote] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const missing = draft.sheet ? unknownChords(draft.sheet) : [];

  const runImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    setNote({ tone: "info", text: "Mầm đang đọc trang và làm sạch bản nhạc… (có thể mất nửa phút)" });
    try {
      const res = ImportResponse.parse(
        await fetch("/api/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) }).then((r) => r.json()),
      );
      if ("error" in res) return setNote({ tone: "error", text: res.error });
      setDraft(res.draft);
      setNote({ tone: "info", text: "Đã điền sẵn từ link. Xem lại rồi bấm Lưu bài." });
    } catch {
      setNote({ tone: "error", text: "Import không thành công, thử lại nhé." });
    } finally {
      setImporting(false);
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startSaving(async () => {
      const res = await createSongAction(draft);
      if (res?.error) setNote({ tone: "error", text: res.error });
    });
  };

  return (
    <div className="flex flex-col gap-7">
      <form onSubmit={runImport} className="flex flex-col gap-2">
        <label htmlFor="import-url" className="text-sm font-extrabold text-link">
          Import từ link
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="import-url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://hopamchuan.com/song/…"
            className={`${input} min-w-0 flex-[1_1_320px]`}
          />
          <button type="submit" disabled={importing} className="fx h-11 rounded-md bg-accent px-5 text-sm font-extrabold text-on-accent disabled:opacity-50">
            {importing ? "Đang đọc…" : "Đọc link"}
          </button>
        </div>
      </form>

      {note && (
        <div role="status" className={`flex items-center gap-2.5 rounded-lg py-3 pr-4 pl-2.5 text-sm ${note.tone === "error" ? "bg-warn-bg text-warn" : "bg-hover text-ink"}`}>
          <Mascot size={36} className="shrink-0" />
          {note.text}
        </div>
      )}

      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.name} className="flex flex-col gap-1.5 text-sm font-bold">
              {f.label}
              <input
                value={draft[f.name]}
                required={f.name === "title" || f.name === "artist" || f.name === "key"}
                onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))}
                placeholder={f.placeholder}
                className={input}
              />
            </label>
          ))}
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Capo
            <CapoSelect
              fret={draft.capo?.fret ?? null}
              onChange={(fret) => setDraft((d) => ({ ...d, capo: fret === null ? null : { fret, source: "editor" } }))}
              className={input}
            />
            {draft.capo?.source === "sheet" && <span className="text-[13px] font-normal text-soft">Trang nguồn ghi capo này.</span>}
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Bản hợp âm
          <span className="text-[13px] font-normal text-soft">
            Hợp âm trong ngoặc vuông ngay trước chữ: <code>Để nó [C]đến như lẽ đương [G]nhiên</code>. Dòng <code>## Điệp khúc</code> để chia đoạn.
          </span>
          <textarea
            value={draft.sheet}
            required
            rows={18}
            onChange={(e) => setDraft((d) => ({ ...d, sheet: e.target.value }))}
            className="w-full rounded-md border border-line-strong bg-surface p-4 font-mono text-[14px] leading-relaxed text-ink focus:border-link"
          />
        </label>
        {missing.length > 0 && (
          <p className="rounded-lg border border-accent bg-hover px-4 py-2.5 text-sm text-ink">
            Chưa có thế bấm cho: <strong>{missing.join(", ")}</strong>. Vẫn lưu được, nhưng nên sửa tên hợp âm nếu gõ nhầm.
          </p>
        )}
        {draft.sourceUrl && <p className="text-[13px] text-soft">Nguồn: {draft.sourceUrl}</p>}
        <button type="submit" disabled={saving} className="fx h-12 self-start rounded-md bg-accent px-7 text-[15px] font-extrabold text-on-accent disabled:opacity-50">
          {saving ? "Đang lưu…" : "Lưu bài"}
        </button>
      </form>
    </div>
  );
}
