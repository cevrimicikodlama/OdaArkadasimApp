import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRoomData } from '@/components/room-data';
import type { Palette } from '@/constants/theme';
import { useI18n } from '@/i18n/language-provider';
import type { Language } from '@/i18n/translations';
import { useAppTheme } from '@/theme/theme-provider';

let Google: any = null;
const googleConfigured = Platform.OS === 'web'
  ? !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  : !!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

if (Platform.OS !== 'web' && googleConfigured) {
  try {
    Google = require('expo-auth-session/providers/google');
  } catch (e) {
    console.warn('Google auth not available:', e);
  }
}

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const { colors, mode, setMode } = useAppTheme();
  const { t, language, setLanguage } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, register, login, loginWithGoogle, logout } = useRoomData();
  const [isLogin, setIsLogin] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [showRequiredErrors, setShowRequiredErrors] = useState(false);
  const [validationNotice, setValidationNotice] = useState<{ title: string; message: string } | null>(null);
  const switchWidth = useSharedValue(0);
  const activeSwitch = useSharedValue(0);

  const [, googleResponse, promptGoogleAsync] = Google ? Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  }) : [null, null, null];

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const accessToken = googleResponse.authentication?.accessToken;
      if (accessToken) {
        setGoogleSubmitting(true);
        void (async () => {
          try {
            await loginWithGoogle(accessToken);
          } catch (err) {
            setError(err instanceof Error ? err.message : t('profile.googleFailed'));
          } finally {
            setGoogleSubmitting(false);
          }
        })();
      }
    } else if (googleResponse?.type === 'error') {
      setError(t('profile.googleCancelled'));
    }
  }, [googleResponse, loginWithGoogle, t]);

  const switchIndicatorStyle = useAnimatedStyle(() => {
    const itemWidth = Math.max((switchWidth.value - 6) / 2, 0);
    return {
      width: itemWidth,
      transform: [{ translateX: (itemWidth + 3) * activeSwitch.value }],
    };
  });

  const selectMode = (nextMode: boolean) => {
    setIsLogin(nextMode);
    setError('');
    setShowRequiredErrors(false);
    activeSwitch.value = withTiming(nextMode ? 1 : 0, { duration: 220 });
  };

  const submit = async () => {
    const missingFields = [
      ...(!isLogin && !firstName.trim() ? [t('profile.firstName')] : []),
      ...(!isLogin && !lastName.trim() ? [t('profile.lastName')] : []),
      ...(!email.trim() ? [t('profile.email')] : []),
      ...(!password ? [t('profile.password')] : []),
      ...(!isLogin && !birthDate.trim() ? [t('profile.birthDateLabel')] : []),
    ];

    if (missingFields.length) {
      setShowRequiredErrors(true);
      setError('');
      setValidationNotice({
        title: t('profile.missingTitle'),
        message: t('profile.missingMessage', { fields: missingFields.join(', ') }),
      });
      return;
    }

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const birthDateValue = birthDate.trim();
    const parsedBirthDate = new Date(`${birthDateValue}T00:00:00.000Z`);
    const birthDateIsValid = isLogin || (
      /^\d{4}-\d{2}-\d{2}$/.test(birthDateValue)
      && !Number.isNaN(parsedBirthDate.getTime())
      && parsedBirthDate.toISOString().slice(0, 10) === birthDateValue
    );

    if (!emailIsValid || password.length < 8 || !birthDateIsValid) {
      setShowRequiredErrors(true);
      setError('');
      setValidationNotice({
        title: t('profile.checkTitle'),
        message: !emailIsValid
          ? t('profile.badEmail')
          : password.length < 8
            ? t('profile.shortPassword')
            : t('profile.badBirthDate'),
      });
      return;
    }

    setError('');
    setShowRequiredErrors(false);
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          password,
          birth_date: birthDate.trim(),
          bio: bio.trim() || null,
        });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('profile.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>{t('profile.kickerAccount')}</Text><Text style={styles.title}>{t('profile.yourProfile')}</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}><Text style={styles.avatarLetters}>{user.first_name[0]}{user.last_name[0]}</Text></View>
            <Text style={styles.profileName}>{user.first_name} {user.last_name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            {!!user.birth_date && <Text style={styles.profileEmail}>{t('profile.birthDate', { date: user.birth_date })}</Text>}
            {!!user.bio && <Text style={styles.profileBio}>{user.bio}</Text>}
            <View style={styles.profileRule} />
            <View style={styles.profileLine}><Text style={styles.profileLabel}>{t('profile.accountStatus')}</Text><Text style={styles.profileValue}>{t('profile.active')}</Text></View>
            <View style={styles.profileLine}><Text style={styles.profileLabel}>{t('profile.yourListings')}</Text><Text style={styles.profileValue}>{t('profile.inDiscover')}</Text></View>
          </View>
          <View style={styles.privacyNote}><Text style={styles.privacyTitle}>{t('profile.safeTitle')}</Text><Text style={styles.privacyText}>{t('profile.safeText')}</Text></View>
          <View style={styles.appearanceCard}>
            <Text style={styles.appearanceTitle}>{t('profile.appearance')}</Text>
            <View style={styles.appearanceRow}>
              <Text style={styles.appearanceLabel}>{t('profile.darkTheme')}</Text>
              <Switch value={mode === 'dark'} onValueChange={(on) => setMode(on ? 'dark' : 'light')} trackColor={{ false: colors.outline, true: colors.mint }} thumbColor={mode === 'dark' ? colors.green : colors.white} />
            </View>
            <View style={styles.appearanceRow}>
              <Text style={styles.appearanceLabel}>{t('profile.language')}</Text>
              <View style={styles.langRow}>
                {(['en', 'tr'] as Language[]).map((code) => (
                  <Pressable key={code} accessibilityRole="button" onPress={() => setLanguage(code)} style={[styles.langOption, language === code && styles.langOptionActive]}>
                    <Text style={[styles.langText, language === code && styles.langTextActive]}>{code === 'en' ? 'English' : 'Türkçe'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
          <Pressable style={styles.logoutButton} onPress={() => void logout()}><Text style={styles.logoutText}>{t('profile.logout')}</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brandMark}><Text style={styles.brandGlyph}>⌂</Text></View>
        <Text style={styles.eyebrow}>{t('profile.brand')}</Text>
        <Text style={styles.title}>{isLogin ? t('profile.welcomeBack') : t('profile.titleRegister')}</Text>
        <Text style={styles.subtitle}>{isLogin ? t('profile.subtitleLogin') : t('profile.subtitleRegister')}</Text>

        <View style={styles.switchRow} onLayout={(event) => { switchWidth.value = event.nativeEvent.layout.width; }}>
          <Animated.View pointerEvents="none" style={[styles.switchIndicator, switchIndicatorStyle]} />
          <Pressable onPress={() => selectMode(false)} style={styles.switchItem}><Text style={[styles.switchText, !isLogin && styles.switchTextActive]}>{t('profile.createAccount')}</Text></Pressable>
          <Pressable onPress={() => selectMode(true)} style={styles.switchItem}><Text style={[styles.switchText, isLogin && styles.switchTextActive]}>{t('profile.signIn')}</Text></Pressable>
        </View>

        {!isLogin && <View style={styles.nameRow}>
          <View style={styles.nameField}><Text style={styles.fieldLabel}>{t('profile.firstName')} <Text style={[styles.requiredMark, showRequiredErrors && !firstName.trim() && styles.requiredMarkInvalid]}>*</Text></Text><TextInput value={firstName} onChangeText={setFirstName} placeholder={t('profile.firstNamePlaceholder')} placeholderTextColor={colors.placeholder} autoCapitalize="words" style={styles.input} /></View>
          <View style={styles.nameField}><Text style={styles.fieldLabel}>{t('profile.lastName')} <Text style={[styles.requiredMark, showRequiredErrors && !lastName.trim() && styles.requiredMarkInvalid]}>*</Text></Text><TextInput value={lastName} onChangeText={setLastName} placeholder={t('profile.lastNamePlaceholder')} placeholderTextColor={colors.placeholder} autoCapitalize="words" style={styles.input} /></View>
        </View>}
        <Text style={styles.fieldLabel}>{t('profile.email')} <Text style={[styles.requiredMark, showRequiredErrors && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) && styles.requiredMarkInvalid]}>*</Text></Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor={colors.placeholder} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <Text style={styles.fieldLabel}>{t('profile.password')} <Text style={[styles.requiredMark, showRequiredErrors && (!password || password.length < 8) && styles.requiredMarkInvalid]}>*</Text></Text>
        <TextInput value={password} onChangeText={setPassword} placeholder={t('profile.passwordPlaceholder')} placeholderTextColor={colors.placeholder} secureTextEntry style={styles.input} />
        {!isLogin && <>
          <Text style={styles.fieldLabel}>{t('profile.birthDateLabel')} <Text style={[styles.requiredMark, showRequiredErrors && (!birthDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) && styles.requiredMarkInvalid]}>*</Text></Text>
          <TextInput value={birthDate} onChangeText={setBirthDate} placeholder={t('profile.birthPlaceholder')} placeholderTextColor={colors.placeholder} keyboardType="numbers-and-punctuation" style={styles.input} />
          <Text style={styles.fieldLabel}>{t('profile.bio')} <Text style={styles.optional}>{t('profile.optional')}</Text></Text>
          <TextInput value={bio} onChangeText={setBio} placeholder={t('profile.bioPlaceholder')} placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" style={[styles.input, styles.bioInput]} />
        </>}
        {!!error && <Text style={styles.errorText}>{error}</Text>}
        <Pressable disabled={submitting} style={[styles.submitButton, submitting && styles.submitDisabled]} onPress={() => void submit()}><Text style={styles.submitText}>{submitting ? t('profile.connecting') : isLogin ? t('profile.signIn') : t('profile.submitRegister')}</Text></Pressable>
        <Pressable disabled={googleSubmitting} style={[styles.googleButton, googleSubmitting && styles.submitDisabled]} onPress={() => { if (promptGoogleAsync) { void promptGoogleAsync(); } else { setError(t('profile.googleNotConfigured')); } }}>
          <Image source={require('../../assets/images/google_logo.png')} style={styles.googleLogo} resizeMode="contain" />
          <Text style={styles.googleText}>{isLogin ? t('profile.googleLogin') : t('profile.googleRegister')}</Text>
        </Pressable>
        <Text style={styles.terms}>{t('profile.terms')}</Text>
      </ScrollView>
      <Modal visible={validationNotice !== null} transparent animationType="fade" onRequestClose={() => setValidationNotice(null)}>
        <View style={styles.validationBackdrop}>
          <View style={styles.validationDialog}>
            <Text style={[styles.validationTitle, validationNotice?.title.startsWith('ⓘ') && styles.validationTitleError]}>{validationNotice?.title}</Text>
            <Text style={styles.validationMessage}>{validationNotice?.message}</Text>
            <Pressable accessibilityRole="button" style={styles.validationButton} onPress={() => setValidationNotice(null)}>
              <Text style={styles.validationButtonText}>{t('profile.ok')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.canvas }, content: { padding: 22, paddingBottom: 32 },
  brandMark: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: c.mint, marginTop: 13, marginBottom: 19 }, brandGlyph: { color: c.greenDark, fontSize: 27, fontWeight: '700' },
  eyebrow: { color: c.greenDark, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 }, title: { color: c.ink, fontSize: 25, fontWeight: '800', marginTop: 7, maxWidth: 315 }, subtitle: { color: c.muted, fontSize: 12, lineHeight: 18, marginTop: 7, maxWidth: 300 },
  switchRow: { position: 'relative', flexDirection: 'row', backgroundColor: c.paleMint, padding: 3, borderRadius: 5, marginTop: 22, marginBottom: 17 }, switchIndicator: { position: 'absolute', left: 3, top: 3, bottom: 3, backgroundColor: c.surface, borderRadius: 3, shadowColor: c.ink, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }, switchItem: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 3, zIndex: 1 }, switchText: { color: c.muted, fontSize: 11, fontWeight: '600' }, switchTextActive: { color: c.greenDark, fontWeight: '800' },
  validationBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.scrim, padding: 24 }, validationDialog: { width: '100%', maxWidth: 360, backgroundColor: c.surface, borderRadius: 8, padding: 20 }, validationTitle: { color: c.ink, fontSize: 16, fontWeight: '800' }, validationTitleError: { color: c.errorStrong }, validationMessage: { color: c.muted, fontSize: 13, lineHeight: 19, marginTop: 8 }, validationButton: { alignSelf: 'flex-end', backgroundColor: c.paleMint, borderRadius: 5, paddingHorizontal: 16, paddingVertical: 10, marginTop: 14 }, validationButtonText: { color: c.greenDark, fontSize: 12, fontWeight: '800' },
  nameRow: { flexDirection: 'row', gap: 9 }, nameField: { flex: 1 }, fieldLabel: { color: c.ink, fontSize: 11, fontWeight: '700', marginTop: 12, marginBottom: 6 }, requiredMark: { color: c.placeholder, fontSize: 12, fontWeight: '800' }, requiredMarkInvalid: { color: c.errorStrong }, optional: { color: c.muted, fontSize: 10, fontWeight: '400' }, input: { minHeight: 46, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 5, paddingHorizontal: 12, color: c.ink, fontSize: 12 }, bioInput: { height: 81, paddingTop: 12 },
  submitButton: { height: 49, backgroundColor: c.greenDark, borderRadius: 5, marginTop: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, submitDisabled: { opacity: 0.65 }, submitText: { color: c.onGreen, fontWeight: '800', fontSize: 13 }, submitArrow: { color: c.onGreen, fontSize: 15, fontWeight: '700' }, terms: { color: c.placeholder, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 13, paddingHorizontal: 12 }, errorText: { color: c.error, fontSize: 10, marginTop: 10, lineHeight: 15 },
  googleButton: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: c.googleBg, borderWidth: 1, borderColor: c.googleBorder, borderRadius: 5, paddingVertical: 11, paddingHorizontal: 20, marginTop: 10, gap: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 }, googleLogo: { width: 18, height: 18 }, googleText: { color: c.googleText, fontSize: 12, fontWeight: '600' },
  profileCard: { alignItems: 'center', backgroundColor: c.surface, borderRadius: 6, borderWidth: 1, borderColor: c.border, padding: 20, marginTop: 22 }, profileAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: c.mint }, avatarLetters: { color: c.greenDark, fontSize: 20, fontWeight: '800' }, profileName: { color: c.ink, fontSize: 18, fontWeight: '800', marginTop: 12 }, profileEmail: { color: c.muted, fontSize: 11, marginTop: 4 }, profileBio: { color: c.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 14 }, profileRule: { width: '100%', height: 1, backgroundColor: c.border, marginVertical: 17 }, profileLine: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }, profileLabel: { color: c.muted, fontSize: 11 }, profileValue: { color: c.greenDark, fontSize: 10, fontWeight: '700' },
  privacyNote: { backgroundColor: c.paleMint, padding: 14, borderRadius: 5, marginTop: 14 }, privacyTitle: { color: c.greenDark, fontSize: 11, fontWeight: '800' }, privacyText: { color: c.muted, fontSize: 10, lineHeight: 15, marginTop: 5 }, logoutButton: { alignItems: 'center', padding: 14, marginTop: 8 }, logoutText: { color: c.error, fontSize: 11, fontWeight: '700' },
  appearanceCard: { backgroundColor: c.surface, borderRadius: 6, borderWidth: 1, borderColor: c.border, padding: 14, marginTop: 14 }, appearanceTitle: { color: c.greenDark, fontSize: 11, fontWeight: '800', marginBottom: 6 }, appearanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }, appearanceLabel: { color: c.ink, fontSize: 12, fontWeight: '600' }, langRow: { flexDirection: 'row', gap: 6 }, langOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 5, backgroundColor: c.chip }, langOptionActive: { backgroundColor: c.mint }, langText: { color: c.muted, fontSize: 11, fontWeight: '600' }, langTextActive: { color: c.greenDark, fontWeight: '800' },
});