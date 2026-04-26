# Architecture

**Analysis Date:** 2026-04-26

## Pattern Overview

**Overall:** Browser-only React SPA with a layered frontend service architecture over direct Supabase access.

**Key Characteristics:**
- Route namespaces separate public, owner/staff, super-admin, and tenant portal experiences from one bundled app.
- UI reads and writes the database directly through a typed Supabase client instead of a separate application server.
- Domain services translate DB rows into frontend models and normalize enum values before UI consumption.
- Global state is split between React Query for async server state and Zustand for persistent client state.

## Layers

**Application Shell:**
- Purpose: boot the app, wire providers, initialize telemetry, and start routing.
- Location: `src/main.tsx`, `src/App.tsx`, `src/components/layout/AppProviders.tsx`
- Contains: root render, router tree, query client provider, toasts, theme and language side effects
- Depends on: routing, stores, i18n, Sentry
- Used by: entire application

**Route and Guard Layer:**
- Purpose: define navigable namespaces and access control.
- Location: `src/routes/*.tsx`, `src/components/auth/PortalAuthGuard.tsx`
- Contains: `RouteObject[]`, redirects, role checks, onboarding gating
- Depends on: auth store and layout components
- Used by: `src/App.tsx`

**View Layer:**
- Purpose: compose screens, trigger queries and mutations, and render domain UIs.
- Location: `src/views/**`, feature-heavy components under `src/components/**`
- Contains: page components, wizards, tables, dashboards, modals
- Depends on: hooks, services, shared UI components, stores
- Used by: route definitions

**Service Layer:**
- Purpose: own Supabase interactions and map DB shapes into frontend-facing models.
- Location: `src/services/*.ts`
- Contains: domain CRUD, RPC calls, auth-aware flows, storage calls
- Depends on: `src/lib/supabase.ts`, enum mappers, helpers, generated types
- Used by: views, hooks, and sometimes stores

**Model / Utility Layer:**
- Purpose: centralize reusable types, enum transforms, presentation helpers, and validation schemas.
- Location: `src/models/`, `src/lib/`, `src/schemas/`, `src/utils/`, `src/types/`
- Contains: UI models, mapping functions, Zod schemas, security helpers, pure utilities
- Depends on: framework utilities and generated DB types
- Used by: service and view layers

**State Layer:**
- Purpose: manage session, UI context, and notification state outside component trees.
- Location: `src/stores/*.ts`, `src/hooks/useQueryWithBuilding.ts`
- Contains: persisted auth/UI stores and building-scoped query glue
- Depends on: Supabase auth, localStorage, React Query
- Used by: guards, layouts, and pages

## Data Flow

**Authenticated Owner/Staff Screen:**

1. `src/main.tsx` loads Sentry, CSS, and i18n, then mounts `src/App.tsx`.
2. `src/App.tsx` calls `useAuthStore.getState().initialize()` and waits on `isLoading`.
3. Router and guards choose the correct namespace from `src/routes/ownerRoutes.tsx`, `src/routes/superAdminRoutes.tsx`, or portal routes.
4. A page component calls a service directly or via React Query, often using `src/hooks/useQueryWithBuilding.ts`.
5. Service code queries Supabase through `src/lib/supabase.ts`, unwraps errors with `src/lib/supabaseHelpers.ts`, and maps DB enums into frontend enums with `src/lib/enumMaps.ts`.
6. The page renders frontend models and mutation side effects invalidate React Query caches.

**Tenant Portal Flow:**

1. `src/components/auth/PortalAuthGuard.tsx` checks auth, role, tenant stage, and session-expired state.
2. If onboarding is incomplete, the user is forced into `/portal/onboarding`.
3. Portal services such as `src/services/portalInvoiceService.ts` and `src/services/portalProfileService.ts` fetch current-user-scoped data.
4. Realtime hooks such as `src/hooks/usePortalInvoiceRealtime.ts` and `src/hooks/useTenantDashboardRealtime.ts` update the portal on live changes.

**State Management:**
- Server state: TanStack Query configured in `src/lib/queryClient.ts`
- Client state: Zustand stores in `src/stores/authStore.ts`, `src/stores/uiStore.ts`, and `src/stores/notificationStore.ts`
- Auth persistence: Supabase session + Zustand persisted snapshot
- Building scope: appended into query keys by `src/hooks/useQueryWithBuilding.ts`

## Key Abstractions

**Typed Supabase Client:**
- Purpose: single browser entry to database, auth, storage, and edge functions
- Examples: `src/lib/supabase.ts`, `src/types/supabase.ts`
- Pattern: singleton module

**Domain Service:**
- Purpose: encapsulate table access and row-to-model transformations
- Examples: `src/services/roomService.ts`, `src/services/ticketService.ts`, `src/services/userService.ts`
- Pattern: exported object with async methods

**Enum Mapping Layer:**
- Purpose: isolate DB enum strings from UI-facing names
- Examples: `src/lib/enumMaps.ts`, `src/lib/assetMappers.ts`
- Pattern: bidirectional mapper modules

**RouteObject Namespace:**
- Purpose: keep route trees modular and lazily loaded
- Examples: `src/routes/ownerRoutes.tsx`, `src/routes/portalRoutes.tsx`, `src/routes/superAdminRoutes.tsx`
- Pattern: route arrays mapped recursively in `src/App.tsx`

## Entry Points

**Browser Entry:**
- Location: `src/main.tsx`
- Triggers: browser loading `index.html`
- Responsibilities: initialize Sentry and i18n, render React root

**App Router:**
- Location: `src/App.tsx`
- Triggers: render after root mount
- Responsibilities: auth bootstrap, layout selection, lazy routing, legacy redirects

**Auth Store Bootstrap:**
- Location: `src/stores/authStore.ts`
- Triggers: `initialize()` from `src/App.tsx`
- Responsibilities: resolve Supabase session to app user, subscribe to auth state changes, set Sentry user

## Error Handling

**Strategy:** throw service-level errors and surface them through React Query, toasts, redirects, or error boundaries.

**Patterns:**
- `src/lib/supabaseHelpers.ts` wraps PostgREST responses and throws enriched `Error` objects.
- `src/lib/queryClient.ts` captures query and mutation failures globally and toasts mutation errors.
- `src/components/ErrorBoundary.tsx` catches render failures and reports them to Sentry.
- Some services still catch and downgrade failures to empty results or warnings, for example `src/services/publicListingsService.ts` and `src/services/portalOnboardingService.ts`.

## Cross-Cutting Concerns

**Logging:** console logging is still used directly in services, auth flows, and tests; there is no dedicated logger abstraction.

**Validation:** Zod and React Hook Form validate forms such as `src/schemas/contractSchema.ts` and `src/schemas/serviceSchema.ts`.

**Authentication:** Supabase auth session is the root identity source; route guards apply role and tenant-stage rules in the browser.

---

*Architecture analysis: 2026-04-26*
