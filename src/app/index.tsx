import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRoomData, type ListingType, type RoomListing } from '@/components/room-data';
import { RoomColors } from '@/constants/theme';

const green = RoomColors.greenDark;
const ink = RoomColors.ink;
const muted = RoomColors.muted;
const money = (price: number) => `${price.toLocaleString('tr-TR')} ₺`;

export default function DiscoverScreen() {
  const { listings, addOffer, apiError, loading, user } = useRoomData();
  const [selectedType, setSelectedType] = useState<ListingType>('HAVE_ROOM');
  const [selectedListing, setSelectedListing] = useState<RoomListing | null>(null);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const segmentWidth = useSharedValue(0);
  const activeSegment = useSharedValue(0);
  const segmentIndicatorStyle = useAnimatedStyle(() => {
    const itemWidth = Math.max((segmentWidth.value - 9) / 2, 0);
    return {
      width: itemWidth,
      transform: [{ translateX: (itemWidth + 3) * activeSegment.value }],
    };
  });
  const selectListingType = (type: ListingType) => {
    setSelectedType(type);
    activeSegment.value = withTiming(type === 'HAVE_ROOM' ? 0 : 1, { duration: 220 });
  };
  const visibleListings = useMemo(
    () => listings.filter((listing) => {
      const searchableText = `${listing.title} ${listing.description} ${listing.city} ${listing.district}`.toLocaleLowerCase('tr-TR');
      return listing.type === selectedType && listing.status === 'ACTIVE' && searchableText.includes(searchQuery.trim().toLocaleLowerCase('tr-TR'));
    }),
    [listings, searchQuery, selectedType],
  );

  const submitOffer = async () => {
    if (!selectedListing) return;
    setSubmitting(true);
    try {
      await addOffer(selectedListing, message.trim() || 'Merhaba, ilanınızla ilgileniyorum. Tanışabilir miyiz?');
      setSelectedListing(null);
      setMessage('');
      setNotice('Teklifin gönderildi');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Teklif gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View><Text style={styles.eyebrow}>ROOMMATE HUB</Text><Text style={styles.greeting}>Birlikte iyi yaşa</Text></View>
          <Pressable style={styles.locationButton} onPress={() => setNotice('Şehir filtresi yakında')}>
            <Text style={styles.locationPin}>⌖</Text><Text style={styles.locationText}>İstanbul</Text><Text style={styles.chevron}>⌄</Text>
          </Pressable>
        </View>
        {!!apiError && <View style={styles.apiError}><Text style={styles.apiErrorText}>API bağlantısı kurulamadı: {apiError}</Text></View>}
        <View style={styles.introBand}>
          <View style={styles.introCopy}>
            <Text style={styles.introKicker}>YENİ BİR EV, YENİ BİR HİKÂYE</Text>
            <Text style={styles.introTitle}>Sana iyi gelecek evi bul</Text>
            <Text style={styles.introText}>İlanlara göz at, doğru kişiyle tanış.</Text>
          </View>
          <View style={styles.sunMark}>
            <Image source={require('../../assets/images/ev_logo.png')} style={styles.sunLogo} contentFit="contain" />
          </View>
        </View>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Şehir, ilçe veya semt ara" placeholderTextColor="#8A948E" style={styles.searchInput} />
          <Pressable style={styles.filterButton} onPress={() => setNotice('Filtreler yakında')} accessibilityLabel="Filtreler"><Text style={styles.filterGlyph}>☷</Text></Pressable>
        </View>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.sectionTitle}>Sana uygun ilanlar</Text><Text style={styles.sectionSub}>Nasıl bir başlangıç arıyorsun?</Text></View>
          <Text style={styles.resultCount}>{visibleListings.length} ilan</Text>
        </View>
        <View style={styles.segment} onLayout={(event) => { segmentWidth.value = event.nativeEvent.layout.width; }}>
          <Animated.View pointerEvents="none" style={[styles.segmentIndicator, segmentIndicatorStyle]} />
          <Pressable onPress={() => selectListingType('HAVE_ROOM')} style={styles.segmentItem}>
            <Text style={[styles.segmentText, selectedType === 'HAVE_ROOM' && styles.segmentTextActive]}>Oda arıyorum</Text>
          </Pressable>
          <Pressable onPress={() => selectListingType('NEED_ROOM')} style={styles.segmentItem}>
            <Text style={[styles.segmentText, selectedType === 'NEED_ROOM' && styles.segmentTextActive]}>Ev arkadaşı istiyorum</Text>
          </Pressable>
        </View>
        {visibleListings.length ? visibleListings.map((listing) => (
          <View key={listing.id} style={styles.listingCard}>
            <View style={styles.imageWrap}>
              <Image source={listing.image ? { uri: listing.image } : undefined} style={styles.cover} contentFit="cover" transition={180} />
              <View style={styles.imageLabel}><Text style={styles.imageLabelText}>{listing.type === 'HAVE_ROOM' ? 'BOŞ ODA' : 'EV ARAYIŞI'}</Text></View>
              <Pressable style={styles.saveButton} onPress={() => setNotice('İlan kaydedildi')} accessibilityLabel="İlanı kaydet"><Text style={styles.saveGlyph}>♡</Text></Pressable>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.priceLine}>
                <Text style={styles.price}>{money(listing.price)}<Text style={styles.perMonth}> / ay</Text></Text>
                <View style={styles.verified}><Text style={styles.verifiedText}>● Aktif</Text></View>
              </View>
              <Text style={styles.listingTitle}>{listing.title}</Text>
              <Text style={styles.address}>{listing.district}, {listing.city}</Text>
              <Text style={styles.description} numberOfLines={2}>{listing.description}</Text>
              <View style={styles.tagRow}>{listing.tags.map((tag) => <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>)}</View>
              <View style={styles.cardFooter}>
                <View style={styles.ownerRow}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{listing.ownerName.split(' ').map((part) => part[0]).join('')}</Text></View>
                    <View><Text style={styles.ownerName}>{listing.ownerName}</Text><Text style={styles.ownerMeta}>{listing.age ? `${listing.age} yaş · ` : ''}{listing.occupation}</Text></View>
                </View>
                  <Pressable style={styles.offerButton} onPress={() => user ? setSelectedListing(listing) : setNotice('Teklif göndermek için Profil sekmesinden giriş yap.')}><Text style={styles.offerButtonText}>Teklif gönder</Text><Text style={styles.buttonArrow}>↗</Text></Pressable>
              </View>
            </View>
          </View>
        )) : <View style={styles.emptyState}><Text style={styles.emptyTitle}>{loading ? 'İlanlar yükleniyor' : 'Henüz ilan yok'}</Text><Text style={styles.emptyText}>{apiError || 'Bu kategoride yeni ilanlar burada görünecek.'}</Text></View>}
      </ScrollView>
      {!!notice && <Pressable style={styles.toast} onPress={() => setNotice('')}><Text style={styles.toastText}>{notice}  ×</Text></Pressable>}
      <Modal visible={!!selectedListing} transparent animationType="slide" onRequestClose={() => setSelectedListing(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalEyebrow}>İLK ADIMI AT</Text><Text style={styles.modalTitle}>Tanışma mesajın</Text>
            <Text style={styles.modalSubtitle}>{selectedListing?.title}</Text>
            <TextInput value={message} onChangeText={setMessage} placeholder="Kendinden ve neden ilgilendiğinden bahset..." placeholderTextColor="#8A948E" multiline textAlignVertical="top" style={styles.messageInput} />
            <Pressable disabled={submitting} style={[styles.sendButton, submitting && styles.sendDisabled]} onPress={() => void submitOffer()}><Text style={styles.sendButtonText}>{submitting ? 'Gönderiliyor...' : 'Teklifi gönder'}</Text><Text style={styles.buttonArrow}>↗</Text></Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setSelectedListing(null)}><Text style={styles.cancelText}>Vazgeç</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: RoomColors.canvas }, content: { paddingHorizontal: 20, paddingBottom: 28, gap: 16 },
  apiError: { backgroundColor: '#F9E9E7', borderRadius: 4, padding: 10 }, apiErrorText: { color: '#91443B', fontSize: 10, lineHeight: 15 },
  topRow: { paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: green, fontSize: 18, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }, greeting: { color: ink, fontSize: 30, fontWeight: '800', marginTop: 6 },
  locationButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: RoomColors.paleMint, borderRadius: 20 }, locationPin: { color: green, fontSize: 17 }, locationText: { color: ink, fontWeight: '700', fontSize: 12 }, chevron: { color: green, fontSize: 14 },
  introBand: { backgroundColor: RoomColors.mint, minHeight: 144, borderRadius: 7, overflow: 'hidden', padding: 18, flexDirection: 'row', alignItems: 'center' }, introCopy: { flex: 1, zIndex: 1 }, introKicker: { color: RoomColors.greenDark, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 }, introTitle: { color: ink, fontSize: 22, fontWeight: '800', marginTop: 9, maxWidth: 230 }, introText: { color: muted, fontSize: 12, marginTop: 6 },
  sunMark: { width: 72, height: 72, borderRadius: 36, backgroundColor: RoomColors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 4 }, sunLogo: { width: 42, height: 42 },
  searchBox: { height: 48, borderRadius: 6, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderWidth: 1, borderColor: '#E6EAE5' }, searchIcon: { fontSize: 25, color: green, marginRight: 8 }, searchInput: { flex: 1, color: ink, fontSize: 13, paddingVertical: 0 }, filterButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF0EA', borderRadius: 5 }, filterGlyph: { fontSize: 20, color: green },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 3 }, sectionTitle: { color: ink, fontSize: 18, fontWeight: '800' }, sectionSub: { color: muted, fontSize: 11, marginTop: 4 }, resultCount: { color: green, fontWeight: '700', fontSize: 11, paddingBottom: 2 },
  segment: { flexDirection: 'row', backgroundColor: RoomColors.paleMint, borderRadius: 6, padding: 3, gap: 3 }, segmentIndicator: { position: 'absolute', left: 3, top: 3, bottom: 3, backgroundColor: RoomColors.surface, borderRadius: 4, shadowColor: ink, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 }, segmentItem: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 4, paddingHorizontal: 4 }, segmentText: { color: muted, fontSize: 11, fontWeight: '600' }, segmentTextActive: { color: green, fontWeight: '800' },
  listingCard: { backgroundColor: RoomColors.surface, borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: RoomColors.border }, imageWrap: { height: 185, backgroundColor: RoomColors.mint }, cover: { width: '100%', height: '100%' }, imageLabel: { position: 'absolute', left: 12, top: 12, backgroundColor: RoomColors.surface, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 3 }, imageLabelText: { color: green, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 }, saveButton: { position: 'absolute', right: 12, top: 10, width: 33, height: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: RoomColors.surface, borderRadius: 17 }, saveGlyph: { fontSize: 21, color: ink, lineHeight: 23 },
  cardBody: { padding: 14 }, priceLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, price: { color: green, fontSize: 17, fontWeight: '800' }, perMonth: { color: muted, fontSize: 11, fontWeight: '500' }, verified: { backgroundColor: RoomColors.paleMint, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }, verifiedText: { color: green, fontSize: 9, fontWeight: '700' }, listingTitle: { color: ink, fontSize: 15, fontWeight: '800', marginTop: 8 }, address: { color: muted, fontSize: 11, marginTop: 4 }, description: { color: muted, fontSize: 11, lineHeight: 17, marginTop: 9 }, tagRow: { flexDirection: 'row', gap: 6, marginTop: 10 }, tag: { backgroundColor: RoomColors.paleMint, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 5 }, tagText: { color: muted, fontSize: 9, fontWeight: '600' },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#EEF0ED', marginTop: 13, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 }, ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }, avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4D4C7' }, avatarText: { color: '#663D31', fontWeight: '800', fontSize: 10 }, ownerName: { color: ink, fontSize: 10, fontWeight: '800' }, ownerMeta: { color: muted, fontSize: 9, marginTop: 3 }, offerButton: { minHeight: 38, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 11, backgroundColor: green, borderRadius: 4 }, offerButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 10 }, buttonArrow: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  emptyState: { backgroundColor: RoomColors.surface, padding: 22, borderRadius: 6, alignItems: 'center' }, emptyTitle: { color: ink, fontSize: 15, fontWeight: '800' }, emptyText: { color: muted, fontSize: 12, marginTop: 7, textAlign: 'center' },
  toast: { position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: ink, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 5 }, toastText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17, 29, 22, 0.42)' }, modalSheet: { backgroundColor: '#F7F8F4', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 26, borderTopLeftRadius: 12, borderTopRightRadius: 12 }, modalHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#C7CEC8', marginBottom: 20 }, modalEyebrow: { color: green, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }, modalTitle: { color: ink, fontSize: 22, fontWeight: '800', marginTop: 6 }, modalSubtitle: { color: muted, fontSize: 12, marginTop: 5 }, messageInput: { minHeight: 116, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E6E0', borderRadius: 5, padding: 12, color: ink, fontSize: 13, marginTop: 18 }, sendButton: { height: 48, backgroundColor: green, borderRadius: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 13 }, sendDisabled: { opacity: 0.65 }, sendButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }, cancelButton: { alignItems: 'center', padding: 12 }, cancelText: { color: muted, fontSize: 12, fontWeight: '600' },
});
