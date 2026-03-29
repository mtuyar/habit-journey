import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useColorScheme } from 'nativewind';
import 'react-native-reanimated';
import './global.css';

function ThemeController() {
  const isDarkMode = useSettingsStore(state => state.isDarkMode);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, setColorScheme]);

  return <StatusBar style={isDarkMode ? "light" : "dark"} />;
}

export default function RootLayout() {
  return (
    <>
      <ThemeController />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F0FDFA' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="goal/[id]" />
      </Stack>
    </>
  );
}
