# Kidivity — Implementation Plan (Phased Roadmap)

## Goal

Ship a working MVP of Kidivity: a React Native (Expo) app where parents create kid profiles, generate AI-powered educational activities via Google Gemini, and print/save them. This plan breaks the work into 6 phases with clear deliverables.

> **Last Updated:** March 9, 2026 — Phase 2 complete, auth + profiles + onboarding all wired up.

---

## Phase 0: Foundation ✅ COMPLETE

### 0.1 Project Cleanup

- [X] Scaffold Expo app with file-based routing
- [X] Remove default boilerplate screens/components (HelloWave, ParallaxScrollView, ThemedText, ThemedView, IconSymbol, Collapsible, ExternalLink)
- [X] Clean up tab layout → 4 tabs (Home, Create, Saved, Settings) with Lucide icons
- [X] Remove default `explore.tsx` and `modal.tsx` screens

### 0.2 Core Dependencies

- [X] `zustand` — state management
- [X] `@react-native-async-storage/async-storage@2.2.0` — local persistence (pinned to Expo 54-compatible version)
- [X] `@supabase/supabase-js` + `react-native-url-polyfill` — backend client
- [X] `expo-print@15.0.8` + `expo-sharing@14.0.8` — printing & PDF (pinned to Expo 54)
- [X] `zod` — validation
- [X] `lucide-react-native` + `react-native-svg@15.12.1` — icons

### 0.3 Infrastructure

