/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#171B18',
    background: '#F5F8F5',
    backgroundElement: '#E5F1E7',
    backgroundSelected: '#D7EBDD',
    textSecondary: '#68746C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export const RoomColors = {
  canvas: '#FFFFFF',
  surface: '#FFFFFF',
  ink: '#171B18',
  muted: '#68746C',
  green: '#418655',
  greenDark: '#418655',
  mint: '#dff5d4',
  paleMint: '#f9f9f9',
  silver: '#f9f9f9',
  border: '#f9f9f9',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;


const lightPalette = {
  canvas: '#FFFFFF',
  surface: '#FFFFFF',
  ink: '#171B18',
  muted: '#68746C',
  green: '#418655',
  greenDark: '#418655',
  mint: '#dff5d4',
  paleMint: '#f9f9f9',
  silver: '#f9f9f9',
  border: '#f9f9f9',
  onGreen: '#FFFFFF',
  onInk: '#FFFFFF',
  white: '#FFFFFF',
  placeholder: '#9AA39D',
  scrim: 'rgba(17, 29, 22, 0.42)',
  errorBg: '#F9E9E7',
  error: '#A3483D',
  errorStrong: '#C0392B',
  sheet: '#F7F8F4',
  avatarBg: '#F4D4C7',
  avatarInk: '#663D31',
  divider: '#EEF0ED',
  outline: '#E6EAE5',
  chip: '#EAF0EA',
  handle: '#C7CEC8',
  soft: '#F3F7F3',
  neutralPill: '#F1F2F1',
  pendingBg: '#F6D76B',
  pendingInk: '#2C2A1D',
  pendingSoft: '#4A4021',
  acceptedBg: '#325D49',
  googleBg: '#F8F9FA',
  googleBorder: '#DADCE0',
  googleText: '#3C4043',
  tabSelected: 'rgba(223, 245, 212, 0.68)',
  tabPressed: 'rgba(223, 245, 212, 0.38)',
};

export type Palette = { [K in keyof typeof lightPalette]: string };

const darkPalette: Palette = {
  canvas: '#121212',
  surface: '#1E1E1E',
  ink: '#E6E1E5',
  muted: '#A8ACA9',
  green: '#7BC68B',
  greenDark: '#7BC68B',
  mint: '#1F3A29',
  paleMint: '#2A2A2A',
  silver: '#2A2A2A',
  border: '#2E2E2E',
  onGreen: '#0B2A15',
  onInk: '#121212',
  white: '#FFFFFF',
  placeholder: '#7C847F',
  scrim: 'rgba(0, 0, 0, 0.6)',
  errorBg: '#3B1F1D',
  error: '#F2B8B5',
  errorStrong: '#F2B8B5',
  sheet: '#232323',
  avatarBg: '#4A3029',
  avatarInk: '#F4D4C7',
  divider: '#2E2E2E',
  outline: '#3A3A3A',
  chip: '#2C2C2C',
  handle: '#4A4A4A',
  soft: '#242424',
  neutralPill: '#2C2C2C',
  pendingBg: '#5C4B12',
  pendingInk: '#FFE9A6',
  pendingSoft: '#E6D08A',
  acceptedBg: '#2E5E43',
  googleBg: '#131314',
  googleBorder: '#8E918F',
  googleText: '#E3E3E3',
  tabSelected: 'rgba(123, 198, 139, 0.18)',
  tabPressed: 'rgba(123, 198, 139, 0.10)',
};

export const RoomPalettes: Record<'light' | 'dark', Palette> = { light: lightPalette, dark: darkPalette };
