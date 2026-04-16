# Kidivity — API Design

## Overview

Kidivity utilizes a custom **Fastify (Node.ts) backend**. The mobile app communicates with Supabase for data persistence (via RLS) and calls the Fastify server for AI-powered activity generation and subscription management logic.

---

## Fastify Backend

### `POST /api/activities/generate`

**Purpose:** Generates an AI-powered activity for a kid.

**Auth:** Bearer token (Supabase JWT) required.

#### Request Body (Zod Validated)

```typescript
interface GenerateActivityRequest {
  kid_profile_id: string;      // UUID of the kid
  category: string;            // e.g. "math", "reading"
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
  image_url: string | null;    // URL to generated image
  category: string;
  topic: string;
}
```

#### Error Responses

| Status | Body | When |
| :--- | :--- | :--- |
| 400 | `{ error: "Invalid request data", details: [...] }` | Zod validation failure |
| 401 | `{ error: "Unauthorized" }` | Missing or invalid JWT |
| 429 | `{ error: "Daily generation limit reached" }` | Quota exceeded (Free tier) |
| 500 | `{ error: "Failed to generate" }` | AI API error |

---

## Rate Limiting (Quotas)

| Tier | Generation Limit |
| :--- | :--- |
| **Free** | 5 activities / day |
| **Pro** | Unlimited activities |

Quota enforcement is handled in `server/src/services/quota.service.ts` by counting the user's records in the `activities` table for the current 24-hour period.

---

## Promotion to Production

API endpoints are hosted at `https://kids.zaynkorai.com` (as defined in `Env.apiUrl`).
