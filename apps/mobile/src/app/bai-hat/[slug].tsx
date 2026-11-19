import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { parseChordSheet, type Line } from "@hopamfree/core/chordsheet";
import type { SongDetail } from "@hopamfree/core/api";
import { useSong } from "../../api";
import { colors } from "../../theme";

export default function SongScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const song = useSong(slug);
  if (song.kind === "loading") return <ActivityIndicator style={styles.status} color={colors.accent} />;
  if (song.kind === "error") return <Text style={styles.status}>{song.message}</Text>;
  return <Sheet song={song.data} />;
}

function Sheet({ song }: { song: SongDetail }) {
  const sections = useMemo(() => parseChordSheet(song.sheet), [song.sheet]);
  const facts = [`Tone ${song.key}`, song.capo ? `Capo ${song.capo}` : null, song.rhythm || null].filter((f) => f !== null);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: song.title }} />
      <Text style={styles.title}>{song.title}</Text>
      <Text style={styles.artist}>{song.artist}</Text>
      <Text style={styles.facts}>{facts.join(" · ")}</Text>
      {sections.map((section, i) => (
        <View key={i} style={styles.section}>
          {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
          {section.lines.map((line) => (
            <SheetLine key={line.index} line={line} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

/** Each word sits under its chord; words wrap together with their chords on narrow screens. */
function SheetLine({ line }: { line: Line }) {
  return (
    <View style={styles.line}>
      {line.tokens.map((token, i) => (
        <View key={i} style={styles.token}>
          {line.hasChords && <Text style={styles.chord}>{token.chord ?? " "}</Text>}
          {!line.chordOnly && <Text style={styles.word}>{token.text}</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48 },
  status: { marginTop: 48, textAlign: "center", color: colors.soft },
  title: { fontSize: 28, fontWeight: "700", color: colors.ink },
  artist: { fontSize: 16, color: colors.soft, marginTop: 4 },
  facts: { fontSize: 15, fontWeight: "600", color: colors.accent, marginTop: 8 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.soft, textTransform: "uppercase", marginBottom: 4 },
  line: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
  token: { marginRight: 6 },
  chord: { fontSize: 15, fontWeight: "700", color: colors.accent },
  word: { fontSize: 18, color: colors.ink },
});
