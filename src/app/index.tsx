import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRoomData, type ListingType, type RoomListing } from '@/components/room-data';
import type { Palette } from '@/constants/theme';
import { useI18n } from '@/i18n/language-provider';
import { useAppTheme } from '@/theme/theme-provider';

const money = (price: number, locale: string) => `${price.toLocaleString(locale)} ₺`;

export default function DiscoverScreen() {
  const { colors } = useAppTheme();
  const { t, language } = useI18n();
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      const searchableText = `${listing.title} ${listing.description} ${listing.city} ${listing.district}`.toLocaleLowerCase(locale);
      return listing.type === selectedType && listing.status === 'ACTIVE' && searchableText.includes(searchQuery.trim().toLocaleLowerCase(locale));
    }),
    [listings, searchQuery, selectedType, locale],
  );

  const submitOffer = async () => {
    if (!selectedListing) return;
    setSubmitting(true);
    try {
      await addOffer(selectedListing, message.trim() || t('discover.defaultMessage'));
      setSelectedListing(null);
      setMessage('');
      setNotice(t('discover.offerSent'));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('discover.offerFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View><Text style={styles.eyebrow}>ROOMMATE HUB</Text><Text style={styles.greeting}>{t('discover.greeting')}</Text></View>
          <Pressable style={styles.locationButton} onPress={() => setNotice(t('discover.cityFilterSoon'))}>
            <Text style={styles.locationPin}>⌖</Text><Text style={styles.locationText}>İstanbul</Text><Text style={styles.chevron}>⌄</Text>
          </Pressable>
        </View>
        {!!apiError && <View style={styles.apiError}><Text style={styles.apiErrorText}>{t('discover.apiError', { error: apiError })}</Text></View>}
        <View style={styles.introBand}>
          <View style={styles.introCopy}>
            <Text style={styles.introKicker}>{t('discover.kicker')}</Text>
            <Text style={styles.introTitle}>{t('discover.introTitle')}</Text>
            <Text style={styles.introText}>{t('discover.introText')}</Text>
          </View>
          <View style={styles.sunMark}>
            <Image source={require('../../assets/images/ev_logo.png')} style={styles.sunLogo} contentFit="contain" />
          </View>
        </View>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder={t('discover.searchPlaceholder')} placeholderTextColor={colors.placeholder} style={styles.searchInput} />
          <Pressable style={styles.filterButton} onPress={() => setNotice(t('discover.filtersSoon'))} accessibilityLabel={t('discover.filters')}><Text style={styles.filterGlyph}>☷</Text></Pressable>
        </View>
        <View style={styles.sectionHeading}>
          <View><Text style={styles.sectionTitle}>{t('discover.sectionTitle')}</Text><Text style={styles.sectionSub}>{t('discover.sectionSub')}</Text></View>
          <Text style={styles.resultCount}>{t('discover.count', { n: visibleListings.length })}</Text>
        </View>
        <View style={styles.segment} onLayout={(event) => { segmentWidth.value = event.nativeEvent.layout.width; }}>
          <Animated.View pointerEvents="none" style={[styles.segmentIndicator, segmentIndicatorStyle]} />
          <Pressable onPress={() => selectListingType('HAVE_ROOM')} style={styles.segmentItem}>
            <Text style={[styles.segmentText, selectedType === 'HAVE_ROOM' && styles.segmentTextActive]}>{t('discover.needRoom')}</Text>
          </Pressable>
          <Pressable onPress={() => selectListingType('NEED_ROOM')} style={styles.segmentItem}>
            <Text style={[styles.segmentText, selectedType === 'NEED_ROOM' && styles.segmentTextActive]}>{t('discover.needMate')}</Text>
          </Pressable>
        </View>
        {visibleListings.length ? visibleListings.map((listing) => (
          <View key={listing.id} style={styles.listingCard}>
            <View style={styles.imageWrap}>
              <Image source={listing.image ? { uri: listing.image } : undefined} style={styles.cover} contentFit="cover" transition={180} />
              <View style={styles.imageLabel}><Text style={styles.imageLabelText}>{listing.type === 'HAVE_ROOM' ? t('discover.labelRoom') : t('discover.labelSeeking')}</Text></View>
              <Pressable style={styles.saveButton} onPress={() => setNotice(t('discover.saved'))} accessibilityLabel={t('discover.save')}><Text style={styles.saveGlyph}>♡</Text></Pressable>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.priceLine}>
                <Text style={styles.price}>{money(listing.price, locale)}<Text style={styles.perMonth}>{t('discover.perMonth')}</Text></Text>
                <View style={styles.verified}><Text style={styles.verifiedText}>{t('discover.active')}</Text></View>
              </View>
              <Text style={styles.listingTitle}>{listing.title}</Text>
              <Text style={styles.address}>{listing.district}, {listing.city}</Text>
              <Text style={styles.description} numberOfLines={2}>{listing.description}</Text>
              <View style={styles.tagRow}>{listing.tags.map((tag) => <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>)}</View>
              <View style={styles.cardFooter}>
                <View style={styles.ownerRow}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{listing.ownerName.split(' ').map((part) => part[0]).join('')}</Text></View>
                    <View><Text style={styles.ownerName}>{listing.ownerName}</Text><Text style={styles.ownerMeta}>{listing.age ? t('discover.age', { n: listing.age }) : ''}{listing.occupation}</Text></View>
                </View>
                  <Pressable style={styles.offerButton} onPress={() => user ? setSelectedListing(listing) : setNotice(t('discover.signInToOffer'))}><Text style={styles.offerButtonText}>{t('discover.sendOffer')}</Text><Text style={styles.buttonArrow}>↗</Text></Pressable>
              </View>
            </View>
          </View>
        )) : <View style={styles.emptyState}><Text style={styles.emptyTitle}>{loading ? t('discover.loading') : t('discover.empty')}</Text><Text style={styles.emptyText}>{apiError || t('discover.emptyText')}</Text></View>}
      </ScrollView>
      {!!notice && <Pressable style={styles.toast} onPress={() => setNotice('')}><Text style={styles.toastText}>{notice}  ×</Text></Pressable>}
      <Modal visible={!!selectedListing} transparent animationType="slide" onRequestClose={() => setSelectedListing(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalEyebrow}>{t('discover.modalKicker')}</Text><Text style={styles.modalTitle}>{t('discover.modalTitle')}</Text>
            <Text style={styles.modalSubtitle}>{selectedListing?.title}</Text>
            <TextInput value={message} onChangeText={setMessage} placeholder={t('discover.modalPlaceholder')} placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" style={styles.messageInput} />
            <Pressable disabled={submitting} style={[styles.sendButton, submitting && styles.sendDisabled]} onPress={() => void submitOffer()}><Text style={styles.sendButtonText}>{submitting ? t('discover.sending') : t('discover.sendOfferFull')}</Text><Text style={styles.buttonArrow}>↗</Text></Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setSelectedListing(null)}><Text style={styles.cancelText}>{t('discover.cancel')}</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.canvas }, content: { paddingHorizontal: 20, paddingBottom: 28, gap: 16 },
  apiError: { backgroundColor: c.errorBg, borderRadius: 4, padding: 10 }, apiErrorText: { color: c.error, fontSize: 10, lineHeight: 15 },
  topRow: { paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: c.greenDark, fontSize: 18, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }, greeting: { color: c.ink, fontSize: 30, fontWeight: '800', marginTop: 6 },
  locationButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: c.paleMint, borderRadius: 20 }, locationPin: { color: c.greenDark, fontSize: 17 }, locationText: { color: c.ink, fontWeight: '700', fontSize: 12 }, chevron: { color: c.greenDark, fontSize: 14 },
  introBand: { backgroundColor: c.mint, minHeight: 144, borderRadius: 7, overflow: 'hidden', padding: 18, flexDirection: 'row', alignItems: 'center' }, introCopy: { flex: 1, zIndex: 1 }, introKicker: { color: c.greenDark, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 }, introTitle: { color: c.ink, fontSize: 22, fontWeight: '800', marginTop: 9, maxWidth: 230 }, introText: { color: c.muted, fontSize: 12, marginTop: 6 },
  sunMark: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', marginRight: 4 }, sunLogo: { width: 42, height: 42 },
  searchBox: { height: 48, borderRadius: 6, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderWidth: 1, borderColor: c.border }, searchIcon: { fontSize: 25, color: c.greenDark, marginRight: 8 }, searchInput: { flex: 1, color: c.ink, fontSize: 13, paddingVertical: 0 }, filterButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: c.paleMint, borderRadius: 5 }, filterGlyph: { fontSize: 20, color: c.greenDark },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 3 }, sectionTitle: { color: c.ink, fontSize: 18, fontWeight: '800' }, sectionSub: { color: c.muted, fontSize: 11, marginTop: 4 }, resultCount: { color: c.greenDark, fontWeight: '700', fontSize: 11, paddingBottom: 2 },
  segment: { flexDirection: 'row', backgroundColor: c.paleMint, borderRadius: 6, padding: 3, gap: 3 }, segmentIndicator: { position: 'absolute', left: 3, top: 3, bottom: 3, backgroundColor: c.surface, borderRadius: 4, shadowColor: c.ink, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 }, segmentItem: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 4, paddingHorizontal: 4 }, segmentText: { color: c.muted, fontSize: 11, fontWeight: '600' }, segmentTextActive: { color: c.greenDark, fontWeight: '800' },
  listingCard: { backgroundColor: c.surface, borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: c.border }, imageWrap: { height: 185, backgroundColor: c.mint }, cover: { width: '100%', height: '100%' }, imageLabel: { position: 'absolute', left: 12, top: 12, backgroundColor: c.surface, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 3 }, imageLabelText: { color: c.greenDark, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 }, saveButton: { position: 'absolute', right: 12, top: 10, width: 33, height: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, borderRadius: 17 }, saveGlyph: { fontSize: 21, color: c.ink, lineHeight: 23 },
  cardBody: { padding: 14 }, priceLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, price: { color: c.greenDark, fontSize: 17, fontWeight: '800' }, perMonth: { color: c.muted, fontSize: 11, fontWeight: '500' }, verified: { backgroundColor: c.paleMint, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }, verifiedText: { color: c.greenDark, fontSize: 9, fontWeight: '700' }, listingTitle: { color: c.ink, fontSize: 15, fontWeight: '800', marginTop: 8 }, address: { color: c.muted, fontSize: 11, marginTop: 4 }, description: { color: c.muted, fontSize: 11, lineHeight: 17, marginTop: 9 }, tagRow: { flexDirection: 'row', gap: 6, marginTop: 10 }, tag: { backgroundColor: c.paleMint, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 5 }, tagText: { color: c.muted, fontSize: 9, fontWeight: '600' },
  cardFooter: { borderTopWidth: 1, borderTopColor: c.divider, marginTop: 13, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 }, ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }, avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: c.avatarBg }, avatarText: { color: c.avatarInk, fontWeight: '800', fontSize: 10 }, ownerName: { color: c.ink, fontSize: 10, fontWeight: '800' }, ownerMeta: { color: c.muted, fontSize: 9, marginTop: 3 }, offerButton: { minHeight: 38, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 11, backgroundColor: c.greenDark, borderRadius: 4 }, offerButtonText: { color: c.onGreen, fontWeight: '700', fontSize: 10 }, buttonArrow: { color: c.onGreen, fontSize: 14, fontWeight: '700' },
  emptyState: { backgroundColor: c.surface, padding: 22, borderRadius: 6, alignItems: 'center' }, emptyTitle: { color: c.ink, fontSize: 15, fontWeight: '800' }, emptyText: { color: c.muted, fontSize: 12, marginTop: 7, textAlign: 'center' },
  toast: { position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: c.ink, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 5 }, toastText: { color: c.onInk, fontWeight: '700', fontSize: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: c.scrim }, modalSheet: { backgroundColor: c.sheet, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 26, borderTopLeftRadius: 12, borderTopRightRadius: 12 }, modalHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: c.handle, marginBottom: 20 }, modalEyebrow: { color: c.greenDark, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }, modalTitle: { color: c.ink, fontSize: 22, fontWeight: '800', marginTop: 6 }, modalSubtitle: { color: c.muted, fontSize: 12, marginTop: 5 }, messageInput: { minHeight: 116, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 5, padding: 12, color: c.ink, fontSize: 13, marginTop: 18 }, sendButton: { height: 48, backgroundColor: c.greenDark, borderRadius: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 13 }, sendDisabled: { opacity: 0.65 }, sendButtonText: { color: c.onGreen, fontWeight: '800', fontSize: 13 }, cancelButton: { alignItems: 'center', padding: 12 }, cancelText: { color: c.muted, fontSize: 12, fontWeight: '600' },
});
