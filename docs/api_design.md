# Kidivity — API Design

## Overview

The Kidivity project transitioned from **Supabase Edge Functions** to a custom **Fastify backend**. The mobile app and frontend applications communicate directly with Supabase for CRUD operations (via the Supabase JS client with RLS) and call the Fastify server for AI-powered generation.

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

#### Implementation (Fastify Route)

```typescript
// server/src/routes/activities.ts

import type { FastifyInstance } from 'fastify';
import { getUserClient, getAdminClient } from '../lib/supabase.js';
import { checkQuota } from '../utils/quotas.js';
import { generateSchema } from '../schemas/activity.schema.js';
import { buildSystemInstruction, buildPromptUser, buildImagePrompt } from '../services/prompt.service.js';
import { generateActivityContent } from '../services/ai.service.js';

export default async function activityRoutes(fastify: FastifyInstance) {
    fastify.post('/api/activities/generate', async (request, reply) => {
        // 1. Validate payload with Zod
        const parsed = generateSchema.safeParse(request.body);
        if (!parsed.success) return reply.code(400).send({ error: 'Invalid request data', details: parsed.error.errors });

        const input = parsed.data;

        // 2. Check per-user daily quota via Admin Client
        const quota = await checkQuota(getAdminClient(), request.userId);
        if (!quota.allowed) return reply.code(429).send({ error: 'Daily generation limit reached', ...quota });

        // 3. Fetch kid profile (RLS ensures ownership)
        const supabase = getUserClient(request.accessToken);
        const { data: kidProfile } = await supabase.from('kid_profiles').eq('id', input.kid_profile_id).single();

        // 4. Generate content and image in parallel via ai.service using Gemini APIs
        const { content, image_url } = await generateActivityContent({
            sysInstruction: buildSystemInstruction(kidProfile),
            promptText: buildPromptUser(kidProfile, input),
            imagePrompt: buildImagePrompt(kidProfile, input),
            isVisualCategory: true,
            // ...
        });

        // 5. Save to database & return
        const { data: activity } = await supabase.from('activities').insert({
            user_id: request.userId,
            kid_profile_id: input.kid_profile_id,
            /* ... mapped input data ... */
            content,
            image_url,
        }).select().single();

        return activity;
    });
}
```

---

## Gemini Prompt Templates

### System Prompt (All Categories)

```
You are Kidivity, an AI that creates fun, educational activities for children.
You always respond with well-structured, age-appropriate content.
Format your response in clean markdown.

Child Profile:
- Name: {name}
- Age: {age}
- Grade: {grade_level}
- Interests: {interests}

Style: {style === 'bw' ? 'Black and white, optimized for printing' : 'Colorful and visually engaging'}
Difficulty: {difficulty}
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

## Supabase Client-Side CRUD

These operations use the Supabase JS client directly (no Edge Function needed). RLS policies enforce authorization.

### Kid Profiles

```typescript
// Create
const { data } = await supabase
  .from('kid_profiles')
  .insert({ user_id, name, age, grade_level, interests, avatar_color })
  .select()
  .single()

// Read all for current user
const { data } = await supabase
  .from('kid_profiles')
  .select('*')
  .order('created_at', { ascending: true })

// Update
const { data } = await supabase
  .from('kid_profiles')
  .update({ name, age, grade_level, interests })
  .eq('id', profileId)
  .select()
  .single()

// Delete
await supabase.from('kid_profiles').delete().eq('id', profileId)
```

### Activities

```typescript
// Get recent (last 10)
const { data } = await supabase
  .from('activities')
  .select('*, kid_profiles(name)')
  .order('created_at', { ascending: false })
  .limit(10)

// Get saved
const { data } = await supabase
  .from('activities')
  .select('*, kid_profiles(name)')
  .eq('is_saved', true)
  .order('created_at', { ascending: false })

// Toggle saved
await supabase
  .from('activities')
  .update({ is_saved: !currentValue })
  .eq('id', activityId)

// Delete
await supabase.from('activities').delete().eq('id', activityId)
```

---

## Rate Limiting

| Action | Limit | Window |
|---|---|---|
| Activity generation | 50 activities | Per user (daily) |
| Profile creation | 10 profiles | Per user (total) |
| API calls (general) | 100 requests | Per minute |

Enforced in the Fastify backend: Activity generation rate limits are implemented via a `checkQuota` helper utilizing the Supabase admin client to count today's generations directly from the DB. General endpoint limits use standard Fastify plugins.
