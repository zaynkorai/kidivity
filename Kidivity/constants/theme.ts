import { Platform } from 'react-native';

// ─── Color Palette ───────────────────────────────────────────────
// Playful, kid-friendly, but professional for parents.

export const Colors = {
  // Core brand
  primary: '#6C63FF',       // Purple — main CTA, active elements
  primaryLight: '#A29BFE',  // Light purple — backgrounds, chips
  primaryDark: '#4834D4',   // Dark purple — pressed states

  // Accent
  accent: '#FF6B6B',        // Coral red — like/save, warnings
  accentLight: '#FFADAD',   // Light coral — badges
  success: '#2ED573',       // Green — success states
  warning: '#FECA57',       // Yellow — caution

  // Neutrals
  white: '#FFFFFF',
  background: '#F8F9FE',    // Warm off-white
  surface: '#FFFFFF',       // Cards, modals
  border: '#E8E8F0',        // Subtle borders
  textPrimary: '#1E1E2E',   // Near-black
  textSecondary: '#6B7280', // Muted gray
  textTertiary: '#9CA3AF',  // Placeholder text
  disabled: '#D1D5DB',

  // Category colors (for activity cards)
  categoryPuzzles: '#6C63FF',
  categoryTracing: '#FF6B6B',
  categoryScience: '#00B894',
  categoryArt: '#FDCB6E',
  categoryMath: '#0984e3',
  categoryReading: '#e84393',

  // Dark mode
  dark: {
    background: '#0F0F1A',
    surface: '#1A1A2E',
    border: '#2D2D44',
    textPrimary: '#F0F0F5',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
  },

  light: {
    text: '#1E1E2E',
    background: '#F8F9FE',
    tint: '#6C63FF',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#6C63FF',
  },
  darkTheme: {
    text: '#F0F0F5',
    background: '#0F0F1A',
    tint: '#A29BFE',
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#A29BFE',
  },
} as const;

// ─── Spacing ─────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

// ─── Border Radius ───────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ─── Typography ──────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'SF Pro Rounded',
    mono: 'Menlo',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    rounded: 'System',
    mono: 'monospace',
  },
})!;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ─── Shadows ─────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
