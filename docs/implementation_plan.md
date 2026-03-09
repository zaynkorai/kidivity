# Kidivity — Implementation Plan (Phased Roadmap)

## Goal

Ship a working MVP of Kidivity: a React Native (Expo) app where parents create kid profiles, generate AI-powered educational activities via Google Gemini, and print/save them. This plan breaks the work into 6 phases with clear deliverables.

---

## Phase 0: Foundation (Days 1-2)

### 0.1 Project Cleanup
- [x] Scaffold Expo app with file-based routing *(already done)*
- [ ] Remove default boilerplate screens/components (HelloWave, ParallaxScrollView, etc.)
- [ ] Clean up default tab layout to match our navigation plan
- [ ] Update `app.json` metadata (description, permissions)

### 0.2 Core Dependencies
```bash
pnpm add zustand @react-native-async-storage/async-storage
pnpm add @supabase/supabase-js react-native-url-polyfill
pnpm add expo-print expo-sharing
pnpm add zod
```

### 0.3 Infrastructure
- [ ] Set up Supabase project (create tables per `data_model.md`)
- [ ] Create `lib/supabase.ts` — Supabase client initialization
- [ ] Create store files: `store/authStore.ts`, `store/profileStore.ts`, `store/activityStore.ts`
- [ ] Create `types/` directory with TypeScript interfaces
- [ ] Create `constants/grades.ts` and `constants/interests.ts`

### 0.4 Design System
- [ ] Define color palette in `constants/theme.ts` (playful, kid-friendly)
- [ ] Create base UI components: `Button`, `Card`, `Input`, `Chip`
- [ ] Set up consistent spacing, typography, and border-radius tokens

**✅ Deliverable:** Clean project with stores, Supabase client, and design system ready.

---

## Phase 1: Authentication (Days 3-4)

### 1.1 Auth Screens
- [ ] `(auth)/welcome.tsx` — Landing page with hero + sign-in CTA
- [ ] `(auth)/sign-up.tsx` — Email registration form
- [ ] Auth routing guard: redirect to `(tabs)` if authenticated, to `(auth)` if not

### 1.2 Auth Store
- [ ] `store/authStore.ts` — sign in, sign up, sign out, session listener
- [ ] Auto-create `users` row on first sign-in (via Supabase trigger or app logic)

**✅ Deliverable:** Users can sign up, sign in, and persist sessions.

---

## Phase 2: Kid Profiles (Days 5-7)

### 2.1 Profile Screens
- [ ] `(onboarding)/create-profile.tsx` — First-time profile creation flow
- [ ] `profile/create.tsx` — Add additional kid (modal)
- [ ] `profile/[id]/edit.tsx` — Edit existing kid (modal)

### 2.2 Profile Store + Supabase Sync
- [ ] `store/profileStore.ts` — full CRUD with AsyncStorage persistence
- [ ] Sync local profiles ↔ Supabase on app launch and after mutations
- [ ] Profile switcher component (horizontal avatar scroll)

### 2.3 Home Dashboard
- [ ] `(tabs)/index.tsx` — Kid switcher, quick stats, generate CTA, recent activities
- [ ] Empty state for new users (no activities yet)

**✅ Deliverable:** Parents can create/edit kid profiles and see a clean dashboard.

---

## Phase 3: Activity Generation (Days 8-14)

### 3.1 Edge Function
- [ ] `supabase/functions/generate-activity/index.ts`
- [ ] Gemini API integration with prompt templates (per `api_design.md`)
- [ ] Input validation with Zod
- [ ] Error handling and rate limiting

### 3.2 Generator Screen
- [ ] `(tabs)/generate.tsx` — Category selection → customization → result
- [ ] Category cards UI (Logic, Tracing, Educational, Screen-Free)
- [ ] Topic input (pre-filled from kid's interests)
- [ ] Difficulty picker and style toggle (B&W / Colorful)
- [ ] Loading state with fun animation during generation

### 3.3 Activity Display
- [ ] `activity/[id].tsx` — Full activity detail view
- [ ] Markdown rendering for activity content
- [ ] Action buttons: Save, Print, Regenerate, Share

### 3.4 Activity Store
- [ ] `store/activityStore.ts` — generate, fetch recent, toggle saved
- [ ] Optimistic updates for save/unsave

**✅ Deliverable:** Core loop works — select category → generate → view activity.

---

## Phase 4: Save & Print (Days 15-17)

### 4.1 Saved Activities
- [ ] `(tabs)/saved.tsx` — Grid/list of bookmarked activities
- [ ] Filter by category, kid, date
- [ ] Empty state

### 4.2 Print Flow
- [ ] `print-preview.tsx` — Print-ready layout (A4/Letter sizing)
- [ ] Integration with `expo-print` for native print dialog
- [ ] PDF export via `expo-sharing`

**✅ Deliverable:** Users can save activities and print them or share as PDF.

---

## Phase 5: Polish & Launch Prep (Days 18-21)

### 5.1 UX Polish
- [ ] Smooth transitions and micro-animations
- [ ] Error boundaries and user-friendly error messages
- [ ] Pull-to-refresh on activity lists
- [ ] Haptic feedback on key actions

### 5.2 Settings
- [ ] `(tabs)/settings.tsx` — Profile management, account, preferences
- [ ] Sign out flow

### 5.3 Launch Prep
- [ ] App icon and splash screen (custom, kid-friendly design)
- [ ] App Store screenshots
- [ ] `app.json` — final metadata update
- [ ] TestFlight distribution for beta testing

**✅ Deliverable:** App is polished, tested, and ready for TestFlight.

---

## Verification Plan

### Automated
- `pnpm run lint` — No lint errors
- `pnpm tsc --noEmit` — No type errors
- Test Edge Function locally with `supabase functions serve`

### Manual
- Complete user flow: Sign up → Create profile → Generate activity → Save → Print
- Test on iOS Simulator and physical device via Expo Go
- Verify RLS: User A cannot see User B's data
- Test offline behavior: saved activities viewable without internet
- Test error states: network failure, AI API failure, rate limiting
