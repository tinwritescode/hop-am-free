// Chord chip look, shared by the "known chords" toggles (client) and the key filter links (server).
// A plain module: a constant exported from a "use client" file reaches server components as a reference, not a string.
export const CHIP = "fx h-11 min-w-11 rounded-md border px-2 font-mono text-[13px] font-bold";
export const chipTone = (on: boolean) => (on ? "border-accent bg-accent text-on-accent" : "border-line-strong bg-surface text-ink");
