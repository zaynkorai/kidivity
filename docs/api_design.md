# Kaivity — API Design

## Overview

The Kaivity project transitioned from **Supabase Edge Functions** to a custom **Fastify backend**. The mobile app and frontend applications communicate directly with Supabase for CRUD operations (via the Supabase JS client with RLS) and call the Fastify server for AI-powered generation.

---

## Fastify Backend

### `POST /api/activities/generate`

**Purpose:** Generates an AI-powered activity for a kid.

**Auth:** Bearer token (Supabase JWT) required.

#### Request Body

```typescript
interface GenerateActivityRequest {
  kid_profile_id: string;      // UUID of the kid
  category: 'puzzles' | 'tracing' | 'science' | 'art' | 'math' | 'reading';
  topic: string;               // e.g. "Dinosaurs"
  difficulty: 'easy' | 'medium' | 'hard';
  style: 'bw' | 'colorful';

  simpleTracingPaths?: boolean;
  coloringBookMode?: boolean;
}
```

#### Response (200 OK)

```typescript
interface GenerateActivityResponse {
  id: string;                  // UUID of created activity
  content: string;             // Markdown-formatted activity text
  image_url: string | null;    // URL to generated image (if applicable)
  category: string;
  topic: string;
  difficulty: string;
  style: string;
  created_at: string;
}
```

#### Error Responses

| Status | Body | When |
|---|---|---|
| 400 | `{ error: "Invalid request data", details: [...] }` | Zod validation failure |
| 401 | `{ error: "Unauthorized" }` | Missing or invalid JWT |
| 403 | `{ error: "Profile not found" }` | Kid profile doesn't belong to user |
| 429 | `{ error: "Daily generation limit reached", used, limit, reset_at }` | Daily limit exceeded (50/day/user) |
| 500 | `{ error: "Failed to generate activity content" }` | AI API error or failure saving to DB |

---

## Gemini Prompt Templates

### System Prompt (All Categories)

```
You are Kaivity, an AI that creates fun, educational activities for children.
You always respond with well-structured, age-appropriate content.
Format your response in clean markdown.

Child Profile:
- Name: {name}
- Age: {age}
- Grade: {grade_level}

Style: {style === 'bw' ? 'Black and white, optimized for printing' : 'Colorful and visually engaging'}
Difficulty: {difficulty}

Historical Feedback to Incorporate:
{formattedFeedbackStrings}
```

### Category-Specific Prompts

**Puzzles:**
```
Create a {difficulty} puzzle activity about "{topic}" for a {age}-year-old ({grade_level}).
Include: the puzzle, clear instructions, and the answer key at the bottom.
Types: mazes, matching, sorting, pattern recognition, simple deduction.
```

**Tracing:**
```
Create a {difficulty} tracing/writing activity about "{topic}" for a {age}-year-old ({grade_level}).
Include: letters or shapes to trace, dotted guidelines, and a fun illustration description.
Describe the layout so it can be hand-drawn or generated as an image.
```

**Science:**
```
Create a {difficulty} science discovery activity about "{topic}" for a {age}-year-old ({grade_level}).
Include: how it works (simple explanation), a mini experiment without special equipment, and amazing science facts.
```

**Art:**
```
Create a {difficulty} art creation activity about "{topic}" for a {age}-year-old ({grade_level}).
Choose one: step-by-step drawing, a coloring page prompt, or a simple craft using common materials.
Include: materials needed (if any), clear steps, and what the final result should look like.
```

**Math:**
```
Create a {difficulty} math and counting activity about "{topic}" for a {age}-year-old ({grade_level}).
Focus on counting, simple addition, or number logic appropriate for their age.
Include: 3-4 simple word problems or counting exercises and an answer key.
```

**Reading:**
```
Create a {difficulty} reading activity about "{topic}" for a {age}-year-old ({grade_level}).
The text length and vocabulary must be strictly tailored to this level.
Include: a short story or passage and 2-3 reading comprehension questions.
```

---

## Rate Limiting

| Action | Limit | Window |
|---|---|---|
| Activity generation | 50 activities | Per user (daily) |
| Profile creation | 10 profiles | Per user (total) |
| API calls (general) | 100 requests | Per minute |

Enforced in the Fastify backend: Activity generation rate limits are implemented via a `checkQuota` helper utilizing the Supabase admin client to count today's generations directly from the DB. General endpoint limits use standard Fastify plugins.
