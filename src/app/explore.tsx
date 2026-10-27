import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRoomData, type ListingType } from '@/components/room-data';
import type { Palette } from '@/constants/theme';
import { useI18n } from '@/i18n/language-provider';
import { useAppTheme } from '@/theme/theme-provider';

export default function CreateListingScreen() {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { addListing, user } = useRoomData();
  const [type, setType] = useState<ListingType>('HAVE_ROOM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [price, setPrice] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ready = Boolean(title.trim() && description.trim() && city.trim() && district.trim() && Number(price) > 0 && user);

  const publish = async () => {
    if (!ready) return;
    setSubmitting(true);
    setError('');
    try {
      await addListing({ type, title: title.trim(), description: description.trim(), city: city.trim(), district: district.trim(), price: Number(price) });
      setTitle('');
      setDescription('');
      setCity('');
      setDistrict('');
      setPrice('');
      setSuccess(true);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : t('post.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{t('post.kicker')}</Text>
        <Text style={styles.title}>{t('post.title')}</Text>
        <Text style={styles.subtitle}>{t('post.subtitle')}</Text>

        <Text style={styles.label}>{t('post.whatLooking')}</Text>
        <View style={styles.typeRow}>
          <Pressable onPress={() => setType('HAVE_ROOM')} style={[styles.typeOption, type === 'HAVE_ROOM' && styles.typeSelected]}>
            <Text style={styles.typeIcon}>⌂</Text><Text style={[styles.typeTitle, type === 'HAVE_ROOM' && styles.typeTitleSelected]}>{t('post.haveRoom')}</Text>
            <Text style={styles.typeDescription}>{t('post.haveRoomDesc')}</Text>
          </Pressable>
          <Pressable onPress={() => setType('NEED_ROOM')} style={[styles.typeOption, type === 'NEED_ROOM' && styles.typeSelected]}>
            <Text style={styles.typeIcon}>⌕</Text><Text style={[styles.typeTitle, type === 'NEED_ROOM' && styles.typeTitleSelected]}>{t('post.needRoom')}</Text>
            <Text style={styles.typeDescription}>{t('post.needRoomDesc')}</Text>
          </Pressable>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>{t('post.details')}</Text>
          <Text style={styles.fieldLabel}>{t('post.listingTitle')}</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder={t('post.titlePlaceholder')} placeholderTextColor={colors.placeholder} style={styles.input} maxLength={150} />
          <Text style={styles.fieldLabel}>{t('post.description')}</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder={t('post.descriptionPlaceholder')} placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" style={[styles.input, styles.descriptionInput]} />
          <Text style={styles.fieldLabel}>{t('post.location')}</Text>
          <View style={styles.locationFields}>
            <TextInput value={city} onChangeText={setCity} placeholder={t('post.city')} placeholderTextColor={colors.placeholder} style={[styles.input, styles.halfInput]} />
            <TextInput value={district} onChangeText={setDistrict} placeholder={t('post.district')} placeholderTextColor={colors.placeholder} style={[styles.input, styles.halfInput]} />
          </View>
          <Text style={styles.fieldLabel}>{t('post.budget')}</Text>
          <View style={styles.priceField}>
            <TextInput value={price} onChangeText={(value) => setPrice(value.replace(/[^0-9]/g, ''))} placeholder="12.500" placeholderTextColor={colors.placeholder} keyboardType="number-pad" style={styles.priceInput} />
            <Text style={styles.currency}>{t('post.perMonth')}</Text>
          </View>
        </View>

        <View style={styles.noteBox}><Text style={styles.noteMark}>i</Text><Text style={styles.noteText}>{t('post.note')}</Text></View>
        {!user && <Text style={styles.errorText}>{t('post.signIn')}</Text>}
        {!!error && <Text style={styles.errorText}>{error}</Text>}
        <Pressable onPress={() => void publish()} disabled={!ready || submitting} style={[styles.publishButton, (!ready || submitting) && styles.publishDisabled]}>
          <Text style={styles.publishText}>{submitting ? t('post.publishing') : success ? t('post.published') : t('post.publish')}</Text><Text style={styles.publishArrow}>↗</Text>
        </Pressable>
        {success && <Text style={styles.successText}>{t('post.addedToDiscover')}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.canvas }, content: { padding: 20, paddingBottom: 32 },
  eyebrow: { color: c.greenDark, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginTop: 8 }, title: { color: c.ink, fontSize: 27, fontWeight: '800', marginTop: 5 }, subtitle: { color: c.muted, fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 310 },
  label: { color: c.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.9, marginBottom: 10 }, typeRow: { flexDirection: 'row', gap: 9, marginTop: 21 }, typeOption: { flex: 1, minHeight: 120, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 6, padding: 13, justifyContent: 'center' }, typeSelected: { borderColor: c.greenDark, backgroundColor: c.mint }, typeIcon: { color: c.greenDark, fontSize: 23, marginBottom: 6 }, typeTitle: { color: c.ink, fontSize: 12, fontWeight: '800' }, typeTitleSelected: { color: c.greenDark }, typeDescription: { color: c.muted, fontSize: 9, marginTop: 4 },
  formSection: { marginTop: 25 }, fieldLabel: { color: c.ink, fontSize: 11, fontWeight: '700', marginTop: 13, marginBottom: 6 }, input: { minHeight: 46, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 5, paddingHorizontal: 12, color: c.ink, fontSize: 12 }, descriptionInput: { height: 100, paddingTop: 12 }, locationFields: { flexDirection: 'row', gap: 9 }, halfInput: { flex: 1 }, priceField: { minHeight: 46, flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 5, paddingHorizontal: 12 }, priceInput: { flex: 1, color: c.ink, fontSize: 12, paddingVertical: 10 }, currency: { color: c.muted, fontSize: 11, fontWeight: '700' },
  noteBox: { flexDirection: 'row', gap: 9, backgroundColor: c.paleMint, padding: 12, borderRadius: 5, marginTop: 20, alignItems: 'flex-start' }, noteMark: { color: c.greenDark, fontWeight: '800', fontSize: 13 }, noteText: { color: c.muted, fontSize: 10, lineHeight: 15, flex: 1 }, publishButton: { height: 49, backgroundColor: c.greenDark, borderRadius: 5, marginTop: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, publishDisabled: { backgroundColor: c.silver }, publishText: { color: c.onGreen, fontWeight: '800', fontSize: 13 }, publishArrow: { color: c.onGreen, fontSize: 15, fontWeight: '700' }, successText: { color: c.greenDark, textAlign: 'center', marginTop: 9, fontSize: 11, fontWeight: '700' }, errorText: { color: c.error, fontSize: 10, lineHeight: 15, marginTop: 10 },
});