/**
 * The source of truth for colour, spacing and content width. DESIGN.md describes these values under
 * friendlier names; a test (__tests__/designTokens-test.ts) fails if the two drift apart.
 */

export const Colors = {
  light: {
    text: '#14202E',
    background: '#F6F5F1',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6EAF0',
    textSecondary: '#5B6573',
    tint: '#1F3A5F',
    onTint: '#FFFFFF',
    accent: '#B8892B',
    border: '#DEDAD0',
    success: '#2F7D4F',
    warning: '#9A6A00',
    danger: '#B23A3A',
  },
  dark: {
    text: '#EEF1F5',
    background: '#0E141B',
    backgroundElement: '#18212B',
    backgroundSelected: '#243142',
    textSecondary: '#9AA6B4',
    tint: '#8FB3E0',
    onTint: '#0E141B',
    accent: '#E0B85A',
    border: '#2A3644',
    success: '#6CC08F',
    warning: '#E2B341',
    danger: '#EF7C7C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
