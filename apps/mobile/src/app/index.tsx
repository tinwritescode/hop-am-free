import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSongs } from "../api";
import { fonts, useColors, type Colors } from "../theme";
import { Bar, Status } from "../ui";

export default function SongList() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { bottom } = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text]);
  const [songs, retry] = useSongs(query);

  return (
    <View style={styles.screen}>
      <Bar>
        <Text style={styles.brand}>Hợp Âm Free</Text>
        <TextInput
          style={styles.search}
          placeholder="Tên bài, ca sĩ hoặc hợp âm"
          placeholderTextColor={colors.soft}
          value={text}
          onChangeText={setText}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          returnKeyType="search"
          accessibilityLabel="Tìm bài hát"
        />
      </Bar>
      {songs.kind !== "ok" ? (
        <Status error={songs.kind === "error" ? songs.message : undefined} onRetry={retry} />
      ) : (
        <FlatList
          data={songs.data}
          keyExtractor={(s) => s.slug}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: bottom + 16 }}
          ListHeaderComponent={
            songs.data.length > 0 ? <Text style={styles.heading}>{query ? `Kết quả cho “${query}”` : "Mới thêm gần đây"}</Text> : undefined
          }
          ListEmptyComponent={<Text style={styles.empty}>Chưa có bài nào khớp “{query}”. Thử tên ca sĩ, hoặc gõ không dấu.</Text>}
          renderItem={({ item }) => (
            <Link href={{ pathname: "/bai-hat/[slug]", params: { slug: item.slug } }} asChild>
              <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={styles.rowText}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.artist} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>
                <Text style={styles.key} accessibilityLabel={`Tone ${item.key}`}>
                  {item.key}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    brand: { fontFamily: fonts.display, fontSize: 30, color: c.barInk, marginBottom: 14 },
    search: { fontFamily: fonts.body, fontSize: 17, color: c.fieldInk, backgroundColor: c.field, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
    heading: { fontFamily: fonts.medium, fontSize: 14, color: c.soft, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
    empty: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: c.soft, textAlign: "center", paddingHorizontal: 32, paddingTop: 48 },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
    pressed: { backgroundColor: c.hover },
    rowText: { flex: 1 },
    title: { fontFamily: fonts.bold, fontSize: 17, color: c.ink },
    artist: { fontFamily: fonts.body, fontSize: 14, color: c.soft, marginTop: 2 },
    key: { fontFamily: fonts.bold, fontSize: 15, color: c.chord, minWidth: 44, textAlign: "right" },
  });
