import { useMemo, useState, type ReactElement } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fold } from "@hopamfree/core/text";
import type { Catalog } from "@hopamfree/core/api";
import { useCatalog } from "../api";
import { fonts, useColors, type Colors } from "../theme";
import { Bar, Row, SongRow, Status } from "../ui";

const MODES = [
  { id: "songs", label: "Bài hát", placeholder: "Tìm tên bài hát" },
  { id: "artists", label: "Ca sĩ", placeholder: "Tìm tên ca sĩ" },
] as const;
type Mode = (typeof MODES)[number]["id"];

export default function Home() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [mode, setMode] = useState<Mode>("songs");
  const [text, setText] = useState("");
  const [catalog, retry] = useCatalog();

  return (
    <View style={styles.screen}>
      <Bar>
        <Text style={styles.brand}>Hợp Âm Free</Text>
        <TextInput
          style={styles.search}
          placeholder={MODES.find((m) => m.id === mode)?.placeholder}
          placeholderTextColor={colors.soft}
          value={text}
          onChangeText={setText}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          returnKeyType="search"
          accessibilityLabel="Tìm kiếm"
        />
        <View style={styles.modes} accessibilityRole="tablist">
          {MODES.map((m) => (
            <Pressable key={m.id} onPress={() => setMode(m.id)} style={[styles.mode, mode === m.id && styles.modeOn]} accessibilityRole="tab" accessibilityState={{ selected: mode === m.id }}>
              <Text style={[styles.modeText, mode === m.id && styles.modeTextOn]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
      </Bar>
      {catalog.kind !== "ok" ? (
        <Status error={catalog.kind === "error" ? catalog.message : undefined} onRetry={retry} />
      ) : mode === "songs" ? (
        <SongResults catalog={catalog.data} query={text.trim()} styles={styles} />
      ) : (
        <ArtistResults catalog={catalog.data} query={text.trim()} styles={styles} />
      )}
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function SongResults({ catalog, query, styles }: { catalog: Catalog; query: string; styles: Styles }) {
  const needle = fold(query);
  const songs = useMemo(() => (needle ? catalog.songs.filter((s) => fold(s.title).includes(needle)) : catalog.songs), [catalog, needle]);
  return (
    <Results
      data={songs}
      keyOf={(s) => s.slug}
      heading={query ? `${songs.length} bài có “${query}” trong tên` : `${songs.length} bài, mới thêm trước`}
      empty={`Không có bài nào tên có “${query}”. Thử gõ không dấu, hoặc tìm theo ca sĩ.`}
      render={(s) => <SongRow song={s} />}
      styles={styles}
    />
  );
}

function ArtistResults({ catalog, query, styles }: { catalog: Catalog; query: string; styles: Styles }) {
  const needle = fold(query);
  const artists = useMemo(() => (needle ? catalog.artists.filter((a) => fold(a.name).includes(needle)) : catalog.artists), [catalog, needle]);
  return (
    <Results
      data={artists}
      keyOf={(a) => a.name}
      heading={query ? `${artists.length} ca sĩ có “${query}” trong tên` : `${artists.length} ca sĩ, nhiều bài nhất trước`}
      empty={`Không có ca sĩ nào tên có “${query}”. Thử gõ không dấu.`}
      render={(a) => <Row title={a.name} value={`${a.count} bài`} onPress={() => router.push({ pathname: "/ca-si/[name]", params: { name: a.name } })} />}
      styles={styles}
    />
  );
}

function Results<T>({ data, keyOf, heading, empty, render, styles }: { data: T[]; keyOf: (item: T) => string; heading: string; empty: string; render: (item: T) => ReactElement; styles: Styles }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <FlatList
      data={data}
      keyExtractor={keyOf}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: bottom + 16 }}
      ListHeaderComponent={data.length > 0 ? <Text style={styles.heading}>{heading}</Text> : undefined}
      ListEmptyComponent={<Text style={styles.empty}>{empty}</Text>}
      renderItem={({ item }) => render(item)}
    />
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    brand: { fontFamily: fonts.display, fontSize: 28, color: c.barInk, marginBottom: 12 },
    search: { fontFamily: fonts.body, fontSize: 17, color: c.fieldInk, backgroundColor: c.field, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
    modes: { flexDirection: "row", gap: 8, marginTop: 12 },
    mode: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: c.barSoft },
    modeOn: { backgroundColor: c.accent, borderColor: c.accent },
    modeText: { fontFamily: fonts.medium, fontSize: 15, color: c.barInk },
    modeTextOn: { fontFamily: fonts.bold, color: c.onAccent },
    heading: { fontFamily: fonts.medium, fontSize: 14, color: c.soft, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
    empty: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: c.soft, textAlign: "center", paddingHorizontal: 32, paddingTop: 48 },
  });
