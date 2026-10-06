import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRoomData, type OfferStatus } from '@/components/room-data';
import { RoomColors } from '@/constants/theme';

const green = RoomColors.greenDark;
const ink = RoomColors.ink;
const muted = RoomColors.muted;

export default function OffersScreen() {
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

  const statusLabel: Record<OfferStatus, string> = { PENDING: 'Bekliyor', ACCEPTED: 'Kabul edildi', REJECTED: 'Reddedildi' };
  const updateStatus = async (id: number, status: Exclude<OfferStatus, 'PENDING'>) => {
    try {
      await setOfferStatus(id, status);
      setNotice(status === 'ACCEPTED' ? 'Teklif kabul edildi' : 'Teklif reddedildi');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Teklif güncellenemedi.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>TANIŞMALARIN</Text>
        <Text style={styles.title}>Teklifler</Text>
        <Text style={styles.subtitle}>İlk mesajlar burada, güzel başlangıçlar yakın.</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryBlockPending}>
            <Text style={styles.summaryNumberPending}>{offers.filter((offer) => offer.status === 'PENDING').length}</Text>
            <Text style={styles.summaryLabelPending}>Bekleyen</Text>
          </View>
          <View style={styles.summaryBlockAccepted}>
            <Text style={styles.summaryNumberAccepted}>{offers.filter((offer) => offer.status === 'ACCEPTED').length}</Text>
            <Text style={styles.summaryLabelAccepted}>Olumlu yanıt</Text>
          </View>
        </View>
        <View style={styles.segment} onLayout={(event) => { segmentWidth.value = event.nativeEvent.layout.width; }}>
          <Animated.View pointerEvents="none" style={[styles.segmentIndicator, segmentIndicatorStyle]} />
          <Pressable onPress={() => selectDirection('incoming')} style={styles.segmentItem}>
            <Text style={[styles.segmentText, direction === 'incoming' && styles.segmentTextActive]}>Gelenler</Text>
          </Pressable>
          <Pressable onPress={() => selectDirection('outgoing')} style={styles.segmentItem}>
            <Text style={[styles.segmentText, direction === 'outgoing' && styles.segmentTextActive]}>Gönderilenler</Text>
          </Pressable>
        </View>
        <Text style={styles.listHeading}>{direction === 'incoming' ? 'Sana ulaşanlar' : 'İlk adımı attıkların'}</Text>
        {!user ? (
          <View style={styles.emptyState}><Text style={styles.emptyTitle}>Tekliflerini görmek için giriş yap</Text><Text style={styles.emptyText}>Profil sekmesinden hesabına giriş yapabilir veya yeni bir hesap oluşturabilirsin.</Text></View>
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
                <Pressable style={styles.acceptButton} onPress={() => void updateStatus(offer.id, 'ACCEPTED')}><Text style={styles.acceptText}>Teklifi kabul et</Text></Pressable>
                <Pressable style={styles.rejectButton} onPress={() => void updateStatus(offer.id, 'REJECTED')}><Text style={styles.rejectText}>Reddet</Text></Pressable>
              </View>
            ) : <Text style={styles.offerFootnote}>{direction === 'outgoing' ? 'İlan sahibinden yanıt bekleniyor.' : 'Bu teklif için kararın kaydedildi.'}</Text>}
          </View>
        )) : (
          <View style={styles.emptyState}><Text style={styles.emptyIcon}>↗</Text><Text style={styles.emptyTitle}>Henüz teklif yok</Text><Text style={styles.emptyText}>İlanlara gönderdiğin veya sana gelen teklifler burada listelenecek.</Text></View>
        )}
      </ScrollView>
      {!!notice && <Pressable style={styles.toast} onPress={() => setNotice('')}><Text style={styles.toastText}>{notice}  ×</Text></Pressable>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: RoomColors.canvas }, content: { padding: 20, paddingBottom: 30 },
  eyebrow: { color: green, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginTop: 8 }, title: { color: ink, fontSize: 27, fontWeight: '800', marginTop: 5 }, subtitle: { color: muted, fontSize: 12, marginTop: 6 },
  summaryRow: { minHeight: 92, backgroundColor: '#F3F7F3', borderRadius: 10, marginTop: 20, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10, overflow: 'hidden' }, summaryBlockPending: { flex: 1, minHeight: 72, backgroundColor: '#F6D76B', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' }, summaryBlockAccepted: { flex: 1, minHeight: 72, backgroundColor: '#325D49', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' }, summaryNumberPending: { color: '#2C2A1D', fontWeight: '800', fontSize: 24, textAlign: 'center' }, summaryNumberAccepted: { color: '#FFFFFF', fontWeight: '800', fontSize: 24, textAlign: 'center' }, summaryLabelPending: { color: '#4A4021', fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' }, summaryLabelAccepted: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' }, summaryDecoration: { width: 48, height: 48, borderRadius: 24, backgroundColor: RoomColors.surface, alignItems: 'center', justifyContent: 'center', marginLeft: 6 }, summaryDecorationText: { color: green, fontSize: 28 },
  segment: { flexDirection: 'row', backgroundColor: RoomColors.paleMint, borderRadius: 6, padding: 3, gap: 3, marginTop: 18 }, segmentIndicator: { position: 'absolute', left: 3, top: 3, bottom: 3, backgroundColor: RoomColors.surface, borderRadius: 4, shadowColor: ink, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 }, segmentItem: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }, segmentText: { color: muted, fontSize: 11, fontWeight: '600' }, segmentTextActive: { color: green, fontWeight: '800' }, listHeading: { color: ink, fontSize: 15, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  offerCard: { backgroundColor: RoomColors.surface, borderWidth: 1, borderColor: RoomColors.border, borderRadius: 6, padding: 14, marginBottom: 11 }, offerTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, avatar: { width: 39, height: 39, borderRadius: 20, backgroundColor: RoomColors.silver, alignItems: 'center', justifyContent: 'center' }, avatarOutgoing: { backgroundColor: RoomColors.mint }, avatarText: { color: ink, fontSize: 11, fontWeight: '800' }, personInfo: { flex: 1 }, personName: { color: ink, fontWeight: '800', fontSize: 12 }, listingName: { color: muted, fontSize: 9, marginTop: 4 }, statusPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, backgroundColor: RoomColors.paleMint }, statusText: { color: green, fontSize: 9, fontWeight: '700' }, statusAccepted: { backgroundColor: RoomColors.mint }, statusRejected: { backgroundColor: '#F1F2F1' }, statusAcceptedText: { color: green }, statusRejectedText: { color: muted },
  messageBox: { flexDirection: 'row', backgroundColor: RoomColors.canvas, padding: 11, borderRadius: 4, marginTop: 13, gap: 5 }, quote: { color: RoomColors.green, fontSize: 20, fontWeight: '800', lineHeight: 20 }, message: { color: muted, fontSize: 11, lineHeight: 17, flex: 1 }, actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, acceptButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: green, borderRadius: 4 }, acceptText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' }, rejectButton: { minWidth: 82, minHeight: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F2F1', borderRadius: 4 }, rejectText: { color: muted, fontSize: 10, fontWeight: '700' }, offerFootnote: { color: muted, fontSize: 10, marginTop: 12 },
  emptyState: { backgroundColor: RoomColors.surface, alignItems: 'center', padding: 25, borderRadius: 6, marginTop: 6 }, emptyIcon: { color: green, fontSize: 25 }, emptyTitle: { color: ink, fontSize: 14, fontWeight: '800', marginTop: 8 }, emptyText: { color: muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  toast: { position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: ink, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 5 }, toastText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});