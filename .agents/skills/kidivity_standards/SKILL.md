---
name: kidivity_standards
description: Core conventions, design theme, and coding standards for the Kidivity app
---

# Kidivity App Standards

When working on the Kidivity application, you MUST follow these strictly defined architectural and stylistic rules to ensure high-quality, maintainable code.

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
Adhere strictly to the defined constants in `Kidivity/constants/theme.ts`:
- **Core Brand:** Primary Purple (`#6C63FF`), Light Purple (`#A29BFE`), Dark Purple (`#4834D4`)
- **Accents:** Coral Red (`#FF6B6B`), Success Green (`#2ED573`), Warning Yellow (`#FECA57`)
- **Neutrals:** Background (`#F8F9FE`), Surface (`#FFFFFF`), Text Primary (`#1E1E2E`)
- **Category Colors:** Logic (`#6C63FF`), Tracing (`#FF6B6B`), Educational (`#00B894`), Screen-Free (`#FDCB6E`)
- **Dark Mode:** Supports a dedicated dark theme (`#0F0F1A` background, `#1A1A2E` surface). Ensure all UI components handle light/dark transitions gracefully.

## 4. No AI Slop
- When replying or generating code, do not apologize, do not hallucinate polite filler ("I understand", "Here is your code", etc.).
- Output ONLY the required code, direct answers, or necessary technical steps.
- Token conservation is paramount. Be brief and highly technical.
