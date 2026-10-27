import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Palette } from '@/constants/theme';
import { useI18n } from '@/i18n/language-provider';
import { useAppTheme, type ThemeMode } from '@/theme/theme-provider';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { language, setLanguage, t } = useI18n();
  const { mode, colors, setMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState<'language' | 'theme'>('language');

  const finish = () => {
    setMode(mode);
    onDone();
  };

  const themeOption = (value: ThemeMode, label: string) => (
    <Pressable key={value} accessibilityRole="button" onPress={() => setMode(value)} style={[styles.option, mode === value && styles.optionActive]}>
      <Text style={[styles.optionText, mode === value && styles.optionTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.body}>
        <View style={styles.brandMark}><Text style={styles.brandGlyph}>⌂</Text></View>
        {step === 'language' ? (
          <>
            <Text style={styles.title}>To continue in English, tap the English button</Text>
            <Text style={styles.subtitle}>Türkçe devam etmek için Türkçe butonuna tıklayın</Text>
            <View style={styles.row}>
              <Pressable accessibilityRole="button" style={styles.option} onPress={() => { setLanguage('en'); setStep('theme'); }}>
                <Text style={styles.optionText}>English</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.option} onPress={() => { setLanguage('tr'); setStep('theme'); }}>
                <Text style={styles.optionText}>Türkçe</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>{t('onb.themeTitle')}</Text>
            <Text style={styles.subtitle}>{t('onb.themeSub')}</Text>
            <View style={styles.row}>
              {themeOption('light', t('theme.light'))}
              {themeOption('dark', t('theme.dark'))}
            </View>
            <Pressable accessibilityRole="button" style={styles.continueButton} onPress={finish}>
              <Text style={styles.continueText}>{language === 'tr' ? 'Devam et' : 'Continue'}</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.canvas },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  brandMark: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: c.mint, marginBottom: 24 },
  brandGlyph: { color: c.greenDark, fontSize: 32, fontWeight: '700' },
  title: { color: c.ink, fontSize: 22, fontWeight: '800', textAlign: 'center', maxWidth: 320 },
  subtitle: { color: c.muted, fontSize: 13, textAlign: 'center', marginTop: 10, maxWidth: 320 },
  row: { flexDirection: 'row', gap: 12, marginTop: 28 },
  option: { minWidth: 130, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: 18 },
  optionActive: { borderColor: c.greenDark, backgroundColor: c.mint },
  optionText: { color: c.ink, fontSize: 15, fontWeight: '700' },
  optionTextActive: { color: c.greenDark },
  continueButton: { minWidth: 200, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: c.green, marginTop: 28 },
  continueText: { color: c.onGreen, fontSize: 14, fontWeight: '800' },
});
