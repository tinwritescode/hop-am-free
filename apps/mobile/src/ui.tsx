import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Catalog } from "@hopamfree/core/api";
import { fonts, useColors } from "./theme";

/** The plum bar every screen opens on; it pads itself below the notch / Dynamic Island. */
export function Bar({ children }: { children: ReactNode }) {
  const colors = useColors();
  const { top, left, right } = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { backgroundColor: colors.bar, borderColor: colors.accent, paddingTop: top + 8, paddingLeft: left + 20, paddingRight: right + 20 }]}>
      {children}
    </View>
  );
}

/** "‹" on the bar: back to where the user came from, or home when opened from a link. */
export function BackButton({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} hitSlop={12} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={[styles.back, { color: colors.accent }]}>‹</Text>
    </Pressable>
  );
}

/** Loading spinner, or an error with a way to try again. */
export function Status({ error, onRetry }: { error?: string; onRetry: () => void }) {
  const colors = useColors();
  if (error === undefined) return <ActivityIndicator style={styles.status} color={colors.chord} />;
  return (
    <View style={styles.status}>
      <Text style={[styles.message, { color: colors.soft }]}>{error}</Text>
      <Pressable onPress={onRetry} style={({ pressed }) => [styles.button, { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[styles.buttonText, { color: colors.onAccent }]}>Thử lại</Text>
      </Pressable>
    </View>
  );
}

/** A tappable list row: title and subtitle on the left, a short value (key, song count) on the right. */
export function Row({ title, subtitle, value, onPress, valueLabel }: { title: string; subtitle?: string; value: string; onPress: () => void; valueLabel?: string }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { borderColor: colors.line }, pressed && { backgroundColor: colors.hover }]} accessibilityRole="link">
      <View style={styles.rowText}>
        <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text style={[styles.subtitle, { color: colors.soft }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={[styles.value, { color: colors.chord }]} accessibilityLabel={valueLabel}>
        {value}
      </Text>
    </Pressable>
  );
}

export function SongRow({ song }: { song: Catalog["songs"][number] }) {
  return (
    <Row
      title={song.title}
      subtitle={song.artist}
      value={song.key}
      valueLabel={`Tone ${song.key}`}
      onPress={() => router.push({ pathname: "/bai-hat/[slug]", params: { slug: song.slug } })}
    />
  );
}

const styles = StyleSheet.create({
  bar: { paddingBottom: 12, borderBottomWidth: 3 },
  back: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 32 },
  status: { marginTop: 56, paddingHorizontal: 32, alignItems: "center", gap: 16 },
  message: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, textAlign: "center" },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  buttonText: { fontFamily: fonts.bold, fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 17 },
  subtitle: { fontFamily: fonts.body, fontSize: 14, marginTop: 2 },
  value: { fontFamily: fonts.bold, fontSize: 15, minWidth: 44, textAlign: "right" },
});
