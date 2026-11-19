import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Rect, Text as SvgText } from "react-native-svg";
import { DIFFICULTY_LABEL, difficultyOf, handHint, tabOf, voicingsFor, type Position } from "@hopamfree/core/chords";
import { DIAGRAM_HEIGHT as H, DIAGRAM_WIDTH as W, diagramShapes, type Paint } from "@hopamfree/core/chord-diagram";
import { fonts, useColors, type Colors } from "./theme";

function Diagram({ position, scale, colors }: { position: Position; scale: number; colors: Colors }) {
  const paint: Record<Paint, string> = { ink: colors.ink, soft: colors.soft, surface: colors.bg, color: colors.chord };
  return (
    <Svg width={W * scale} height={H * scale} viewBox={`0 0 ${W} ${H}`}>
      {diagramShapes({ position, showFingers: true }).map((s, i) => {
        switch (s.kind) {
          case "rect":
            return <Rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} fill={paint[s.paint]} />;
          case "dot":
            return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={paint[s.paint]} />;
          case "ring":
            return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="none" stroke={paint[s.paint]} strokeWidth={1.4} />;
          case "text":
            return (
              <SvgText key={i} x={s.x} y={s.y} textAnchor={s.anchor} fontSize={s.size} fontWeight={s.weight} fill={paint[s.paint]}>
                {s.text}
              </SvgText>
            );
          default: {
            const _exhaustive: never = s;
            return _exhaustive;
          }
        }
      })}
    </Svg>
  );
}

/** Bottom sheet with a chord's diagrams, easiest voicing first; tap outside to close. */
export function ChordSheet({ name, onClose }: { name: string | null; onClose: () => void }) {
  return (
    <Modal visible={name !== null} transparent animationType="slide" onRequestClose={onClose}>
      {name !== null && <ChordBody key={name} name={name} onClose={onClose} />}
    </Modal>
  );
}

function ChordBody({ name, onClose }: { name: string; onClose: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { bottom } = useSafeAreaInsets();
  const voicings = useMemo(() => voicingsFor({ name, easiestFirst: true }), [name]);
  const [index, setIndex] = useState(0);
  const position = voicings[index];

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng" />
      <View style={[styles.sheet, { paddingBottom: bottom + 20 }]}>
        <View style={styles.head}>
          <Text style={styles.name}>{name}</Text>
          {position && <Text style={styles.meta}>{`${DIFFICULTY_LABEL[difficultyOf(position)]}, thế ${index + 1}/${voicings.length}`}</Text>}
        </View>
        {position ? (
          <>
            <View style={styles.diagramRow}>
              <Arrow label="‹" disabled={index === 0} onPress={() => setIndex(index - 1)} styles={styles} a11y="Thế bấm trước" />
              <Diagram position={position} scale={1.5} colors={colors} />
              <Arrow label="›" disabled={index === voicings.length - 1} onPress={() => setIndex(index + 1)} styles={styles} a11y="Thế bấm sau" />
            </View>
            <Text style={styles.tab}>{tabOf(position)}</Text>
            <Text style={styles.hint}>{handHint(position)}</Text>
          </>
        ) : (
          <Text style={styles.hint}>Chưa có sơ đồ cho hợp âm {name}.</Text>
        )}
      </View>
    </View>
  );
}

function Arrow({ label, disabled, onPress, styles, a11y }: { label: string; disabled: boolean; onPress: () => void; styles: Styles; a11y: string }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8} style={styles.arrow} accessibilityLabel={a11y}>
      <Text style={[styles.arrowText, disabled && styles.disabled]}>{label}</Text>
    </Pressable>
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(30,12,34,0.45)" },
    sheet: { backgroundColor: c.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 3, borderColor: c.accent, paddingTop: 18, paddingHorizontal: 20, alignItems: "center" },
    head: { flexDirection: "row", alignItems: "baseline", gap: 12, alignSelf: "stretch" },
    name: { fontFamily: fonts.display, fontSize: 34, color: c.chord },
    meta: { fontFamily: fonts.medium, fontSize: 15, color: c.soft },
    diagramRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
    arrow: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    arrowText: { fontFamily: fonts.bold, fontSize: 34, color: c.ink },
    disabled: { opacity: 0.2 },
    tab: { fontFamily: fonts.bold, fontSize: 16, letterSpacing: 2, color: c.ink, marginTop: 4 },
    hint: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: c.soft, textAlign: "center", marginTop: 8, maxWidth: 320 },
  });
