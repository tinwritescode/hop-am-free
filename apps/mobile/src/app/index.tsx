import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { useSongs } from "../api";
import { colors } from "../theme";

export default function SongList() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text]);
  const songs = useSongs(query);

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.search}
        placeholder="Tìm bài hát, ca sĩ, hợp âm…"
        placeholderTextColor={colors.soft}
        value={text}
        onChangeText={setText}
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      {songs.kind === "loading" && <ActivityIndicator style={styles.status} color={colors.accent} />}
      {songs.kind === "error" && <Text style={styles.status}>{songs.message}</Text>}
      {songs.kind === "ok" && (
        <FlatList
          data={songs.data}
          keyExtractor={(s) => s.slug}
          keyboardDismissMode="on-drag"
          ListEmptyComponent={<Text style={styles.status}>Không có bài nào</Text>}
          renderItem={({ item }) => (
            <Link href={{ pathname: "/bai-hat/[slug]", params: { slug: item.slug } }} asChild>
              <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={styles.rowText}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.artist}>{item.artist}</Text>
                </View>
                <Text style={styles.key}>{item.key}</Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  search: { margin: 12, padding: 12, borderRadius: 10, backgroundColor: colors.card, fontSize: 16, color: colors.ink },
  status: { marginTop: 24, textAlign: "center", color: colors.soft },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  pressed: { backgroundColor: colors.card },
  rowText: { flex: 1 },
  title: { fontSize: 17, fontWeight: "600", color: colors.ink },
  artist: { fontSize: 14, color: colors.soft, marginTop: 2 },
  key: { fontSize: 15, fontWeight: "700", color: colors.accent, marginLeft: 12 },
});