- [X] Create `lib/supabase.ts` — lazy-initialized Supabase client (Proxy pattern to avoid SSR crash)
- [X] Create `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [X] Create `store/authStore.ts` — sign in, sign up, sign out, session listener, persisted via AsyncStorage
- [X] Create `store/profileStore.ts` — full CRUD with Supabase sync, auto-select logic, persisted
- [X] Create `store/activityStore.ts` — generate via Edge Function, optimistic save toggle, recent/saved fetch
- [X] Create `types/profile.ts` — `KidProfile`, `CreateKidProfileInput`, `UpdateKidProfileInput`
- [X] Create `types/activity.ts` — `Activity`, `GenerateActivityInput`, difficulty/style types
- [X] Create `constants/grades.ts` — Pre-K through 12th grade enum
- [X] Create `constants/interests.ts` — 20 interests with emoji labels
- [X] Create `constants/categories.ts` — 4 activity categories with colors

### 0.4 Design System

- [X] `constants/theme.ts` — Full design system: color palette (purple primary, coral accent, category colors), spacing, radius, typography, font sizes, font weights, shadow tokens
- [X] `components/ui/Button.tsx` — 4 variants (primary/secondary/outline/ghost), 3 sizes, loading state
- [X] `components/ui/Card.tsx` — 3 variants (elevated/outlined/filled), configurable padding
- [X] `components/ui/Input.tsx` — Label, focus highlight, error display
- [X] `components/ui/Chip.tsx` — Tappable tag with selected state, custom color
- [X] `components/ui/index.ts` — barrel export

### 0.5 Screens Built (ahead of schedule)

- [X] `(tabs)/index.tsx` — Home dashboard: kid profile switcher, generate CTA card, category grid, recent activities list with empty state
- [X] `(tabs)/generate.tsx` — 3-step activity generator: category cards → topic input with interest chips → difficulty/style options → generate button with result display
- [X] `(tabs)/saved.tsx` — Saved activities list with bookmark/delete actions and empty state
- [X] `(tabs)/settings.tsx` — Profile management (edit/delete), account info, about section, sign out with confirmation
- [X] `profile/create.tsx` — Create kid profile modal: avatar color picker, name/age inputs, grade selector, multi-select interests grid with validation
- [X] `_layout.tsx` — Root layout with auth initialization
- [X] `(tabs)/_layout.tsx` — Tab bar with 4 tabs using Lucide icons

### 0.6 Verification

- [X] TypeScript: 0 errors (`npx tsc --noEmit`)
- [X] Lint: 0 errors, 3 warnings (safe useEffect dep-array with Zustand)
- [X] Expo dev server starts without crash
- [X] Metro bundler compiles successfully (2901 modules)
- [X] ⚠️ Supabase project not yet created — `.env` has placeholder values

### Known Issues Resolved

- **`async-storage@3.0.1` crash** — uses `window.localStorage` during SSR → fixed by downgrading to `2.2.0`
- **Supabase eager initialization crash** — `createClient` called at import time during SSR → fixed with lazy Proxy pattern in `lib/supabase.ts`

---

## Phase 1: Authentication (Days 3-4) ✅ COMPLETE

### 1.1 Auth Screens

- [X] `(auth)/_layout.tsx` — Auth group stack navigator
- [X] `(auth)/welcome.tsx` — Landing page with hero, feature pills, inline sign-in form
- [X] `(auth)/sign-up.tsx` — Email registration with password validation + success state
- [X] Auth routing guard: redirect to `(tabs)` if authenticated, to `(auth)` if not

### 1.2 Auth Store

- [X] `store/authStore.ts` — sign in, sign up, sign out, session listener *(built in Phase 0)*
- [X] Auto-create `users` row on first sign-in (via `ensureUserRow` upsert in app logic)
- [X] `hooks/useAuth.ts` — Convenience hook over auth store

### 1.3 Supabase Setup

- [X] SQL migrations: `001_create_users.sql`, `002_create_kid_profiles.sql`, `003_create_activities.sql`
- [X] RLS policies enabled on all tables
- [ ] Create Supabase project (pending — `.env` has placeholder values)
- [ ] Update `.env` with real project URL and anon key

**✅ Deliverable:** Auth screens built, routing guard active, migrations ready to deploy.

---

## Phase 2: Kid Profiles (Days 5-7) ✅ COMPLETE

### 2.1 Profile Screens

- [X] `(onboarding)/_layout.tsx` — Onboarding group stack navigator
- [X] `(onboarding)/create-profile.tsx` — 3-step wizard (Name/Avatar → Age/Grade → Interests) with progress dots + preview card
- [X] `profile/create.tsx` — Add additional kid (modal) *(built in Phase 0)*
- [X] `profile/[id]/edit.tsx` — Edit existing kid (modal) with pre-filled fields + delete option

### 2.2 Profile Store + Supabase Sync

- [X] `store/profileStore.ts` — full CRUD with AsyncStorage persistence *(built in Phase 0)*
- [X] Sync local profiles ↔ Supabase on app launch and after mutations *(built in Phase 0)*
- [X] Profile switcher component (horizontal avatar scroll on Home) *(built in Phase 0)*

### 2.3 Home Dashboard

- [X] `(tabs)/index.tsx` — Kid switcher, quick stats, generate CTA, recent activities *(built in Phase 0)*
- [X] Empty state for new users *(built in Phase 0)*

### 2.4 Navigation Guard

- [X] 3-way routing guard in root layout: unauthenticated → auth, no profiles → onboarding, has profiles → tabs
- [X] Settings Edit button wired to `profile/[id]/edit` modal

**✅ Deliverable:** Parents can create/edit kid profiles, onboarding flow guides new users, and the dashboard shows a clean profile switcher.

---

## Phase 3: Activity Generation (Days 8-14)

### 3.1 Edge Function

- [x] `supabase/functions/generate-activity/index.ts`
- [x] Gemini API integration with prompt templates (per `api_design.md`)
- [x] Input validation with Zod
- [x] Error handling and rate limiting

### 3.2 Generator Screen

- [X] `(tabs)/generate.tsx` — Category selection → customization → result *(built in Phase 0)*
- [X] Category cards UI (Logic, Tracing, Educational, Screen-Free) *(built in Phase 0)*
- [X] Topic input (pre-filled from kid's interests) *(built in Phase 0)*
- [X] Difficulty picker and style toggle (B&W / Colorful) *(built in Phase 0)*
- [ ] Loading state with fun animation during generation

### 3.3 Activity Display

- [ ] `activity/[id].tsx` — Full activity detail view
- [ ] Markdown rendering for activity content
- [ ] Action buttons: Save, Print, Regenerate, Share

### 3.4 Activity Store

- [X] `store/activityStore.ts` — generate, fetch recent, toggle saved *(built in Phase 0)*
- [X] Optimistic updates for save/unsave *(built in Phase 0)*

**✅ Deliverable:** Core loop works — select category → generate → view activity.

---

## Phase 4: Save & Print (Days 15-17)

### 4.1 Saved Activities

- [X] `(tabs)/saved.tsx` — List of bookmarked activities *(built in Phase 0)*
- [ ] Filter by category, kid, date
- [X] Empty state *(built in Phase 0)*

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

- [X] `(tabs)/settings.tsx` — Profile management, account, preferences *(built in Phase 0)*
- [X] Sign out flow *(built in Phase 0)*

### 5.3 Launch Prep

- [ ] App icon and splash screen (custom, kid-friendly design)
- [ ] App Store screenshots
- [ ] `app.json` — final metadata update
- [ ] TestFlight distribution for beta testing

**✅ Deliverable:** App is polished, tested, and ready for TestFlight.

---

## Progress Summary

| Phase                                  | Status      | Items Done | Items Remaining               |
| -------------------------------------- | ----------- | ---------- | ----------------------------- |
| **Phase 0: Foundation**          | ✅ Complete | 35/36      | 1 (Supabase project creation) |
| **Phase 1: Authentication**      | ✅ Complete | 8/10       | 2 (Supabase project + .env)   |
| **Phase 2: Kid Profiles**        | ✅ Complete | 11/11       | 0                             |
| **Phase 3: Activity Generation** | 🟡 Partial  | 5/11       | 6                             |
| **Phase 4: Save & Print**        | 🟡 Partial  | 2/6        | 4                             |
| **Phase 5: Polish & Launch**     | 🟡 Partial  | 2/10       | 8                             |

> **Next step:** Begin Phase 3 — Activity Generation (Edge Function + AI integration).

### Verification (Phase 1)

- [X] TypeScript: 0 errors (`npx tsc --noEmit`)
- [X] Lint: 0 errors, 4 warnings (safe useEffect dep-array with Zustand)
- [X] Auth routing guard redirects correctly based on session state
- [X] Sign-up form validates password length + match
- [X] SQL migrations are idempotent (`IF NOT EXISTS`)

---

## Verification Plan

### Automated

- `pnpm run lint` — No lint errors ✅
- `npx tsc --noEmit` — No type errors ✅
- Test Edge Function locally with `supabase functions serve`

### Manual

- Complete user flow: Sign up → Create profile → Generate activity → Save → Print
- Test on iOS Simulator and physical device via Expo Go
- Verify RLS: User A cannot see User B's data
- Test offline behavior: saved activities viewable without internet
- Test error states: network failure, AI API failure, rate limiting
