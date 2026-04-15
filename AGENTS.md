# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**SmartStay BMS** is a Building Management System frontend application with multi-role support (Admin/Staff and Tenants). Built with React 18 + TypeScript + Vite.

## Commands

```bash
npm run dev       # Start development server (Vite)
npm run build     # Type-check (tsc -b) + production build
npm run lint      # ESLint (zero warnings tolerance)
npm run preview   # Preview production build
npm run test      # Vitest unit tests
npm run e2e       # Playwright end-to-end tests
```

Run a single test file: `npx vitest run src/path/to/file.test.ts`

## Environment Setup

Requires a `.env.local` file with Supabase credentials:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

## Architecture

### Route Namespaces & Auth Flow

Three namespaces, each with its own auth guard:

1. **Public** (`/`, `/public/*`) — Landing page + auth pages (login, register, forgot-password). `AuthRedirect` in `App.tsx` sends authenticated users to their role-based dashboard.
2. **Admin** (`/admin/*`) — Staff/admin dashboard, guarded by `ProtectedRoute` (`src/routes/ProtectedRoute.tsx`). Redirects unauthenticated users to `/public/login`.
3. **Portal** (`/portal/*`) — Tenant-facing portal, guarded by `PortalAuthGuard` (`src/components/auth/PortalAuthGuard.tsx`). Enforces `role === 'Tenant'` and redirects incomplete profiles to `/portal/onboarding`.

Routes are defined as `RouteObject[]` arrays in `src/routes/adminRoutes.tsx` and `src/routes/portalRoutes.tsx`, then mapped in `App.tsx` via `mapRoutes()`. Legacy routes (e.g. `/rooms/*`) redirect to `/admin/rooms/*` via `LegacyRedirect`.

### Data Flow: Supabase → Service → React Query → UI

- **Supabase client** (`src/lib/supabase.ts`): Uses custom schema `smartstay` (not public). Typed via `src/types/supabase.ts`.
- **Services** (`src/services/`): Each domain has a service file (e.g. `roomService.ts`). Services define row interfaces matching DB columns, call Supabase, and map DB enums to frontend enums via `src/lib/enumMaps.ts`. Use `unwrap()` from `supabaseHelpers.ts` to extract data and throw on error.
- **Enum mapping** (`src/lib/enumMaps.ts`): Central bidirectional mapping (e.g. DB `available` ↔ UI `Vacant`). UI code never sees DB enum values. Each domain has `fromDb`/`toDb` mappers.
- **React Query**: Views call services via `useQuery`/`useMutation`. For building-scoped queries, use `useQueryWithBuilding` hook which auto-injects `activeBuildingId` into the query key and function.

### State Management (Zustand)

Three stores in `src/stores/`, all with `persist` middleware (localStorage):
- **`authStore`** — User session, role (`Admin`/`Staff`/`Tenant`), auth actions. Initializes from Supabase session on app mount.
- **`uiStore`** — Sidebar state, `activeBuildingId` (global building filter), theme (light/dark), language (vi/en).
- **`notificationStore`** — Notification state and counts.

### Multi-building Context

Admin views are scoped to `activeBuildingId` from `uiStore`. The `buildingScoped()` helper in `supabaseHelpers.ts` conditionally applies `.eq('building_id', id)` to Supabase queries. The `useQueryWithBuilding` hook handles this automatically for React Query.

### Key Directories

- `src/views/` — Page components split by role: `admin/`, `portal/`, `auth/`, `public/`, `error/`, `layouts/`
- `src/components/` — Reusable UI components (shadcn-based in `ui/`, shared composites in `shared/`)
- `src/services/` — Supabase-backed API service layer (one file per domain)
- `src/stores/` — Zustand state stores
- `src/schemas/` — Zod validation schemas (used with React Hook Form via `@hookform/resolvers`)
- `src/models/` — TypeScript data model interfaces (frontend-facing, post-enum-mapping)
- `src/hooks/` — Custom hooks (`useQueryWithBuilding`, `useConfirm`, `useCurrency`, `useDebounce`, etc.)
- `src/lib/` — Core utilities: Supabase client, enum maps, query client, helpers
- `src/i18n/` — i18next config with `vi` (primary) and `en` locales, single `common` namespace
- `src/types/` — Supabase generated types, declaration files, shared type definitions
- `src/constants/` — App-wide constants

### Tech Stack

- **UI**: shadcn/ui + Tailwind CSS with CSS variable theming (dark mode via `class` strategy)
- **Fonts**: DM Sans (sans), Syne (display), IBM Plex Mono (mono)
- **Forms**: React Hook Form + Zod schemas (`@hookform/resolvers`)
- **Data fetching**: Supabase JS client + React Query (TanStack Query v5)
- **Routing**: React Router DOM v7
- **Rich text**: TipTap editor
- **Tables**: TanStack React Table
- **Charts**: Recharts
- **Drag & drop**: dnd-kit
- **PDF export**: jsPDF + html2canvas
- **Toasts**: Sonner (bottom-right, rich colors)
- **Icons**: Lucide React

### Conventions

- `@/` path alias resolves to `src/` (configured in `tsconfig.json` and `vite.config.ts`).
- All views are lazy-loaded via `React.lazy()` with `Suspense` fallbacks.
- Vietnamese is the primary UI language — user-facing strings use `i18next` translations.
- The app uses a global `AppProviders` wrapper (`src/components/layout/AppProviders.tsx`) that provides QueryClient, theme application, session expiry overlay, confirm dialog, and toast container.
- CSS theming uses custom properties (e.g. `--primary`, `--background`) with Tailwind utilities mapping to them (e.g. `bg-primary`, `text-foreground`).
