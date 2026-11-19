import { Stack } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  // Hands are on the guitar: the screen stays on the whole time the app is open.
  useKeepAwake();
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerTintColor: "#b4532a", headerBackButtonDisplayMode: "minimal" }}>
        <Stack.Screen name="index" options={{ title: "Hợp Âm Free" }} />
        <Stack.Screen name="bai-hat/[slug]" options={{ title: "" }} />
      </Stack>
    </>
  );
}
