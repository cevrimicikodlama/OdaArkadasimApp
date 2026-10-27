import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMemo } from 'react';
import type { Palette } from '@/constants/theme';
import { useI18n } from '@/i18n/language-provider';
import { useAppTheme } from '@/theme/theme-provider';

type TabButtonProps = TabTriggerSlotProps & {
  icon: {
    android: 'search' | 'add_home' | 'forum' | 'person';
    ios: 'magnifyingglass' | 'house' | 'bubble.left.and.bubble.right' | 'person';
    web: 'search' | 'add_home' | 'forum' | 'person';
  };
  label: string;
};

function TabButton({ isFocused = false, icon, label, style: _style, ...props }: TabButtonProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tintColor = isFocused ? colors.greenDark : colors.muted;

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
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
          <TabButton icon={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} label={t('tab.discover')} />
        </TabTrigger>
        <TabTrigger name="explore" href="/explore" asChild>
          <TabButton icon={{ ios: 'house', android: 'add_home', web: 'add_home' }} label={t('tab.post')} />
        </TabTrigger>
        <TabTrigger name="offers" href="/offers" asChild>
          <TabButton icon={{ ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' }} label={t('tab.offers')} />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabButton icon={{ ios: 'person', android: 'person', web: 'person' }} label={t('tab.profile')} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  tabs: { flex: 1, backgroundColor: c.canvas },
  tabSlot: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 5,
    backgroundColor: c.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  tabButton: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 8,
  },
  tabButtonSelected: { backgroundColor: c.tabSelected },
  tabButtonPressed: { backgroundColor: c.tabPressed },
  tabLabel: { color: c.muted, fontSize: 10, fontWeight: '600' },
  tabLabelSelected: { color: c.greenDark, fontWeight: '800' },
});
