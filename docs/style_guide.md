# Kidivity Style Guide

This document outlines the core visual identity and design system for the Kidivity app. It serves as the single source of truth for colors and typography, ensuring a cohesive, professional, yet playful experience.

## 1. Color Palette

The color strategy relies on vibrant, kid-friendly pastel/bright colors mixed with accessible contrast principles.

### Brand Colors

- **Purple (Primary)**: `#E7E1FF`
- **Coral (Accent)**: `#FECAC3`
- **Blue**: `#8AE3FF`
- **Yellow**: `#FFE3C1`
- **Orange**: `#FF8A00`
- **Green**: `#A2DDC2`

### Semantic Mappings

Brand colors are mapped to specific semantic roles in `app/lib/core/theme/app_theme.dart`.

## 2. Typography

The application uses **Poppins** exclusively across all platforms. Poppins is a geometric sans-serif typeface that perfectly complements the playful and modern aesthetic of Kidivity.

### Font Weights

- **Regular**: `FontWeight.w400`
- **Medium**: `FontWeight.w500`
- **Bold**: `FontWeight.w700`

---

## 3. General Design Principles

1. **Icons Over Emojis**: Never use emojis in the primary UI. Always use clean vector icons from **Lucide Icons**.
2. **Rounded Corners**: Stick to the defined border radii in `app_theme.dart` (typically `12px` to `24px`) for friendly, soft edges.
3. **Contrast & Legibility**: Ensure textual content remains highly readable. Use darker shades for text over light backgrounds.
4. **Dark Mode Support**: The application explicitly supports a dark background while preserving the bright tint colors to maintain the brand's playful vibe.
