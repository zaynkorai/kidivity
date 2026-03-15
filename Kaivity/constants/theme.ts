import { Platform } from 'react-native';

// ─── Color Palette: "Sunrise Spark & Deep Ocean" ──────────────────
// Warm, tactile, and inviting for kids. Professional and calming for parents.

export const Colors = {
  primary: '#4361EE',       
  primaryLight: '#DDE2FF',  
  primaryDark: '#2B3A8C',   
  secondary: '#FFB703',     
  
  // Accent & Feedback: Highly visible but avoiding the "system error" anxiety
accent:  '#FF9F1C', // Vibrant Amber/Orange (Energetic & Friendly)
  success: '#4CD137', // Bright Lime (Positive & Rewarding)
  warning: '#FDCB6E', // Soft Gold (Cautionary but not scary)
  danger:  '#FF4757', // Watermelon Red (Urgent but playful)
categories: {
    puzzles: { accent: '#FF9F1C', pastel: '#FFF4E6' }, // Warm Orange
    tracing: { accent: '#4ECDC4', pastel: '#E6F7F6' }, // Soft Teal
    science: { accent: '#A06CD5', pastel: '#F3EBF9' }, // Playful Purple
    art:     { accent: '#FF6B6B', pastel: '#FFEBEB' }, // Soft Red/Pink
    math:    { accent: '#4361EE', pastel: '#E8EDFF' }, // Royal Blue
    reading: { accent: '#6AB04C', pastel: '#F0F7ED' }, // Leaf Green
  },

  // Activity Difficulty Colors: Moved away from standard traffic lights for better accessibility
  difficulty: {
    easy: '#4ECDC4',   // Mint/Ocean (Calm, approachable)
    medium: '#FFE66D', // Sunny (Requires some energy)
    hard: '#FF6B6B',   // Coral (High energy, challenging)
  },

  // Neutrals: Warm-tinted in light mode for a paper-like feel
  white: '#FFFFFF',
  background: '#FDFDFD',    // Off-white with a tiny hint of warmth, less clinical
  surface: '#FFFFFF',
  border: '#EAECEE',        // Very soft gray
  textLight: '#FFFFFF',
  textPrimary: '#1a2837ff',   // Deep Navy/Slate instead of black, softer on developing eyes
  textSecondary: '#515a5bff', // Muted slate
  textTertiary: '#BDC3C7',
  disabled: '#D5D8DC',

  // Functional: Semantic overlays and washes
  overlayBackground: 'rgba(0, 0, 0, 0.45)', // For modal backdrops
  overlaySubtle: 'rgba(0, 0, 0, 0.15)',     // For dropdown overlays
  surfaceWash: 'rgba(255, 255, 255, 0.6)',  // For subtle white overlays
  vibrantWash: 'rgba(255, 255, 255, 0.18)', // For card highlights
  shadowColor: 'rgba(0, 0, 0, 0.08)',

  // Avatar/Profile Palettes
  avatar: [
    '#FF8A00', '#FECAC3', '#A2DDC2', '#FFE3C1', '#8AE3FF', '#E7E1FF',
    '#FD79A8', '#00CEC9', '#E17055', '#0984E3', '#55A3E8'
  ],

  // UI Themes
  dark: {
    background: '#0B132B',  // Deep Ocean Navy - calming, great for evening use
    surface: '#1C2541',     // Elevated marine cards
    border: '#3A506B',
    textPrimary: '#F8FAFC', // Crisp ice white for readability
    textSecondary: '#AAB7B8',
    textTertiary: '#7F8C8D',
    text: '#F8FAFC',
    tint: '#FF6B6B',        // Coral pops beautifully against the deep navy
    icon: '#AAB7B8',
    tabIconDefault: '#7F8C8D',
    tabIconSelected: '#FF6B6B',
  },
  light: {
    background: '#FDFDFD',
    surface: '#FFFFFF',
    border: '#EAECEE',
    textPrimary: '#2C3E50',
    textSecondary: '#7F8C8D',
    textTertiary: '#BDC3C7',
    text: '#2C3E50',
    tint: '#FF6B6B',
    icon: '#7F8C8D',
    tabIconDefault: '#BDC3C7',
    tabIconSelected: '#FF6B6B',
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
    medium: 'Poppins_500Medium',
    bold: 'Poppins_700Bold',
    serif: 'Poppins_400Regular',
    rounded: 'Poppins_500Medium',
    mono: 'Poppins_400Regular',
  },
  default: {
    sans: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    bold: 'Poppins_700Bold',
    serif: 'Poppins_400Regular',
    rounded: 'Poppins_500Medium',
    mono: 'Poppins_400Regular',
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
    boxShadow: [{
      offsetX: 0,
      offsetY: 1,
      blurRadius: 2,
      color: 'rgba(0, 0, 0, 0.04)',
    }],
    elevation: 1,
  },
  md: {
    boxShadow: [{
      offsetX: 0,
      offsetY: 2,
      blurRadius: 6,
      color: 'rgba(0, 0, 0, 0.06)',
    }],
    elevation: 2,
  },
  lg: {
    boxShadow: [{
      offsetX: 0,
      offsetY: 4,
      blurRadius: 12,
      color: 'rgba(0, 0, 0, 0.08)',
    }],
    elevation: 4,
  },
} as const;
