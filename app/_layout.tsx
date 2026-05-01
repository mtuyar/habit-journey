import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider, Theme } from "tamagui";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import config from "../tamagui.config";
import { useSettingsStore } from "@/store/useSettingsStore";
import { BottomTabBar } from "@/components/BottomTabBar";

function RootStack() {
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
        contentStyle: {
          backgroundColor: isDarkMode ? "#07211F" : "#F8FAFC",
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="insights" />
      <Stack.Screen name="settings" />
      <Stack.Screen
        name="create"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="group/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="goal/[id]" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  return (
    <TamaguiProvider config={config} defaultTheme={isDarkMode ? "dark" : "light"}>
      <Theme name={isDarkMode ? "dark" : "light"}>
        <SafeAreaProvider>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          <RootStack />
          <BottomTabBar />
        </SafeAreaProvider>
      </Theme>
    </TamaguiProvider>
  );
}
