# Kidivity — Product Requirements Document

## 1. Vision

**Kidivity** is a mobile app that uses AI (Google Gemini + image generation) to create fun, educational, printable activities tailored to each child's age and grade. Built for parents and homeschoolers who want quality screen-free learning.

---

## 2. Target Audience

| Persona | Need |
| :--- | :--- |
| **Busy Parent** | Quick 5-minute setup → hours of offline kid activity |
| **Homeschool Parent** | Curriculum-aligned worksheets customized per child |
| **AI-Curious Parent** | Leverage modern AI for creative educational content |

---

## 3. MVP Scope

### 3.1 Kid Profiles
**User Stories:**
- As a parent, I can create a profile for my child with name, age, and grade level
- As a parent, I can manage multiple kid profiles and switch between them
- As a parent, I can edit or delete an existing kid profile

**Data Fields:**
| Field | Type | Required | Example |
| :--- | :--- | :--- | :--- |
| `name` | string | ✅ | "Aisha" |
| `age` | number | ✅ | 6 |
| `grade_level` | enum | ✅ | "1st Grade" |
| `avatar_color` | string | ❌ | "#FF6B6B" |

### 3.2 Activity Generation
**User Stories:**
- As a parent, I can select a category (Puzzles, Tracing, Science, Art, Math, Reading) and specify a topic
- As a parent, I can choose the difficulty level (Easy, Medium, Hard)
- As a parent, I can choose between B&W (print-ready) or Colorful visual styles
- As a parent, I can regenerate an activity if I don't like the result
- As a parent, I can save/bookmark activities I like

**Categories:**
- **Puzzles & Logic**: Mazes, matching, sorting
- **Letters & Tracing**: Letter/shape tracing sheets
- **Science & Discovery**: Facts, experiments, discoveries
- **Art & Creation**: Drawing, coloring, crafts
- **Math & Numbers**: Counting, addition & number games
- **Reading & Stories**: Short tales & reading skills

### 3.3 Activity Display & Printing
**User Stories:**
- As a parent, I can view the generated activity in a clean, kid-friendly layout
- As a parent, I can print the activity or save it as PDF
- As a parent, I can view my saved/bookmarked activities

### 3.4 Authentication & Subscriptions
**User Stories:**
- As a parent, I can sign up / sign in anonymously or with email via Supabase Auth.
- As a parent, my profiles and saved activities sync across devices.
- As a parent, I use **Magic Sparks** to generate activities:
    - **Free**: 1 Magic Spark every 48 hours.
    - **Monthly Pro ($14.99)**: 100 Magic Sparks per month.
    - **Annual Pro ($94.99)**: 10 Magic Sparks per day (300/mo equivalent).

---

## 4. Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Mobile App** | **Flutter** | High performance, expressive UI, single codebase |
| **State Management** | **Riverpod** | Compile-safe state management with provider listening |
| **Routing** | **GoRouter** | Declarative routing with deep linking support |
| **Icons** | Lucide Icons | Clean, vector-based icons for a premium feel |
| **Backend** | **Node.js (Fastify)** | High-throughput custom API layer |
| **Auth / Database** | **Supabase** | Managed Auth, PostgreSQL, and Storage |
| **Subscription** | **RevenueCat** | Robust cross-platform billing and paywall infrastructure |
| **AI — Text/Image** | Google Gemini API | State-of-the-art educational content and visuals |

---

## 5. Design Principles

1. **Playful but professional** — Bright colors and rounded shapes, but using professional vector icons instead of emojis.
2. **Print-first logic** — Activities are optimized for A4/Letter printing with proper margins and contrast.
3. **The 3-Tap Rule** — Users should be able to generate an activity in 3 taps or less from the home screen.
4. **Subscription-ready** — Features are tiered between Free and Pro with a soft-paywall approach.

---

## 6. Success Metrics

| Metric | Target |
| :--- | :--- |
| Daily Active Users | 500+ |
| Activities generated per user/week | 5+ |
| Pro Conversion Rate | 3%+ |
| App Store rating | 4.5+ stars |

