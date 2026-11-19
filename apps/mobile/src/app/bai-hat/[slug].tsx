import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { parseChordSheet, type Line } from "@hopamfree/core/chordsheet";
import type { SongDetail } from "@hopamfree/core/api";
import { useSong } from "../../api";
import { fonts, useColors, type Colors } from "../../theme";
import { Bar, Status } from "../../ui";

export default function SongScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [song, retry] = useSong(slug);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.screen}>
      <Bar>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} hitSlop={12} style={styles.back} accessibilityRole="button">
          <Text style={styles.backText}>‹ Bài hát</Text>
        </Pressable>
        {song.kind === "ok" && <Heading song={song.data} styles={styles} />}
      </Bar>
      {song.kind === "ok" ? <Sheet song={song.data} styles={styles} /> : <Status error={song.kind === "error" ? song.message : undefined} onRetry={retry} />}
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function Heading({ song, styles }: { song: SongDetail; styles: Styles }) {
  const facts = [`Tone ${song.key}`, song.capo ? `Capo ${song.capo}` : null, song.rhythm || null].filter((f) => f !== null);
  return (
    <>
      <Text style={styles.title}>{song.title}</Text>
      <Text style={styles.artist}>{song.artist}</Text>
      <View style={styles.facts}>
        {facts.map((f) => (
          <Text key={f} style={styles.fact}>
            {f}
          </Text>
        ))}
      </View>
    </>
  );
}

function Sheet({ song, styles }: { song: SongDetail; styles: Styles }) {
  const { bottom, left, right } = useSafeAreaInsets();
  const sections = useMemo(() => parseChordSheet(song.sheet), [song.sheet]);
  return (
    <ScrollView contentContainerStyle={[styles.sheet, { paddingBottom: bottom + 48, paddingLeft: left + 20, paddingRight: right + 20 }]}>
      {sections.map((section, i) => (
        <View key={i} style={section.title ? styles.namedSection : styles.section}>
          {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
          {section.lines.map((line) => (
            <SheetLine key={line.index} line={line} styles={styles} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

/** Each word sits under its chord; on a narrow screen a word wraps together with its chord. */
function SheetLine({ line, styles }: { line: Line; styles: Styles }) {
  return (
    <View style={styles.line}>
      {line.tokens.map((token, i) => (
        <View key={i} style={line.chordOnly ? styles.chordOnlyToken : styles.token}>
          {line.hasChords && <Text style={styles.chord}>{token.chord ?? " "}</Text>}
          {!line.chordOnly && <Text style={styles.word}>{token.text}</Text>}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    back: { alignSelf: "flex-start", paddingVertical: 4, marginBottom: 10 },
    backText: { fontFamily: fonts.medium, fontSize: 16, color: c.accent },
    title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, color: c.barInk },
    artist: { fontFamily: fonts.body, fontSize: 16, color: c.barSoft, marginTop: 4 },
    facts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
    fact: { fontFamily: fonts.bold, fontSize: 14, color: c.accent, borderWidth: 1, borderColor: c.accent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, overflow: "hidden" },
    sheet: { paddingTop: 8 },
    section: { marginTop: 20 },
    namedSection: { marginTop: 28, paddingLeft: 12, borderLeftWidth: 3, borderColor: c.accent },
    sectionTitle: { fontFamily: fonts.medium, fontSize: 15, color: c.soft, marginBottom: 6 },
    line: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
    token: { marginRight: 6 },
    chordOnlyToken: { marginRight: 18 },
    chord: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: c.chord },
    word: { fontFamily: fonts.body, fontSize: 19, lineHeight: 27, color: c.ink },
  });
