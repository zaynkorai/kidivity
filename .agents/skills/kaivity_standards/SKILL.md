---
name: kaivity_standards
description: Core conventions, design theme, and coding standards for the Kaivity app
---

# Kaivity App Standards

When working on the Kaivity application, you MUST follow these strictly defined architectural and stylistic rules to ensure high-quality, maintainable code.

## 1. Clean and Token-Savvy Code
- Write concise, hyper-optimized code.
- Avoid unnecessary boilerplate, redundant comments, or over-engineering.
- Keep components small and focused. 
- Use functional components, modern hooks, and strict TypeScript types.
- **Restricted Files:** NEVER open, modify, or analyze `node_modules` directories or `.env` files under any circumstances.

## 2. No Emojis, Icons Only
- Under absolutely no circumstances should emojis be used in UI text, code comments, or commit messages.
- Always use vector icons (e.g., from `lucide-react-native`, `expo/vector-icons`, etc.).
- Icons should be visually consistent and strictly follow the design system.

## 3. Core Theme Definition
Adhere strictly to the defined constants in `Kaivity/constants/theme.ts`:
- **Core Brand:** Purple (`#E7E1FF`), Rad (`#FECAC3`), Blue (`#8AE3FF`), Yellow (`#FFE3C1`), Orange (`#FF8A00`), Green (`#A2DDC2`)
- **Semantic Mapping:** Orange is `primary` and `primaryDark`, Purple is `primaryLight`
- **Category Colors:** Math (`#8AE3FF`), Reading (`#FF8A00`), Science (`#A2DDC2`), Art (`#FFE3C1`), Tracing (`#FECAC3`), Puzzles (`#E7E1FF`)
- **Typography:** ALWAYS use the Poppins font family (`Poppins_400Regular`, `Poppins_500Medium`, `Poppins_700Bold`), do not use System fonts.
- **Dark Mode:** Supports a dedicated dark theme (`#0F0F1A` background, `#1A1A2E` surface). Ensure all UI components handle light/dark transitions gracefully.

## 4. No AI Slop
- When replying or generating code, do not apologize, do not hallucinate polite filler ("I understand", "Here is your code", etc.).
- Output ONLY the required code, direct answers, or necessary technical steps.
- Token conservation is paramount. Be brief and highly technical.
