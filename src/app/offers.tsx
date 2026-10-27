import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRoomData, type OfferStatus } from '@/components/room-data';
import type { Palette } from '@/constants/theme';
import { useI18n } from '@/i18n/language-provider';
import { useAppTheme } from '@/theme/theme-provider';

export default function OffersScreen() {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { offers, setOfferStatus, user } = useRoomData();
  const [direction, setDirection] = useState<'incoming' | 'outgoing'>('incoming');
  const [notice, setNotice] = useState('');
  const segmentWidth = useSharedValue(0);
  const activeSegment = useSharedValue(0);
  const segmentIndicatorStyle = useAnimatedStyle(() => {
    const itemWidth = Math.max((segmentWidth.value - 9) / 2, 0);
    return {
      width: itemWidth,
      transform: [{ translateX: (itemWidth + 3) * activeSegment.value }],
    };
  });
  const selectDirection = (nextDirection: 'incoming' | 'outgoing') => {
    setDirection(nextDirection);
    activeSegment.value = withTiming(nextDirection === 'incoming' ? 0 : 1, { duration: 220 });
  };
  const visibleOffers = useMemo(() => offers.filter((offer) => offer.direction === direction), [offers, direction]);

  const statusLabel: Record<OfferStatus, string> = { PENDING: t('offers.statusPending'), ACCEPTED: t('offers.statusAccepted'), REJECTED: t('offers.statusRejected') };
  const updateStatus = async (id: number, status: Exclude<OfferStatus, 'PENDING'>) => {
    try {
      await setOfferStatus(id, status);
      setNotice(status === 'ACCEPTED' ? t('offers.accepted') : t('offers.rejected'));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t('offers.updateFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{t('offers.kicker')}</Text>
        <Text style={styles.title}>{t('offers.title')}</Text>
        <Text style={styles.subtitle}>{t('offers.subtitle')}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryBlockPending}>
            <Text style={styles.summaryNumberPending}>{offers.filter((offer) => offer.status === 'PENDING').length}</Text>
            <Text style={styles.summaryLabelPending}>{t('offers.pending')}</Text>
          </View>
          <View style={styles.summaryBlockAccepted}>
            <Text style={styles.summaryNumberAccepted}>{offers.filter((offer) => offer.status === 'ACCEPTED').length}</Text>
            <Text style={styles.summaryLabelAccepted}>{t('offers.positive')}</Text>
          </View>
        </View>
        <View style={styles.segment} onLayout={(event) => { segmentWidth.value = event.nativeEvent.layout.width; }}>
          <Animated.View pointerEvents="none" style={[styles.segmentIndicator, segmentIndicatorStyle]} />
          <Pressable onPress={() => selectDirection('incoming')} style={styles.segmentItem}>
            <Text style={[styles.segmentText, direction === 'incoming' && styles.segmentTextActive]}>{t('offers.incoming')}</Text>
          </Pressable>
          <Pressable onPress={() => selectDirection('outgoing')} style={styles.segmentItem}>
            <Text style={[styles.segmentText, direction === 'outgoing' && styles.segmentTextActive]}>{t('offers.outgoing')}</Text>
          </Pressable>
        </View>
        <Text style={styles.listHeading}>{direction === 'incoming' ? t('offers.incomingHeading') : t('offers.outgoingHeading')}</Text>
        {!user ? (
          <View style={styles.emptyState}><Text style={styles.emptyTitle}>{t('offers.signInTitle')}</Text><Text style={styles.emptyText}>{t('offers.signInText')}</Text></View>
        ) : visibleOffers.length ? visibleOffers.map((offer) => (
          <View key={offer.id} style={styles.offerCard}>
            <View style={styles.offerTop}>
              <View style={[styles.avatar, direction === 'outgoing' && styles.avatarOutgoing]}><Text style={styles.avatarText}>{offer.applicantName.split(' ').map((part) => part[0]).join('')}</Text></View>
              <View style={styles.personInfo}><Text style={styles.personName}>{offer.applicantName}</Text><Text style={styles.listingName}>{offer.listingTitle}</Text></View>
              <View style={[styles.statusPill, offer.status === 'ACCEPTED' && styles.statusAccepted, offer.status === 'REJECTED' && styles.statusRejected]}><Text style={[styles.statusText, offer.status === 'ACCEPTED' && styles.statusAcceptedText, offer.status === 'REJECTED' && styles.statusRejectedText]}>{statusLabel[offer.status]}</Text></View>
            </View>
            <View style={styles.messageBox}><Text style={styles.quote}>“</Text><Text style={styles.message}>{offer.message}</Text></View>
            {direction === 'incoming' && offer.status === 'PENDING' ? (
              <View style={styles.actionRow}>
                <Pressable style={styles.acceptButton} onPress={() => void updateStatus(offer.id, 'ACCEPTED')}><Text style={styles.acceptText}>{t('offers.accept')}</Text></Pressable>
                <Pressable style={styles.rejectButton} onPress={() => void updateStatus(offer.id, 'REJECTED')}><Text style={styles.rejectText}>{t('offers.reject')}</Text></Pressable>
              </View>
            ) : <Text style={styles.offerFootnote}>{direction === 'outgoing' ? t('offers.waiting') : t('offers.decided')}</Text>}
          </View>
        )) : (
          <View style={styles.emptyState}><Text style={styles.emptyIcon}>↗</Text><Text style={styles.emptyTitle}>{t('offers.emptyTitle')}</Text><Text style={styles.emptyText}>{t('offers.emptyText')}</Text></View>
        )}
      </ScrollView>
      {!!notice && <Pressable style={styles.toast} onPress={() => setNotice('')}><Text style={styles.toastText}>{notice}  ×</Text></Pressable>}
    </SafeAreaView>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.canvas }, content: { padding: 20, paddingBottom: 30 },
  eyebrow: { color: c.greenDark, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginTop: 8 }, title: { color: c.ink, fontSize: 27, fontWeight: '800', marginTop: 5 }, subtitle: { color: c.muted, fontSize: 12, marginTop: 6 },
  summaryRow: { minHeight: 92, backgroundColor: c.soft, borderRadius: 10, marginTop: 20, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10, overflow: 'hidden' }, summaryBlockPending: { flex: 1, minHeight: 72, backgroundColor: c.pendingBg, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' }, summaryBlockAccepted: { flex: 1, minHeight: 72, backgroundColor: c.acceptedBg, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' }, summaryNumberPending: { color: c.pendingInk, fontWeight: '800', fontSize: 24, textAlign: 'center' }, summaryNumberAccepted: { color: c.white, fontWeight: '800', fontSize: 24, textAlign: 'center' }, summaryLabelPending: { color: c.pendingSoft, fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' }, summaryLabelAccepted: { color: c.white, fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' }, summaryDecoration: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', marginLeft: 6 }, summaryDecorationText: { color: c.greenDark, fontSize: 28 },
  segment: { flexDirection: 'row', backgroundColor: c.paleMint, borderRadius: 6, padding: 3, gap: 3, marginTop: 18 }, segmentIndicator: { position: 'absolute', left: 3, top: 3, bottom: 3, backgroundColor: c.surface, borderRadius: 4, shadowColor: c.ink, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 }, segmentItem: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }, segmentText: { color: c.muted, fontSize: 11, fontWeight: '600' }, segmentTextActive: { color: c.greenDark, fontWeight: '800' }, listHeading: { color: c.ink, fontSize: 15, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  offerCard: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 6, padding: 14, marginBottom: 11 }, offerTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, avatar: { width: 39, height: 39, borderRadius: 20, backgroundColor: c.silver, alignItems: 'center', justifyContent: 'center' }, avatarOutgoing: { backgroundColor: c.mint }, avatarText: { color: c.ink, fontSize: 11, fontWeight: '800' }, personInfo: { flex: 1 }, personName: { color: c.ink, fontWeight: '800', fontSize: 12 }, listingName: { color: c.muted, fontSize: 9, marginTop: 4 }, statusPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, backgroundColor: c.paleMint }, statusText: { color: c.greenDark, fontSize: 9, fontWeight: '700' }, statusAccepted: { backgroundColor: c.mint }, statusRejected: { backgroundColor: c.neutralPill }, statusAcceptedText: { color: c.greenDark }, statusRejectedText: { color: c.muted },
  messageBox: { flexDirection: 'row', backgroundColor: c.canvas, padding: 11, borderRadius: 4, marginTop: 13, gap: 5 }, quote: { color: c.green, fontSize: 20, fontWeight: '800', lineHeight: 20 }, message: { color: c.muted, fontSize: 11, lineHeight: 17, flex: 1 }, actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, acceptButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: c.greenDark, borderRadius: 4 }, acceptText: { color: c.onGreen, fontSize: 10, fontWeight: '800' }, rejectButton: { minWidth: 82, minHeight: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: c.neutralPill, borderRadius: 4 }, rejectText: { color: c.muted, fontSize: 10, fontWeight: '700' }, offerFootnote: { color: c.muted, fontSize: 10, marginTop: 12 },
  emptyState: { backgroundColor: c.surface, alignItems: 'center', padding: 25, borderRadius: 6, marginTop: 6 }, emptyIcon: { color: c.greenDark, fontSize: 25 }, emptyTitle: { color: c.ink, fontSize: 14, fontWeight: '800', marginTop: 8 }, emptyText: { color: c.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  toast: { position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: c.ink, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 5 }, toastText: { color: c.onInk, fontWeight: '700', fontSize: 12 },
});