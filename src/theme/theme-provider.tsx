import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';

import { RoomPalettes, type Palette } from '@/constants/theme';
import { getPreference, setPreference } from '@/preferences-storage';

export type ThemeMode = 'light' | 'dark';

const themeKey = 'oda-theme';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: Palette;
  ready: boolean;
  hasChosen: boolean;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [hasChosen, setHasChosen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void getPreference(themeKey)
      .catch(() => null)
      .then((stored) => {
        if (!active) return;
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
          setHasChosen(true);
        }
        setReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    Appearance.setColorScheme(mode);
  }, [mode]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    setHasChosen(true);
    void setPreference(themeKey, nextMode).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ mode, colors: RoomPalettes[mode], ready, hasChosen, setMode }), [mode, ready, hasChosen, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return context;
}
