import { Fragment, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { parseChordSheet, type Line } from "@hopamfree/core/chordsheet";
import type { SongDetail } from "@hopamfree/core/api";
import { useSong } from "../../api";
import { useAutoScroll, SPEEDS } from "../../auto-scroll";
import { ChordSheet } from "../../chord-sheet";
import { fonts, useColors, type Colors } from "../../theme";
import { BackButton, Bar, Status } from "../../ui";

export default function SongScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [song, retry] = useSong(slug);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scrollY = useRef(new Animated.Value(0)).current;
  return (
    <View style={styles.screen}>
      <Bar>
        <View style={styles.barRow}>
          <BackButton label="Quay lại danh sách" />
          {song.kind === "ok" && (
            // The big title scrolls away under the bar; this small one takes its place.
            <Animated.Text style={[styles.barTitle, { opacity: scrollY.interpolate({ inputRange: [40, 90], outputRange: [0, 1], extrapolate: "clamp" }) }]} numberOfLines={1}>
              {song.data.title}
            </Animated.Text>
          )}
        </View>
      </Bar>
      {song.kind === "ok" ? (
        <Sheet song={song.data} styles={styles} scrollY={scrollY} />
      ) : (
        <Status error={song.kind === "error" ? song.message : undefined} onRetry={retry} />
      )}
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function Sheet({ song, styles, scrollY }: { song: SongDetail; styles: Styles; scrollY: Animated.Value }) {
  const { bottom, left, right } = useSafeAreaInsets();
  const sections = useMemo(() => parseChordSheet(song.sheet), [song.sheet]);
  const auto = useAutoScroll();
  const [chord, setChord] = useState<string | null>(null);
  const facts = [`Tone ${song.key}`, song.capo ? `Capo ${song.capo}` : null, song.rhythm || null].filter((f) => f !== null);
  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        ref={auto.ref}
        {...auto.scrollProps}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true, listener: auto.onScroll })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: bottom + 96, paddingLeft: left + 20, paddingRight: right + 20 }}
      >
        <Text style={styles.title}>{song.title}</Text>
        <Text style={styles.artist}>{song.artist}</Text>
        <View style={styles.facts}>
          {facts.map((f) => (
            <Text key={f} style={styles.fact}>
              {f}
            </Text>
          ))}
        </View>
        {sections.map((section, i) => (
          <View key={i} style={section.title ? styles.namedSection : styles.section}>
            {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
            {section.lines.map((line) => (
              <SheetLine key={line.index} line={line} styles={styles} onChord={setChord} />
            ))}
          </View>
        ))}
      </Animated.ScrollView>
      <View style={[styles.player, { bottom: bottom + 12, right: right + 16 }]}>
        <Pressable onPress={auto.slower} disabled={auto.speed === 0} hitSlop={6} style={styles.playerButton} accessibilityLabel="Cuộn chậm hơn">
          <Text style={[styles.playerText, auto.speed === 0 && styles.playerDisabled]}>−</Text>
        </Pressable>
        <Pressable onPress={auto.toggle} hitSlop={6} style={styles.playButton} accessibilityLabel={auto.playing ? "Dừng tự cuộn" : "Tự cuộn"}>
          <Text style={styles.playText}>{auto.playing ? "❚❚" : "▶"}</Text>
          <Text style={styles.speedText}>{auto.speed + 1}</Text>
        </Pressable>
        <Pressable onPress={auto.faster} disabled={auto.speed === SPEEDS.length - 1} hitSlop={6} style={styles.playerButton} accessibilityLabel="Cuộn nhanh hơn">
          <Text style={[styles.playerText, auto.speed === SPEEDS.length - 1 && styles.playerDisabled]}>+</Text>
        </Pressable>
      </View>
      <ChordSheet name={chord} onClose={() => setChord(null)} />
    </View>
  );
}

/** One line of text, chords inline where they fall: "mệt không [Em] anh?". Tap a chord for its diagram. */
function SheetLine({ line, styles, onChord }: { line: Line; styles: Styles; onChord: (name: string) => void }) {
  return (
    <Text style={styles.line}>
      {line.tokens.map((token, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          {token.chord && (
            <Text style={styles.chord} onPress={() => token.chord && onChord(token.chord)} accessibilityRole="button" accessibilityHint="Xem thế bấm">
              [{token.chord}]
            </Text>
          )}
          {token.chord && token.text && " "}
          {token.text}
        </Fragment>
      ))}
    </Text>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    barRow: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 32 },
    barTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: c.barInk },
    title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 36, color: c.ink },
    artist: { fontFamily: fonts.body, fontSize: 15, color: c.soft, marginTop: 2 },
    facts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginBottom: 4 },
    fact: { fontFamily: fonts.bold, fontSize: 13, color: c.chord, borderWidth: 1, borderColor: c.line, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, overflow: "hidden" },
    section: { marginTop: 14 },
    namedSection: { marginTop: 18, paddingLeft: 10, borderLeftWidth: 3, borderColor: c.accent },
    sectionTitle: { fontFamily: fonts.medium, fontSize: 14, color: c.soft, marginBottom: 2 },
    line: { fontFamily: fonts.body, fontSize: 18, lineHeight: 27, color: c.ink },
    chord: { fontFamily: fonts.bold, color: c.chord },
    player: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 4, padding: 4, borderRadius: 999, backgroundColor: c.bar, borderWidth: 2, borderColor: c.accent },
    playerButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    playerText: { fontFamily: fonts.bold, fontSize: 24, color: c.barInk },
    playerDisabled: { opacity: 0.35 },
    playButton: { flexDirection: "row", alignItems: "center", gap: 6, height: 44, paddingHorizontal: 16, borderRadius: 999, backgroundColor: c.accent },
    playText: { fontSize: 15, color: c.onAccent },
    speedText: { fontFamily: fonts.bold, fontSize: 17, color: c.onAccent },
  });
