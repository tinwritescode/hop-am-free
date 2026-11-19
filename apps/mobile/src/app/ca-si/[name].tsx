import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCatalog } from "../../api";
import { fonts, useColors } from "../../theme";
import { BackButton, Bar, SongRow, Status } from "../../ui";

/** Every song one singer is credited on, duets included, newest first. */
export default function ArtistScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const colors = useColors();
  const { bottom } = useSafeAreaInsets();
  const [catalog, retry] = useCatalog();
  const songs = useMemo(() => (catalog.kind === "ok" ? catalog.data.songs.filter((s) => s.artists.includes(name)) : []), [catalog, name]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Bar>
        <View style={styles.head}>
          <BackButton label="Quay lại" />
          <View style={styles.headText}>
            <Text style={[styles.name, { color: colors.barInk }]} numberOfLines={2}>
              {name}
            </Text>
            {catalog.kind === "ok" && <Text style={[styles.count, { color: colors.barSoft }]}>{songs.length} bài</Text>}
          </View>
        </View>
      </Bar>
      {catalog.kind !== "ok" ? (
        <Status error={catalog.kind === "error" ? catalog.message : undefined} onRetry={retry} />
      ) : (
        <FlatList data={songs} keyExtractor={(s) => s.slug} contentContainerStyle={{ paddingBottom: bottom + 16 }} renderItem={({ item }) => <SongRow song={item} />} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  head: { flexDirection: "row", alignItems: "center", gap: 14 },
  headText: { flex: 1 },
  name: { fontFamily: fonts.display, fontSize: 24, lineHeight: 32 },
  count: { fontFamily: fonts.body, fontSize: 14 },
});
