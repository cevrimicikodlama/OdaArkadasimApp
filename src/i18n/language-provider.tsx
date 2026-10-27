import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getPreference, setPreference } from '@/preferences-storage';
import { translations, type Language, type TranslationKey } from './translations';

const languageKey = 'oda-language';

type Params = Record<string, string | number>;

type LanguageContextValue = {
  language: Language;
  ready: boolean;
  hasChosen: boolean;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Params) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [hasChosen, setHasChosen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void getPreference(languageKey)
      .catch(() => null)
      .then((stored) => {
        if (!active) return;
        if (stored === 'en' || stored === 'tr') {
          setLanguageState(stored);
          setHasChosen(true);
        }
        setReady(true);
      });
    return () => { active = false; };
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    setHasChosen(true);
    void setPreference(languageKey, nextLanguage).catch(() => undefined);
  }, []);

  const t = useCallback((key: TranslationKey, params?: Params) => {
    const template = translations[language][key];
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''));
  }, [language]);

  const value = useMemo(() => ({ language, ready, hasChosen, setLanguage, t }), [language, ready, hasChosen, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useI18n must be used inside LanguageProvider');
  return context;
}
