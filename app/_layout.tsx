import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useColorScheme } from 'nativewind';
import 'react-native-reanimated';
import './global.css';
import { BottomTabBar } from '@/components/BottomTabBar';

function ThemeController() {
  const isDarkMode = useSettingsStore(state => state.isDarkMode);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, setColorScheme]);

  return <StatusBar style={isDarkMode ? 'light' : 'dark'} />;
}

function RootStack() {
  const isDarkMode = useSettingsStore(state => state.isDarkMode);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: isDarkMode ? '#07211F' : '#F0FDFA' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="insights" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="group/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="goal/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <>
      <ThemeController />
      <RootStack />
      <BottomTabBar />
    </>
  );
}
