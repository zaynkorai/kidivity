# Kidivity — Product Requirements Document

## 1. Vision

**Kidivity** is a mobile app that uses AI (Google Gemini + image generation) to create fun, educational, printable activities tailored to each child's age, grade, and interests. Built for parents and homeschoolers who want quality screen-free learning.

---

## 2. Target Audience

| Persona | Need |
|---|---|
| **Busy Parent** | Quick 5-minute setup → hours of offline kid activity |
| **Homeschool Parent** | Curriculum-aligned worksheets customized per child |
| **AI-Curious Parent** | Leverage modern AI for creative educational content |

---

## 3. MVP Scope (v0.1)

> [!IMPORTANT]
> The MVP ships **three core loops**: create a kid profile → generate an activity → view/print it. Journey Map and monetization are deferred to v0.2+.

### 3.1 Kid Profiles
**User Stories:**
- As a parent, I can create a profile for my child with name, age, grade level, and interests
- As a parent, I can manage multiple kid profiles and switch between them
- As a parent, I can edit or delete an existing kid profile

**Data Fields:**
| Field | Type | Required | Example |
|---|---|---|---|
| `name` | string | ✅ | "Aisha" |
| `age` | number | ✅ | 6 |
| `grade_level` | enum | ✅ | "1st Grade" |
| `interests` | string[] | ✅ | ["Space", "Dinosaurs"] |
| `avatar_color` | string | ❌ | "#FF6B6B" |

### 3.2 Activity Generation
**User Stories:**
- As a parent, I can select a category (Logic, Tracing, Educational, Screen-Free) and specify a topic
- As a parent, I can choose the difficulty level (Easy, Medium, Hard)
- As a parent, I can choose between B&W (print-ready) or Colorful visual styles
- As a parent, I can regenerate an activity if I don't like the result
- As a parent, I can save/bookmark activities I like

**Categories Explained:**
| **Category** | **What It Produces** | **Example** |
|---|---|---|
| **Logic** | Puzzles, patterns, matching | "Find the pattern: 🌟⭐🌟⭐__" |
| **Tracing** | Letter/shape tracing sheets | Dotted uppercase A with arrows |
| **Educational** | Facts, quizzes, reading prompts | "3 fun facts about dinosaurs + quiz" |
| **Drawings** | Step-by-step drawing & art | "Draw a rocket ship step-by-step" |
| **Math** | Counting, addition & math games | "Count the 5 apples and add 2 more" |
| **Coloring** | Beautiful color-in artwork | High-contrast B&W coloring page |
| **Story** | Short tales & reading skills | "A short story about a brave little toaster" |

### 3.3 Activity Display & Printing
**User Stories:**
- As a parent, I can view the generated activity in a clean, kid-friendly layout
- As a parent, I can print the activity or save it as PDF
- As a parent, I can view my saved/bookmarked activities

### 3.4 Authentication
**User Stories:**
- As a parent, I can sign up / sign in with email or social auth via Supabase Auth
- As a parent, my profiles and saved activities sync across devices

---

## 4. Deferred Features (v0.2+)

| Feature | Description | Phase |
|---|---|---|
| **Journey Map** | Weekly calendar to schedule activities per day | v0.2 |
| **Progress Tracking** | Track completed activities per child | v0.2 |
| **Monetization** | Freemium with generation credits + premium subscription | v0.3 |
| **Sharing** | Share activities with other parents | v0.3 |
| **Offline Mode** | Cache generated activities for offline viewing | v0.3 |

---

## 5. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Mobile App** | React Native + Expo 54 | Cross-platform iOS & Android |
| **Routing** | Expo Router (file-based) | Clean navigation with deep links |
| **Icons** | `lucide-react-native` | Clean, customizable vector icons (no emojis) |
| **State Management** | Zustand + AsyncStorage | Simple, fast, persistent local state |
| **Backend / DB** | Node.js (Fastify) + Supabase (PostgreSQL) | Custom API layer with managed DB/Auth |
| **AI — Text** | Google Gemini API (via Fastify Server) | Advanced text generation for activities |
| **AI — Images** | Google Gemini Image API (via Fastify Server) | Visual content for worksheets, age-tailored visual complexity |
| **Printing** | `expo-print` + `expo-sharing` | Native print dialog + PDF sharing |

---

## 6. Design Principles

1. **Playful but professional** — Parents use it, but kids see it. Bright colors, rounded shapes, friendly typography. We use vector icons (`lucide-react-native`) instead of emojis for a cohesive, premium look.
2. **Print-first for activities** — Generated content must look great on paper (proper margins, contrast, sizing). Visuals adapt in complexity based on the child's age/grade level.
3. **3-tap rule** — Any core action (generate activity) should take ≤ 3 taps from the home screen.
4. **Offline-resilient** — Saved activities work without internet. Generation requires connectivity.

---

## 7. Success Metrics

| Metric | Target (3 months post-launch) |
|---|---|
| Daily Active Users | 500+ |
| Activities generated per user/week | 5+ |
| Activities printed/saved per user/week | 2+ |
| App Store rating | 4.5+ stars |
| User retention (Day 7) | 40%+ |
