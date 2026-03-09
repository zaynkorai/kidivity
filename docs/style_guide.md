# Kidivity Style Guide

This document outlines the core visual identity and design system for the Kidivity app. It serves as the single source of truth for colors and typography, ensuring a cohesive, professional, yet playful experience.

## 1. Color Palette

The color strategy relies on vibrant, kid-friendly pastel/bright colors mixed with accessible contrast principles.

### Brand Colors

- **Purple**: `#E7E1FF`
- **Rad (Coral/Pink)**: `#FECAC3`
- **Blue**: `#8AE3FF`
- **Yellow**: `#FFE3C1`
- **Orange**: `#FF8A00`
- **Green**: `#A2DDC2`

### Semantic Mappings

To maintain accessibility (e.g., white text on buttons), we distinctively map the brand colors to specific semantic roles in `Kidivity/constants/theme.ts`:

- **Primary / CTAs**: Orange (`#FF8A00`) — Provides strong contrast for active elements and primary buttons.
- **Primary Light / Backgrounds**: Purple (`#E7E1FF`) — Used for subtle background tints and category chips.
- **Success States**: Green (`#A2DDC2`)
- **Accents**: Rad (`#FECAC3`) and Yellow (`#FFE3C1`)

### Category Colors

Each activity domain has a designated color to create visual anchors for users:

- **Math**: Blue (`#8AE3FF`)
- **Reading**: Orange (`#FF8A00`)
- **Science**: Green (`#A2DDC2`)
- **Art**: Yellow (`#FFE3C1`)
- **Tracing**: Rad (`#FECAC3`)
- **Puzzles**: Purple (`#E7E1FF`)

---

## 2. Typography

The application uses **Poppins** exclusively across all platforms. Poppins is a geometric sans-serif typeface that perfectly complements the playful and modern aesthetic of Kidivity.

### Font Family & Weights

- **Regular Text**: `Poppins_400Regular` (sans)
- **Rounded/Medium Elements**: `Poppins_500Medium` (rounded/medium)
- **Headings/Bold Elements**: `Poppins_700Bold` (bold)

> **Implementation Note**: Do not use default iOS or Android system fonts. The exact `expo-google-fonts/poppins` package is integrated in the root layout (`_layout.tsx`) and mapped in `Kidivity/constants/theme.ts`.

---

## 3. General Design Principles

1. **Icons Over Emojis**: Never use emojis. Always use clean vector icons from libraries like `lucide-react-native`.
2. **Rounded Corners**: Stick to the defined border radii in `theme.ts` (`8px` to `full`) for friendly, soft edges.
3. **Contrast & Legibility**: Ensure textual content remains highly readable. Use darker shades (`textPrimary: #1E1E2E`, `textSecondary: #6B7280`) over light backgrounds.
4. **Dark Mode Support**: The application explicitly supports a dark background (`#0F0F1A`) while preserving the bright tint colors to maintain the brand's playful vibe even in low light.
