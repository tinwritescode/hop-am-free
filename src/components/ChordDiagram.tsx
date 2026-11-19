import { tabOf, type Position } from "@hopamfree/core/chords";
import { DIAGRAM_HEIGHT as H, DIAGRAM_WIDTH as W, diagramShapes, type Paint } from "@hopamfree/core/chord-diagram";

const PAINT: Record<Exclude<Paint, "color">, string> = { ink: "var(--ink)", soft: "var(--soft)", surface: "var(--surface)" };

export function ChordDiagram({
  name,
  position,
  scale = 1,
  color = "var(--link)",
  showFingers = false,
}: {
  name: string;
  position: Position;
  scale?: number;
  color?: string;
  showFingers?: boolean;
}) {
  const paint = (p: Paint) => (p === "color" ? color : PAINT[p]);
  return (
    <svg width={W * scale} height={H * scale} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Thế bấm ${name}: ${tabOf(position)}`}>
      {diagramShapes({ position, showFingers }).map((s, i) => {
        switch (s.kind) {
          case "rect":
            return <rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} style={{ fill: paint(s.paint) }} />;
          case "dot":
            return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} style={{ fill: paint(s.paint) }} />;
          case "ring":
            return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="none" style={{ stroke: paint(s.paint) }} strokeWidth="1.4" />;
          case "text":
            return (
              <text key={i} x={s.x} y={s.y} textAnchor={s.anchor} fontSize={s.size} fontWeight={s.weight} style={{ fill: paint(s.paint) }}>
                {s.text}
              </text>
            );
          default: {
            const _exhaustive: never = s;
            return _exhaustive;
          }
        }
      })}
    </svg>
  );
}
