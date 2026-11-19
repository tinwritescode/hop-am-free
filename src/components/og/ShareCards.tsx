// The 1200×630 share images, drawn by next/og (Satori): inline styles only, and every box with several children is a flex box.
// Satori renders <svg> without fonts, so all text sits in HTML around the drawings.
import { MascotArt } from "@/components/MascotArt";
import { barreRanges, type Position } from "@hopamfree/core/chords";
import { SITE_NAME, type SongCard } from "@/lib/seo";
import { hoian } from "@/themes/hoian";

const C = hoian.tokens.night.base;
const CREAM = C.ink;
const PLUM = C.surface;
const ORIGIN_LABEL = "hopam.tyvn.online";

const frame = {
  width: "100%",
  height: "100%",
  display: "flex",
  position: "relative",
  padding: "64px 72px 48px",
  color: CREAM,
  fontFamily: "Body",
  backgroundColor: C.bg,
  backgroundImage: `radial-gradient(circle at 88% 15%, rgba(247,181,56,0.30), rgba(42,18,46,0) 45%)`,
} as const;

function Footer({ withName }: { withName: boolean }) {
  return (
    <div style={{ position: "absolute", left: 72, right: 72, bottom: 44, display: "flex", alignItems: "center", fontSize: 30 }}>
      {withName && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: 700 }}>
          <MascotArt size={52} hat={hoian.Hat()} />
          {SITE_NAME}
        </div>
      )}
      <div style={{ marginLeft: withName ? "auto" : 0, color: C.soft }}>{ORIGIN_LABEL}</div>
    </div>
  );
}

const SX = 22;
const FY = 24;
const PAD = 14;
const ROWS = 4;

/** A chord box without labels: × and ○ are drawn, the starting fret is printed beside it in HTML. */
function Diagram({ position }: { position: Position }) {
  const w = PAD * 2 + 5 * SX;
  const top = 18;
  const h = top + ROWS * FY + 8;
  const spans = barreRanges(position);
  const covered = (i: number, f: number) => spans.some((s) => s.fret === f && i >= s.from && i <= s.to);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {Array.from({ length: ROWS + 1 }, (_, j) => (
        <rect key={`f${j}`} x={PAD} y={top + j * FY - (j === 0 && position.baseFret === 1 ? 3 : 1)} width={5 * SX} height={j === 0 && position.baseFret === 1 ? 6 : 2} fill={PLUM} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`s${i}`} x={PAD + i * SX - 1} y={top} width={2} height={ROWS * FY} fill={PLUM} />
      ))}
      {spans.map((s) => (
        <rect key={`b${s.fret}`} x={PAD + s.from * SX - 9} y={top + (s.fret - 0.5) * FY - 9} width={(s.to - s.from) * SX + 18} height={18} rx={9} fill={C.check} />
      ))}
      {position.frets.map((f, i) => {
        const x = PAD + i * SX;
        if (f < 0) return <path key={i} d={`M${x - 5} 3l10 10M${x + 5} 3l-10 10`} stroke={C.check} strokeWidth={2.5} strokeLinecap="round" />;
        if (f === 0) return <circle key={i} cx={x} cy={8} r={5} fill="none" stroke={PLUM} strokeWidth={2} />;
        if (f > ROWS || covered(i, f)) return null;
        return <circle key={i} cx={x} cy={top + (f - 0.5) * FY} r={9} fill={C.check} />;
      })}
    </svg>
  );
}

function Chip({ text, hot }: { text: string; hot?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 30,
        fontWeight: 700,
        padding: "12px 22px",
        borderRadius: 14,
        border: `2px solid ${hot ? C.accent : C["line-strong"]}`,
        backgroundColor: hot ? C.accent : "transparent",
        color: hot ? C["on-accent"] : CREAM,
      }}
    >
      {text}
    </div>
  );
}

// Satori has no line clamp, so a long title is cut at a word to stay within three lines at the smallest size.
const TITLE_MAX = 46;
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s(,–-]+$/, "")}…`;
}

export function SongShareCard({ card }: { card: SongCard }) {
  const capo = card.capo === null ? null : card.capo === 0 ? "Không capo" : `Capo ${card.capo}`;
  const titleSize = card.title.length > 28 ? 60 : card.title.length > 16 ? 72 : 84;
  return (
    <div style={frame}>
      <div style={{ display: "flex", flexDirection: "column", width: card.chords.length ? 600 : 1000 }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 4, color: C.accent }}>HỢP ÂM GUITAR</div>
        <div style={{ fontFamily: "Display", fontSize: titleSize, lineHeight: 1.08, marginTop: 18 }}>{clip(card.title, TITLE_MAX)}</div>
        <div style={{ fontSize: 38, fontWeight: 700, color: C.soft, marginTop: 22 }}>{card.artist}</div>
        <div style={{ display: "flex", gap: 14, marginTop: 28 }}>
          <Chip text={`Tone ${card.key}`} />
          {capo && <Chip text={capo} hot />}
          {card.rhythm && <Chip text={card.rhythm} />}
        </div>
      </div>
      {card.chords.length > 0 && (
        <div style={{ position: "absolute", right: 64, top: 70, width: 404, display: "flex", flexWrap: "wrap", gap: 20 }}>
          {card.chords.map((c) => (
            <div key={c.name} style={{ width: 192, display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: CREAM, borderRadius: 22, padding: "12px 0 6px", color: PLUM }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 34, fontWeight: 700 }}>{c.name}</span>
                {c.position.baseFret > 1 && <span style={{ fontSize: 20, fontWeight: 700, color: C.check }}>{`${c.position.baseFret}fr`}</span>}
              </div>
              <Diagram position={c.position} />
            </div>
          ))}
        </div>
      )}
      <Footer withName />
    </div>
  );
}

export function SiteShareCard() {
  return (
    <div style={frame}>
      <div style={{ display: "flex", flexDirection: "column", width: 700 }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 4, color: C.accent }}>HỢP ÂM GUITAR MIỄN PHÍ</div>
        <div style={{ fontFamily: "Display", fontSize: 108, lineHeight: 1.05, marginTop: 40 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 38, lineHeight: 1.35, color: C.soft, marginTop: 28 }}>Lời và thế bấm trên cùng một màn hình. Có capo, điệu, và Mầm dẫn bài.</div>
      </div>
      <div style={{ position: "absolute", right: 110, top: 90, display: "flex" }}>
        <MascotArt size={400} hat={hoian.Hat()} />
      </div>
      <Footer withName={false} />
    </div>
  );
}
