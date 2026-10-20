import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useReminderSync } from '@/lib/notifications';
import { useAccount } from '@/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const hydrated = useAccount((s) => s.hydrated);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  useReminderSync();

  if (!hydrated) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.tint,
          background: colors.background,
          card: colors.background,
          text: colors.text,
          border: colors.border,
        },
      }}>
      <Stack screenOptions={{ headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="program/[key]" options={{ title: 'Program' }} />
      </Stack>
    </ThemeProvider>
  );
}
