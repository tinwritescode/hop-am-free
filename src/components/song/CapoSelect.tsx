"use client";

import { MAX_CAPO } from "@/lib/capo";

const FRETS = Array.from({ length: MAX_CAPO + 1 }, (_, i) => i);

/** Capo 0–11 or unknown; the admin form and the song page's correction control share it. */
export function CapoSelect({ fret, onChange, className, id }: { fret: number | null; onChange: (fret: number | null) => void; className?: string; id?: string }) {
  return (
    <select id={id} value={fret ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} className={className}>
      <option value="">Không rõ</option>
      {FRETS.map((f) => (
        <option key={f} value={f}>
          {f === 0 ? "Không kẹp (0)" : `Capo ${f}`}
        </option>
      ))}
    </select>
  );
}
