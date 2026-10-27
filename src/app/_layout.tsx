import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Onboarding } from '@/components/onboarding';
import { RoomDataProvider } from '@/components/room-data';
import { LanguageProvider, useI18n } from '@/i18n/language-provider';
import { AppThemeProvider, useAppTheme } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync();

function Shell() {
  const language = useI18n();
  const theme = useAppTheme();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const ready = language.ready && theme.ready;

  useEffect(() => {
    if (ready && needsOnboarding === null) setNeedsOnboarding(!(language.hasChosen && theme.hasChosen));
  }, [ready, needsOnboarding, language.hasChosen, theme.hasChosen]);

  useEffect(() => {
    if (needsOnboarding) void SplashScreen.hideAsync();
  }, [needsOnboarding]);

  if (needsOnboarding === null) return null;

  return (
    <ThemeProvider value={theme.mode === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      {needsOnboarding ? (
        <Onboarding onDone={() => setNeedsOnboarding(false)} />
      ) : (
        <RoomDataProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
        </RoomDataProvider>
      )}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AppThemeProvider>
        <Shell />
      </AppThemeProvider>
    </LanguageProvider>
  );
}
