import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRoomData } from '@/components/room-data';
import { RoomColors } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

const green = RoomColors.greenDark;
const ink = RoomColors.ink;
const muted = RoomColors.muted;

export default function ProfileScreen() {
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

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const accessToken = googleResponse.authentication?.accessToken;
      if (accessToken) {
        setGoogleSubmitting(true);
        void (async () => {
          try {
            await loginWithGoogle(accessToken);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Google ile giriş yapılamadı.');
          } finally {
            setGoogleSubmitting(false);
          }
        })();
      }
    } else if (googleResponse?.type === 'error') {
      setError('Google girişi iptal edildi veya bir hata oluştu.');
    }
  }, [googleResponse, loginWithGoogle]);

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
      ...(!isLogin && !firstName.trim() ? ['Ad'] : []),
      ...(!isLogin && !lastName.trim() ? ['Soyad'] : []),
      ...(!email.trim() ? ['E-posta'] : []),
      ...(!password ? ['Şifre'] : []),
      ...(!isLogin && !birthDate.trim() ? ['Doğum tarihi'] : []),
    ];

    if (missingFields.length) {
      setShowRequiredErrors(true);
      setError('');
      setValidationNotice({
        title: 'ⓘ Zorunlu alanlar eksik',
        message: `Lütfen şu alanları doldur: ${missingFields.join(', ')}.`,
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
        title: 'Bilgileri kontrol et',
        message: !emailIsValid
          ? 'Geçerli bir e-posta adresi gir.'
          : password.length < 8
            ? 'Şifre en az 8 karakter olmalı.'
            : 'Doğum tarihini YYYY-AA-GG biçiminde ve geçerli bir tarih olarak gir.',
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
      setError(submitError instanceof Error ? submitError.message : 'İşlem tamamlanamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>HESABIN</Text><Text style={styles.title}>Profilin</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}><Text style={styles.avatarLetters}>{user.first_name[0]}{user.last_name[0]}</Text></View>
            <Text style={styles.profileName}>{user.first_name} {user.last_name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            {!!user.birth_date && <Text style={styles.profileEmail}>Doğum tarihi: {user.birth_date}</Text>}
            {!!user.bio && <Text style={styles.profileBio}>{user.bio}</Text>}
            <View style={styles.profileRule} />
            <View style={styles.profileLine}><Text style={styles.profileLabel}>Hesap durumu</Text><Text style={styles.profileValue}>● Aktif</Text></View>
            <View style={styles.profileLine}><Text style={styles.profileLabel}>İlanların</Text><Text style={styles.profileValue}>Keşfet sekmesinde</Text></View>
          </View>
          <View style={styles.privacyNote}><Text style={styles.privacyTitle}>Güvenli tanışma</Text><Text style={styles.privacyText}>İletişim bilgilerini yalnızca güvendiğin kişilerle paylaş. İlk buluşmanı halka açık bir yerde planla.</Text></View>
          <Pressable style={styles.logoutButton} onPress={() => void logout()}><Text style={styles.logoutText}>Oturumu kapat</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brandMark}><Text style={styles.brandGlyph}>⌂</Text></View>
        <Text style={styles.eyebrow}>ODA ARKADAŞIM</Text>
        <Text style={styles.title}>{isLogin ? 'Tekrar hoş geldin' : 'İyi bir ev, iyi insanlarla başlar...'}</Text>
        <Text style={styles.subtitle}>{isLogin ? 'Hesabına giriş yap ve kaldığın yerden devam et.' : 'Hesabını oluştur, sana uygun ev arkadaşını bul.'}</Text>

        <View style={styles.switchRow} onLayout={(event) => { switchWidth.value = event.nativeEvent.layout.width; }}>
          <Animated.View pointerEvents="none" style={[styles.switchIndicator, switchIndicatorStyle]} />
          <Pressable onPress={() => selectMode(false)} style={styles.switchItem}><Text style={[styles.switchText, !isLogin && styles.switchTextActive]}>Hesap oluştur</Text></Pressable>
          <Pressable onPress={() => selectMode(true)} style={styles.switchItem}><Text style={[styles.switchText, isLogin && styles.switchTextActive]}>Giriş yap</Text></Pressable>
        </View>

        {!isLogin && <View style={styles.nameRow}>
          <View style={styles.nameField}><Text style={styles.fieldLabel}>Ad <Text style={[styles.requiredMark, showRequiredErrors && !firstName.trim() && styles.requiredMarkInvalid]}>*</Text></Text><TextInput value={firstName} onChangeText={setFirstName} placeholder="Adın" placeholderTextColor="#9AA39D" autoCapitalize="words" style={styles.input} /></View>
          <View style={styles.nameField}><Text style={styles.fieldLabel}>Soyad <Text style={[styles.requiredMark, showRequiredErrors && !lastName.trim() && styles.requiredMarkInvalid]}>*</Text></Text><TextInput value={lastName} onChangeText={setLastName} placeholder="Soyadın" placeholderTextColor="#9AA39D" autoCapitalize="words" style={styles.input} /></View>
        </View>}
        <Text style={styles.fieldLabel}>E-posta <Text style={[styles.requiredMark, showRequiredErrors && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) && styles.requiredMarkInvalid]}>*</Text></Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="ornek@mail.com" placeholderTextColor="#9AA39D" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <Text style={styles.fieldLabel}>Şifre <Text style={[styles.requiredMark, showRequiredErrors && (!password || password.length < 8) && styles.requiredMarkInvalid]}>*</Text></Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="En az 8 karakter" placeholderTextColor="#9AA39D" secureTextEntry style={styles.input} />
        {!isLogin && <>
          <Text style={styles.fieldLabel}>Doğum tarihi <Text style={[styles.requiredMark, showRequiredErrors && (!birthDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) && styles.requiredMarkInvalid]}>*</Text></Text>
          <TextInput value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-AA-GG" placeholderTextColor="#9AA39D" keyboardType="numbers-and-punctuation" style={styles.input} />
          <Text style={styles.fieldLabel}>Kendinden bahset <Text style={styles.optional}>(isteğe bağlı)</Text></Text>
          <TextInput value={bio} onChangeText={setBio} placeholder="Yaşam tarzın, ilgi alanların..." placeholderTextColor="#9AA39D" multiline textAlignVertical="top" style={[styles.input, styles.bioInput]} />
        </>}
        {!!error && <Text style={styles.errorText}>{error}</Text>}
        <Pressable disabled={submitting} style={[styles.submitButton, submitting && styles.submitDisabled]} onPress={() => void submit()}><Text style={styles.submitText}>{submitting ? 'Bağlanıyor...' : isLogin ? 'Giriş yap' : 'Hesabımı oluştur'}</Text></Pressable>
        <Pressable style={styles.googleButton} onPress={() => { /* Google OAuth */ }}>
          <Image source={require('../../assets/images/google_logo.png')} style={styles.googleLogo} resizeMode="contain" />
          <Text style={styles.googleText}>Google ile {isLogin ? 'giriş yap' : 'hesap oluştur'}</Text>
        </Pressable>
        <Text style={styles.terms}>Devam ederek kullanım koşullarını ve gizlilik politikasını kabul etmiş olursun.</Text>
      </ScrollView>
      <Modal visible={validationNotice !== null} transparent animationType="fade" onRequestClose={() => setValidationNotice(null)}>
        <View style={styles.validationBackdrop}>
          <View style={styles.validationDialog}>
            <Text style={[styles.validationTitle, validationNotice?.title.startsWith('ⓘ') && styles.validationTitleError]}>{validationNotice?.title}</Text>
            <Text style={styles.validationMessage}>{validationNotice?.message}</Text>
            <Pressable accessibilityRole="button" style={styles.validationButton} onPress={() => setValidationNotice(null)}>
              <Text style={styles.validationButtonText}>Tamam</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: RoomColors.canvas }, content: { padding: 22, paddingBottom: 32 },
  brandMark: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: RoomColors.mint, marginTop: 13, marginBottom: 19 }, brandGlyph: { color: green, fontSize: 27, fontWeight: '700' },
  eyebrow: { color: green, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 }, title: { color: ink, fontSize: 25, fontWeight: '800', marginTop: 7, maxWidth: 315 }, subtitle: { color: muted, fontSize: 12, lineHeight: 18, marginTop: 7, maxWidth: 300 },
  switchRow: { position: 'relative', flexDirection: 'row', backgroundColor: RoomColors.paleMint, padding: 3, borderRadius: 5, marginTop: 22, marginBottom: 17 }, switchIndicator: { position: 'absolute', left: 3, top: 3, bottom: 3, backgroundColor: RoomColors.surface, borderRadius: 3, shadowColor: ink, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }, switchItem: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 3, zIndex: 1 }, switchText: { color: muted, fontSize: 11, fontWeight: '600' }, switchTextActive: { color: green, fontWeight: '800' },
  validationBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(23, 27, 24, 0.38)', padding: 24 }, validationDialog: { width: '100%', maxWidth: 360, backgroundColor: RoomColors.surface, borderRadius: 8, padding: 20 }, validationTitle: { color: ink, fontSize: 16, fontWeight: '800' }, validationTitleError: { color: '#C0392B' }, validationMessage: { color: muted, fontSize: 13, lineHeight: 19, marginTop: 8 }, validationButton: { alignSelf: 'flex-end', backgroundColor: RoomColors.paleMint, borderRadius: 5, paddingHorizontal: 16, paddingVertical: 10, marginTop: 14 }, validationButtonText: { color: green, fontSize: 12, fontWeight: '800' },
  nameRow: { flexDirection: 'row', gap: 9 }, nameField: { flex: 1 }, fieldLabel: { color: ink, fontSize: 11, fontWeight: '700', marginTop: 12, marginBottom: 6 }, requiredMark: { color: '#9AA39D', fontSize: 12, fontWeight: '800' }, requiredMarkInvalid: { color: '#C0392B' }, optional: { color: muted, fontSize: 10, fontWeight: '400' }, input: { minHeight: 46, backgroundColor: RoomColors.surface, borderWidth: 1, borderColor: RoomColors.border, borderRadius: 5, paddingHorizontal: 12, color: ink, fontSize: 12 }, bioInput: { height: 81, paddingTop: 12 },
  submitButton: { height: 49, backgroundColor: green, borderRadius: 5, marginTop: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, submitDisabled: { opacity: 0.65 }, submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }, submitArrow: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, terms: { color: '#8A948E', fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 13, paddingHorizontal: 12 }, errorText: { color: '#A3483D', fontSize: 10, marginTop: 10, lineHeight: 15 },
  googleButton: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#DADCE0', borderRadius: 5, paddingVertical: 11, paddingHorizontal: 20, marginTop: 10, gap: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 }, googleLogo: { width: 18, height: 18 }, googleText: { color: '#3C4043', fontSize: 12, fontWeight: '600' },
  profileCard: { alignItems: 'center', backgroundColor: RoomColors.surface, borderRadius: 6, borderWidth: 1, borderColor: RoomColors.border, padding: 20, marginTop: 22 }, profileAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: RoomColors.mint }, avatarLetters: { color: green, fontSize: 20, fontWeight: '800' }, profileName: { color: ink, fontSize: 18, fontWeight: '800', marginTop: 12 }, profileEmail: { color: muted, fontSize: 11, marginTop: 4 }, profileBio: { color: muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 14 }, profileRule: { width: '100%', height: 1, backgroundColor: RoomColors.border, marginVertical: 17 }, profileLine: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }, profileLabel: { color: muted, fontSize: 11 }, profileValue: { color: green, fontSize: 10, fontWeight: '700' },
  privacyNote: { backgroundColor: RoomColors.paleMint, padding: 14, borderRadius: 5, marginTop: 14 }, privacyTitle: { color: green, fontSize: 11, fontWeight: '800' }, privacyText: { color: muted, fontSize: 10, lineHeight: 15, marginTop: 5 }, logoutButton: { alignItems: 'center', padding: 14, marginTop: 8 }, logoutText: { color: '#A3483D', fontSize: 11, fontWeight: '700' },
});