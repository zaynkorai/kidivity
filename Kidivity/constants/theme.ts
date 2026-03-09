import { Platform } from 'react-native';

// ─── Color Palette ───────────────────────────────────────────────
// Playful, kid-friendly, but professional for parents.

export const Colors = {
  // Brand from Style Guide
  purple: '#E7E1FF',
  rad: '#FECAC3',
  blue: '#8AE3FF',
  yellow: '#FFE3C1',
  orange: '#FF8A00',
  green: '#A2DDC2',

  // Core semantic mapping (incorporating new style guide)
  primary: '#FF8A00',       // Orange — main CTA, active elements (good contrast)
  primaryLight: '#E7E1FF',  // Purple — backgrounds, chips
  primaryDark: '#FF8A00',   // Orange — pressed states
  primaryPurple: '#9B72DA', // Purple CTA color

  // Accent
  accent: '#FECAC3',        // Rad 
  accentLight: '#FFE3C1',   // Yellow
  success: '#A2DDC2',       // Green 
  warning: '#FFE3C1',       // Yellow 

  // Neutrals
  white: '#FFFFFF',
  background: '#FFFFFF',    // Crisp white for playful watermarks
  surface: '#FFFFFF',       // Cards, modals
  border: '#E8E8F0',        // Subtle borders
  textPrimary: '#1E1E2E',   // Near-black
  textSecondary: '#6B7280', // Muted gray
  textTertiary: '#9CA3AF',  // Placeholder text
  disabled: '#D1D5DB',

  // Category colors (for activity cards)
  categoryPuzzles: '#E7E1FF', // purple
  categoryTracing: '#FECAC3', // rad
  categoryScience: '#A2DDC2', // green
  categoryArt: '#FFE3C1',     // yellow
  categoryMath: '#8AE3FF',    // blue
  categoryReading: '#FF8A00', // orange

  // Soft Pastels for Card Backgrounds
  pastelPurple: '#F3EFFF',
  pastelPink: '#FFF0F5',
  pastelPeach: '#FFF3E0',
  pastelYellow: '#FFFBE6',
  pastelMint: '#E8F5E9',
  pastelBlue: '#E3F2FD',

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
    tint: '#FF8A00',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#FF8A00',
  },
  darkTheme: {
    text: '#F0F0F5',
    background: '#0F0F1A',
    tint: '#E7E1FF',
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#E7E1FF',
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
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  full: 9999,
} as const;

// ─── Typography ──────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'Poppins_400Regular',
    serif: 'Georgia',
    rounded: 'Poppins_500Medium',
    mono: 'Menlo',
  },
  default: {
    sans: 'Poppins_400Regular',
    serif: 'serif',
    rounded: 'Poppins_500Medium',
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
} as const;
