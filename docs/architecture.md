# Kidivity — System Architecture

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["📱 Mobile App (Flutter)"]
        UI["UI Layer<br/>(Material 3 + Custom Widgets)"]
        NAV["GoRouter<br/>(Declarative Navigation)"]
        STATE["Riverpod Providers<br/>(Auth, Subscription, Profile)"]
        MODELS["Data Models<br/>(Zod-compatible)"]
        
        UI --> NAV
        UI --> STATE
        STATE --> MODELS
    end
    
    subgraph Server["🚀 Custom Backend (Fastify)"]
        API["Fastify API<br/>(Node.ts)"]
        SERVICES["Services<br/>(Gemini, Quotas)"]
        API --> SERVICES
    end
    
    subgraph Supabase["☁️ Persistence (Supabase)"]
        AUTH["Supabase Auth"]
        DB["PostgreSQL<br/>(RLS Enabled)"]
        STORAGE["Storage<br/>(Generated Content)"]
    end
    
    subgraph AI["🤖 AI Services"]
        GEMINI["Google Gemini API<br/>(Text + Vision)"]
    end
    
    Client -->|"JWT Auth"| Server
    Client -->|"Direct CRUD"| Supabase
    Server -->|Sync| Supabase
    Server -->|Generate| GEMINI
```

---

## Directory Structure

```
kidivity/
├── docs/                          ← Documentation
├── app/                           ← Flutter Mobile App
│   ├── lib/
│   │   ├── core/                  ← Shared logic
│   │   │   ├── providers/         ← Riverpod state
│   │   │   ├── theme/             ← Styling & Theme
│   │   │   ├── models/            ← Data classes
│   │   │   └── components/        ← Core UI library
│   │   ├── features/              ← Feature-based screens
│   │   │   ├── home/
│   │   │   ├── generate/
│   │   │   ├── activities/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   ├── auth/
│   │   │   └── subscription/
│   │   ├── router/                ← GoRouter setup
│   │   └── main.dart              ← Entry point
├── server/                        ← Fastify Backend
│   ├── src/
│   │   ├── routes/                ← API Endpoints
│   │   ├── services/              ← Business logic (AI, Quota)
│   │   ├── plugins/               ← Fastify plugins (Auth, Cors)
│   │   └── index.ts               ← Server entry
└── supabase/                      ← Database Migrations & Config
```

---

## Key Architecture Decisions

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| **Framework** | **Flutter** | Native performance and pixel-perfect UI control for educational content. |
| **State management** | **Riverpod** | Highly reactive, compile-safe, and independent of the widget tree. |
| **Backend** | **Fastify** | Custom server allows for complex AI prompt logic and specialized rate limiting. |
| **Auth** | **Supabase Auth** | Industry standard JWT-based auth with social and anonymous support. |
| **Billing** | **RevenueCat** | Simplifies cross-platform subscriptions and entitlement management. |

---

## Security Model

1. **API Keys** — Google Gemini keys are never stored on the client. They reside in the Fastify environment.
2. **Row Level Security** — Database access is guarded by RLS. Users can only read/write their own profiles.
3. **JWT Validation** — The backend validates the Supabase JWT on every request to ensure the user is who they say they are.
4. **Rate Limiting** — Enforced at the server level to prevent AI cost overruns.
