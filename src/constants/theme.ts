/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0D111A',
    textSecondary: '#64748B',
    background: '#F8F9FC',
    backgroundElement: '#EDF1F7',
    backgroundSelected: '#E2E8F0',
    card: '#FFFFFF',
    border: '#E2E6EE',
    primary: '#E09E00',
    primaryText: '#0D111A',
    accent: '#0E52E6',
    tint: '#E09E00',
    error: '#FF3B30',
    success: '#34C759',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#8F9CAE',
    background: '#0D111A',
    backgroundElement: '#161D2B',
    backgroundSelected: '#243046',
    card: '#161D2B',
    border: '#243046',
    primary: '#FFB800',
    primaryText: '#0D111A',
    accent: '#1D63FF',
    tint: '#FFB800',
    error: '#FF453A',
    success: '#30D158',
  },
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
