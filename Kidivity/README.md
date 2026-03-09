# Kidivity 🎨

AI-powered educational activity generator for kids. Built with React Native (Expo), Supabase, and Google Gemini.

## What is Kidivity?

Kidivity helps parents and homeschoolers generate fun, customizable, and printable educational activities for their children using AI. Create kid profiles, choose a category, and get personalized activities in seconds.

**Categories:** Logic Puzzles · Tracing · Educational · Screen-Free Activities

## Tech Stack

- **Mobile:** React Native + Expo 54 (iOS & Android)
- **Routing:** Expo Router (file-based)
- **State:** Zustand + AsyncStorage
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions, Storage)
- **AI:** Google Gemini API (text) + Image Generation API

## Getting Started

### Prerequisites
- Node.js 18+
- [pnpm](https://pnpm.io/)
- [Expo Go](https://expo.dev/go) app on your phone (for testing)
- Supabase project (see [docs/data_model.md](docs/data_model.md) for schema)

### Setup & Run

```bash
# Clone the repo
git clone https://github.com/your-username/kidivity.git
cd kidivity/Kidivity

# Install dependencies
pnpm install

# Start Expo dev server
pnpm start
```

Scan the QR code with Expo Go to run on your device, or press `i` for iOS Simulator.

### Environment Variables

Create a `.env` file in the `Kidivity/` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
kidivity/
├── docs/                    ← Project documentation
│   ├── project_requirements.md
│   ├── screen_flow.md
│   ├── data_model.md
│   ├── api_design.md
│   └── architecture.md
├── Kidivity/                ← Expo mobile app
│   ├── app/                 ← Screens (file-based routing)
│   ├── components/          ← Reusable UI components
│   ├── store/               ← Zustand state management
│   ├── lib/                 ← Utilities & clients
│   ├── constants/           ← Theme, grades, interests
│   ├── types/               ← TypeScript types
│   └── hooks/               ← Custom React hooks
└── supabase/                ← Database & Edge Functions
```

## Documentation

| Doc | Description |
|---|---|
| [PRD](docs/project_requirements.md) | Product requirements, user stories, MVP scope |
| [Screen Flow](docs/screen_flow.md) | Navigation map & screen-by-screen specs |
| [Data Model](docs/data_model.md) | Supabase schema, RLS policies, Zustand stores |
| [API Design](docs/api_design.md) | Edge Function contracts & Gemini prompts |
| [Architecture](docs/architecture.md) | System diagrams & directory structure |
| [Implementation Plan](docs/implementation_plan.md) | Phased roadmap with deliverables |

## License

MIT
