import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const styles = StyleSheet.create({
  bar: { paddingBottom: 12, borderBottomWidth: 3 },
  status: { marginTop: 56, paddingHorizontal: 32, alignItems: "center", gap: 16 },
  message: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, textAlign: "center" },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  buttonText: { fontFamily: fonts.bold, fontSize: 16 },
});
