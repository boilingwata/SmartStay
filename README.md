# SmartStay BMS — Frontend

Building Management System for residents and property managers.
Multi-role (Admin / Staff / Tenant) React SPA backed by Supabase.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui (CSS variable theming, dark mode)
- **Routing**: React Router DOM v7
- **Data fetching**: Supabase JS + TanStack React Query v5
- **State**: Zustand (persisted to localStorage)
- **Forms**: React Hook Form + Zod
- **i18n**: i18next — Vietnamese (primary) / English
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Error tracking**: Sentry

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the `smartstay` schema applied

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# 3. Start dev server
npm run dev
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | ESLint (zero warnings) |
| `npm run preview` | Preview production build |
| `npm run test` | Vitest unit tests |
| `npm run e2e` | Playwright E2E tests |
| `npm run audit:encoding` | Detect mojibake in source files |

## Project Structure

```
src/
├── assets/          Static assets
├── components/      Reusable UI (ui/, shared/, layout/, auth/, …)
├── config/          Role permission config
├── constants/       App-wide constants and route names
├── features/        Domain feature modules
├── hooks/           Custom React hooks
├── i18n/            Translation files (vi/, en/)
├── lib/             Core utilities (Supabase client, enum maps, …)
├── models/          TypeScript data model interfaces
├── routes/          Route definitions and auth guards
├── schemas/         Zod validation schemas
├── services/        Supabase API service layer
├── stores/          Zustand state stores
├── types/           TypeScript type declarations
├── utils/           Pure utility functions
└── views/           Page components (admin/, portal/, auth/, public/, …)
```

## Route Namespaces

| Namespace | Path | Guard |
|---|---|---|
| Public | `/`, `/public/*` | None (redirects authed users) |
| Admin | `/admin/*` | `ProtectedRoute` — any authenticated staff/admin |
| Portal | `/portal/*` | `PortalAuthGuard` — `role === 'Tenant'` only |

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |

See `.env.example` for reference.
