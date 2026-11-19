import { Stack } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { YesevaOne_400Regular } from "@expo-google-fonts/yeseva-one";
import { BeVietnamPro_400Regular, BeVietnamPro_500Medium, BeVietnamPro_700Bold } from "@expo-google-fonts/be-vietnam-pro";
import { useColors } from "../theme";

export default function RootLayout() {
  // Hands are on the guitar: the screen stays on the whole time the app is open.
  useKeepAwake();
  const colors = useColors();
  const [loaded, error] = useFonts({ YesevaOne_400Regular, BeVietnamPro_400Regular, BeVietnamPro_500Medium, BeVietnamPro_700Bold });
  // A failed font load falls back to the system font rather than a blank app.
  if (!loaded && !error) return null;
  return (
    <>
      {/* Both screens open on the plum bar, so light status text in either mode. */}
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}
