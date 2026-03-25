import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import './global.css';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FDFBF7', // journeyBg
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={MyTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FDFBF7' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="group/[id]" />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
