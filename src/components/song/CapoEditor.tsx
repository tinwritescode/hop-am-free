"use client";

import { useState, useTransition } from "react";
import type { Capo } from "@/lib/capo";
import { setCapoAction } from "@/app/bai-hat/[slug]/actions";
import { CapoSelect } from "./CapoSelect";

const SOURCE_LABEL: Record<Capo["source"], string> = { sheet: "bản nhạc ghi", ai: "AI đoán", editor: "admin đặt" };

/** Admin-only correction on the song page. The page renders it for admins; the action checks again. */
export function CapoEditor({ slug, capo }: { slug: string; capo: Capo | null }) {
  const [fret, setFret] = useState<number | null>(capo?.fret ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startSaving(async () => {
      const res = await setCapoAction({ slug, fret });
      if ("error" in res) setError(res.error);
    });
  };

  return (
    <details className="text-[13px]">
      <summary className="cursor-pointer font-bold text-link">Sửa capo</summary>
      <form onSubmit={save} className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor="capo-fix" className="text-soft">
          Hiện: {capo ? `${capo.fret} (${SOURCE_LABEL[capo.source]})` : "không rõ"}
        </label>
        <CapoSelect id="capo-fix" fret={fret} onChange={setFret} className="h-9 rounded-md border border-line-strong bg-surface px-2 text-ink" />
        <button type="submit" disabled={saving} className="fx h-9 rounded-md bg-accent px-3 font-extrabold text-on-accent disabled:opacity-50">
          {saving ? "Đang lưu…" : "Lưu"}
        </button>
        {error && <span className="text-warn">{error}</span>}
      </form>
    </details>
  );
}
