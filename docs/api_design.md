# Kidivity — API Design

## Overview

All API calls go through **Supabase Edge Functions** to keep API keys server-side. The mobile app communicates with Supabase directly for CRUD operations (via the Supabase JS client with RLS) and calls Edge Functions for AI-powered generation.

---

## Edge Functions

### `POST /functions/v1/generate-activity`

**Purpose:** Generates an AI-powered activity for a kid.

**Auth:** Bearer token (Supabase JWT) required.

#### Request Body

```typescript
interface GenerateActivityRequest {
  kid_profile_id: string;      // UUID of the kid
  category: 'logic' | 'tracing' | 'educational' | 'screen-free';
  topic: string;               // e.g. "Dinosaurs"
  difficulty: 'easy' | 'medium' | 'hard';
  style: 'bw' | 'colorful';
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
| 400 | `{ error: "Invalid category" }` | Validation failure |
| 401 | `{ error: "Unauthorized" }` | Missing or invalid JWT |
| 403 | `{ error: "Profile not found" }` | Kid profile doesn't belong to user |
| 429 | `{ error: "Rate limit exceeded" }` | Too many generations (>20/hour) |
| 500 | `{ error: "Generation failed" }` | AI API error |

#### Implementation (Edge Function)

```typescript
// supabase/functions/generate-activity/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Authenticate
  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader! } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  // 2. Parse & validate request
  const body = await req.json()
  // ... validate with Zod schema ...

  // 3. Fetch kid profile (verifies ownership via RLS)
  const { data: kidProfile } = await supabase
    .from('kid_profiles')
    .select('*')
    .eq('id', body.kid_profile_id)
    .single()
  if (!kidProfile) return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 403 })

  // 4. Build Gemini prompt
  const prompt = buildPrompt(kidProfile, body)

  // 5. Call Gemini API
  const geminiResponse = await callGemini(prompt)

  // 6. Optionally generate image
  let imageUrl = null
  if (needsImage(body.category)) {
    imageUrl = await generateAndStoreImage(body, supabase)
  }

  // 7. Store activity in database
  const { data: activity } = await supabase
    .from('activities')
    .insert({
      user_id: user.id,
      kid_profile_id: body.kid_profile_id,
      category: body.category,
      topic: body.topic,
      difficulty: body.difficulty,
      style: body.style,
      content: geminiResponse,
      image_url: imageUrl,
    })
    .select()
    .single()

  // 8. Return result
  return new Response(JSON.stringify(activity), {
    headers: { 'Content-Type': 'application/json' },
  })
})
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

**Logic:**
```
Create a {difficulty} logic puzzle about "{topic}" for a {age}-year-old ({grade_level}).
Include: the puzzle, clear instructions, and the answer key at the bottom.
Types: pattern recognition, sequencing, matching, simple deduction.
```

**Tracing:**
```
Create a {difficulty} tracing/writing activity about "{topic}" for a {age}-year-old ({grade_level}).
Include: letters or shapes to trace, dotted guidelines, and a fun illustration description.
Describe the layout so it can be hand-drawn or generated as an image.
```

**Educational:**
```
Create a {difficulty} educational activity about "{topic}" for a {age}-year-old ({grade_level}).
Include: 3-5 fun facts, a short reading passage, and a mini quiz (3 questions).
Make it engaging and spark curiosity.
```

**Screen-Free:**
```
Create a {difficulty} screen-free activity about "{topic}" for a {age}-year-old ({grade_level}).
Include: materials needed (common household items only), step-by-step instructions,
and learning outcomes. Should take 15-30 minutes.
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
| Activity generation | 20 requests | Per hour |
| Profile creation | 10 profiles | Per user (total) |
| API calls (general) | 100 requests | Per minute |

Enforced in Edge Functions using a simple counter in a `rate_limits` table or Supabase's built-in rate limiting.
