import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoomColors } from '@/constants/theme';

type TabButtonProps = TabTriggerSlotProps & {
  icon: {
    android: 'search' | 'add_home' | 'forum' | 'person';
    ios: 'magnifyingglass' | 'house' | 'bubble.left.and.bubble.right' | 'person';
    web: 'search' | 'add_home' | 'forum' | 'person';
  };
  label: string;
};

function TabButton({ isFocused = false, icon, label, style: _style, ...props }: TabButtonProps) {
  const tintColor = isFocused ? RoomColors.greenDark : RoomColors.muted;

  return (
    <Pressable
      {...props}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [styles.tabButton, isFocused && styles.tabButtonSelected, pressed && !isFocused && styles.tabButtonPressed]}>
      <SymbolView name={icon} tintColor={tintColor} size={23} />
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.tabSlot} />
      <TabList
        style={[
          styles.tabBar,
          {
            height: 64 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 6),
          },
        ]}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} label="Keşfet" />
        </TabTrigger>
        <TabTrigger name="explore" href="/explore" asChild>
          <TabButton icon={{ ios: 'house', android: 'add_home', web: 'add_home' }} label="İlan ver" />
        </TabTrigger>
        <TabTrigger name="offers" href="/offers" asChild>
          <TabButton icon={{ ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' }} label="Teklifler" />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabButton icon={{ ios: 'person', android: 'person', web: 'person' }} label="Profil" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1, backgroundColor: RoomColors.canvas },
  tabSlot: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 5,
    backgroundColor: RoomColors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: RoomColors.border,
  },
  tabButton: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 8,
  },
  tabButtonSelected: { backgroundColor: 'rgba(223, 245, 212, 0.68)' },
  tabButtonPressed: { backgroundColor: 'rgba(223, 245, 212, 0.38)' },
  tabLabel: { color: RoomColors.muted, fontSize: 10, fontWeight: '600' },
  tabLabelSelected: { color: RoomColors.greenDark, fontWeight: '800' },
});
