"use client";

import { memo, useEffect, useRef } from "react";
import type { CapoChange, TabSection, TabStep, TabSystem } from "@/lib/tab/parse";
import { TECHNIQUE } from "@/lib/tab/describe";

const COL = 10;
const ROW = 15;
const TOP = 20;
const NAMES = ["e", "B", "G", "D", "A", "E"];

export type SystemView = { system: TabSystem; steps: TabStep[]; capos: CapoChange[]; section: TabSection | null; opensSection: boolean };

/** The tab as printed, one block per row; the step being played is lit, and a click picks the note under it. */
export const TabSystemRow = memo(function TabSystemRow({
  view,
  active,
  follow,
  onSeek,
  onPractice,
}: {
  view: SystemView;
  /** Column of the step being played, when it is in this block. */
  active: number | null;
  follow: boolean;
  onSeek: (column: number) => void;
  onPractice: (section: TabSection) => void;
}) {
  const { system, steps, capos, section, opensSection } = view;
  const box = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const height = TOP + 5 * ROW + 10;

  useEffect(() => {
    if (active === null || !follow) return;
    const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    box.current?.scrollIntoView({ block: "nearest", behavior });
    const s = scroller.current;
    if (s) s.scrollTo({ left: (active - system.start) * COL - s.clientWidth / 2, behavior });
  }, [active, follow, system.start]);

  return (
    // shortcut: the scroll margin assumes the sticky player's height; measure it if the player grows.
    <div ref={box} className="scroll-mt-[340px] scroll-mb-6 lg:scroll-mt-[250px]">
      {opensSection && section && (
        <div className="flex items-center gap-3 pt-6 pb-1">
          <h2 className="font-serif text-xl font-normal text-link">{section.name}</h2>
          <button type="button" onClick={() => onPractice(section)} className="h-9 rounded-full border border-line-strong px-3.5 text-[13px] font-bold text-ink">
            Tập đoạn này
          </button>
        </div>
      )}
      <div className="flex items-stretch">
        <svg width={18} height={height} aria-hidden className="shrink-0">
          {NAMES.map((n, r) => (
            <text key={n + r} x={9} y={TOP + r * ROW + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--soft)">
              {n}
            </text>
          ))}
        </svg>
        <div ref={scroller} className="min-w-0 overflow-x-auto">
          <svg
            width={system.width * COL}
            height={height}
            role="img"
            aria-label={`Tab ${section?.name ?? ""}, ${steps.length} nhịp gảy. Bấm vào một nốt để nghe và bắt đầu từ đó.`}
            className="block cursor-pointer font-mono"
            onClick={(e) => onSeek(system.start + Math.floor((e.clientX - e.currentTarget.getBoundingClientRect().left) / COL))}
          >
            {active !== null && <rect x={(active - system.start) * COL - 3} y={TOP - 10} width={COL + 8} height={5 * ROW + 20} rx={5} fill="var(--accent)" opacity={0.35} />}
            {NAMES.map((n, r) => (
              <line key={n + r} x1={0} x2={system.width * COL} y1={TOP + r * ROW} y2={TOP + r * ROW} stroke="var(--line-strong)" />
            ))}
            {system.bars.map((b) => (
              <line key={b} x1={(b - system.start) * COL + COL / 2} x2={(b - system.start) * COL + COL / 2} y1={TOP} y2={TOP + 5 * ROW} stroke="var(--soft)" />
            ))}
            {capos.map((c) => (
              <text key={c.at} x={(c.at - system.start) * COL} y={10} fontSize={10} fontWeight={800} fill="var(--warn)">
                Capo {c.fret}
              </text>
            ))}
            {steps.map((step) => {
              const x = (step.at - system.start) * COL;
              const lit = step.at === active;
              return (
                <g key={step.at} fill="var(--ink)" fontWeight={lit ? 800 : 600}>
                  {step.thump && (
                    <text x={x + 1} y={10} fontSize={11} fill="var(--link)" fontWeight={800}>
                      o
                    </text>
                  )}
                  {step.notes.map((n) => {
                    const y = TOP + (5 - n.string) * ROW;
                    const label = n.kind === "dead" ? "x" : String(n.fret);
                    return (
                      <g key={n.string}>
                        {n.kind === "fret" && n.via && (
                          <text x={x - COL + 2} y={y + 4} fontSize={10} fill="var(--soft)">
                            {TECHNIQUE[n.via].mark}
                          </text>
                        )}
                        <rect x={x} y={y - 6} width={label.length * 7.5 + 2} height={12} fill={lit ? "transparent" : "var(--surface)"} />
                        <text x={x + 1} y={y + 4} fontSize={12} fill={n.kind === "dead" ? "var(--soft)" : undefined}>
                          {label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
});
