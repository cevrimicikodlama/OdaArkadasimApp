import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRoomData, type ListingType } from '@/components/room-data';
import { RoomColors } from '@/constants/theme';

const green = RoomColors.greenDark;
const ink = RoomColors.ink;
const muted = RoomColors.muted;

export default function CreateListingScreen() {
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
      setError(publishError instanceof Error ? publishError.message : 'İlan yayınlanamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YENİ BİR BAŞLANGIÇ</Text>
        <Text style={styles.title}>İlanını oluştur</Text>
        <Text style={styles.subtitle}>Doğru ev arkadaşını bulmak için arayışını paylaş.</Text>

        <Text style={styles.label}>NE ARIYORSUN?</Text>
        <View style={styles.typeRow}>
          <Pressable onPress={() => setType('HAVE_ROOM')} style={[styles.typeOption, type === 'HAVE_ROOM' && styles.typeSelected]}>
            <Text style={styles.typeIcon}>⌂</Text><Text style={[styles.typeTitle, type === 'HAVE_ROOM' && styles.typeTitleSelected]}>Evde odam var</Text>
            <Text style={styles.typeDescription}>Oda arkadaşı arıyorum</Text>
          </Pressable>
          <Pressable onPress={() => setType('NEED_ROOM')} style={[styles.typeOption, type === 'NEED_ROOM' && styles.typeSelected]}>
            <Text style={styles.typeIcon}>⌕</Text><Text style={[styles.typeTitle, type === 'NEED_ROOM' && styles.typeTitleSelected]}>Oda arıyorum</Text>
            <Text style={styles.typeDescription}>Bir eve taşınmak istiyorum</Text>
          </Pressable>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>İLAN DETAYLARI</Text>
          <Text style={styles.fieldLabel}>İlan başlığı</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Örn. Kadıköy'de aydınlık oda" placeholderTextColor="#9AA39D" style={styles.input} maxLength={150} />
          <Text style={styles.fieldLabel}>Açıklama</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Evini, yaşam düzenini ve beklentilerini anlat..." placeholderTextColor="#9AA39D" multiline textAlignVertical="top" style={[styles.input, styles.descriptionInput]} />
          <Text style={styles.fieldLabel}>Konum</Text>
          <View style={styles.locationFields}>
            <TextInput value={city} onChangeText={setCity} placeholder="Şehir" placeholderTextColor="#9AA39D" style={[styles.input, styles.halfInput]} />
            <TextInput value={district} onChangeText={setDistrict} placeholder="İlçe" placeholderTextColor="#9AA39D" style={[styles.input, styles.halfInput]} />
          </View>
          <Text style={styles.fieldLabel}>Aylık kira payı / bütçe</Text>
          <View style={styles.priceField}>
            <TextInput value={price} onChangeText={(value) => setPrice(value.replace(/[^0-9]/g, ''))} placeholder="12.500" placeholderTextColor="#9AA39D" keyboardType="number-pad" style={styles.priceInput} />
            <Text style={styles.currency}>₺ / ay</Text>
          </View>
        </View>

        <View style={styles.noteBox}><Text style={styles.noteMark}>i</Text><Text style={styles.noteText}>İlanın yayınlandıktan sonra gelen teklifleri Teklifler sekmesinden yönetebilirsin.</Text></View>
        {!user && <Text style={styles.errorText}>İlan yayınlamak için Profil sekmesinden giriş yap.</Text>}
        {!!error && <Text style={styles.errorText}>{error}</Text>}
        <Pressable onPress={() => void publish()} disabled={!ready || submitting} style={[styles.publishButton, (!ready || submitting) && styles.publishDisabled]}>
          <Text style={styles.publishText}>{submitting ? 'Yayınlanıyor...' : success ? 'İlanın yayınlandı' : 'İlanı yayınla'}</Text><Text style={styles.publishArrow}>↗</Text>
        </Pressable>
        {success && <Text style={styles.successText}>İlanın Keşfet bölümüne eklendi.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: RoomColors.canvas }, content: { padding: 20, paddingBottom: 32 },
  eyebrow: { color: green, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginTop: 8 }, title: { color: ink, fontSize: 27, fontWeight: '800', marginTop: 5 }, subtitle: { color: muted, fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 310 },
  label: { color: muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.9, marginBottom: 10 }, typeRow: { flexDirection: 'row', gap: 9, marginTop: 21 }, typeOption: { flex: 1, minHeight: 120, backgroundColor: RoomColors.surface, borderWidth: 1, borderColor: RoomColors.border, borderRadius: 6, padding: 13, justifyContent: 'center' }, typeSelected: { borderColor: green, backgroundColor: RoomColors.mint }, typeIcon: { color: green, fontSize: 23, marginBottom: 6 }, typeTitle: { color: ink, fontSize: 12, fontWeight: '800' }, typeTitleSelected: { color: green }, typeDescription: { color: muted, fontSize: 9, marginTop: 4 },
  formSection: { marginTop: 25 }, fieldLabel: { color: ink, fontSize: 11, fontWeight: '700', marginTop: 13, marginBottom: 6 }, input: { minHeight: 46, backgroundColor: RoomColors.surface, borderWidth: 1, borderColor: RoomColors.border, borderRadius: 5, paddingHorizontal: 12, color: ink, fontSize: 12 }, descriptionInput: { height: 100, paddingTop: 12 }, locationFields: { flexDirection: 'row', gap: 9 }, halfInput: { flex: 1 }, priceField: { minHeight: 46, flexDirection: 'row', alignItems: 'center', backgroundColor: RoomColors.surface, borderWidth: 1, borderColor: RoomColors.border, borderRadius: 5, paddingHorizontal: 12 }, priceInput: { flex: 1, color: ink, fontSize: 12, paddingVertical: 10 }, currency: { color: muted, fontSize: 11, fontWeight: '700' },
  noteBox: { flexDirection: 'row', gap: 9, backgroundColor: RoomColors.paleMint, padding: 12, borderRadius: 5, marginTop: 20, alignItems: 'flex-start' }, noteMark: { color: green, fontWeight: '800', fontSize: 13 }, noteText: { color: muted, fontSize: 10, lineHeight: 15, flex: 1 }, publishButton: { height: 49, backgroundColor: green, borderRadius: 5, marginTop: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, publishDisabled: { backgroundColor: RoomColors.silver }, publishText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }, publishArrow: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, successText: { color: green, textAlign: 'center', marginTop: 9, fontSize: 11, fontWeight: '700' }, errorText: { color: '#A3483D', fontSize: 10, lineHeight: 15, marginTop: 10 },
});