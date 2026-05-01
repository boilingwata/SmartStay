# Architecture

**Analysis Date:** 2026-05-01

## Pattern Overview

SmartStay is a browser-first React SPA with a layered service architecture over Supabase. The frontend owns routing, role-specific layouts, form orchestration, and most presentation logic. Supabase owns persistence, auth, storage, realtime, transactional RPCs, and selected Edge Function workflows.

**Key Characteristics:**
- One SPA serves public listings/auth, owner/staff workspace, super-admin workspace, and tenant portal.
- Route namespaces are defined in `src/App.tsx`, `src/routes/ownerRoutes.tsx`, `src/routes/portalRoutes.tsx`, and `src/routes/superAdminRoutes.tsx`.
- UI components call domain services that map database rows into frontend models.
- React Query manages server state; Zustand persists client state.
- Supabase RPCs and Edge Functions handle operations that need transactionality or service-role privileges.

## Layers

**Application Shell**
- Location: `src/main.tsx`, `src/App.tsx`, `src/components/layout/AppProviders.tsx`
- Responsibilities: initialize Sentry and i18n, mount React, bootstrap auth, wire providers, render router, toasts, offline/session overlays, and error boundaries.

**Routing and Access Control**
- Location: `src/routes/*.tsx`, `src/components/auth/PortalAuthGuard.tsx`, `src/lib/authRouting.ts`
- Responsibilities: role gating, tenant-stage gating, legacy redirects, post-login redirect normalization, route tree exports.
- Current namespaces: `/`, `/login`, `/public/*`, `/listings/*`, `/owner/*`, `/super-admin/*`, `/portal/*`, and compatibility redirects from older `/admin/*` paths.

**View Layer**
- Location: `src/views/**`
- Responsibilities: route-level UI, query/mutation orchestration, form flows, table/chart/page composition.
- Examples: `src/views/admin/contracts/CreateContractWizard.tsx`, `src/views/admin/rooms/RoomDetail.tsx`, `src/views/portal/finance/InvoiceList.tsx`, `src/views/super-admin/Dashboard.tsx`.

**Component Layer**
- Location: `src/components/**`
- Responsibilities: layout shells, shared UI, modals, domain composites, data display, form controls, tenant portal components.
- Examples: `src/components/layout/AdminLayout.tsx`, `src/components/ui/Button.tsx`, `src/components/rooms/RoomModal.tsx`, `src/components/contracts/wizard/steps/RoomTenantStep.tsx`.

**Service Layer**
- Location: `src/services/*.ts`
- Responsibilities: Supabase table queries, RPC calls, Edge Function invocation, row-to-model mapping, business-specific request construction.
- Examples: `src/services/roomService.ts`, `src/services/contractService.ts`, `src/services/utilityAdminService.ts`, `src/services/portalInvoiceService.ts`, `src/services/amenityAdminService.ts`.

**Infrastructure and Domain Utilities**
- Location: `src/lib/`, `src/utils/`, `src/models/`, `src/types/`, `src/schemas/`
- Responsibilities: Supabase client, query client, enum mappers, presentation helpers, security helpers, generated DB types, Zod schemas, and frontend-facing models.

**Supabase Backend Assets**
- Location: `supabase/migrations/`, `supabase/functions/`, `supabase/seeds/`
- Responsibilities: database schema, RLS, RPCs, Edge Functions, and seed/demo data.

## Data Flow

**Owner/Staff Workspace Flow**
1. `src/main.tsx` loads infrastructure and renders `src/App.tsx`.
2. `src/App.tsx` calls `useAuthStore.getState().initialize()`.
3. `ProtectedRoute` checks session and role for `/owner/*`.
4. A route from `src/routes/ownerRoutes.tsx` lazy-loads the page.
5. The page calls a domain service directly or through React Query.
6. The service uses `src/lib/supabase.ts`, `unwrap()` from `src/lib/supabaseHelpers.ts`, and mappers from `src/lib/enumMaps.ts`.
7. Mutations invalidate query keys or update local state; global mutation errors are toasted by `src/lib/queryClient.ts`.

**Tenant Portal Flow**
1. `PortalAuthGuard` verifies authentication, `Tenant` role, and resident stage.
2. Incomplete resident profiles are redirected to `/portal/onboarding`.
3. Portal views call tenant-scoped services such as `src/services/portalInvoiceService.ts`, `src/services/portalProfileService.ts`, and `src/services/tenantDashboardService.ts`.
4. Realtime hooks such as `src/hooks/usePortalInvoiceRealtime.ts` and `src/hooks/useTenantDashboardRealtime.ts` subscribe to live updates.

**Transactional Backend Flow**
1. The UI calls a service method, for example `contractService.createContract()`.
2. The service either invokes a Supabase Edge Function when `VITE_USE_EDGE_FUNCTIONS === 'true'`, or calls an RPC directly.
3. Edge Functions validate caller roles with `supabase/functions/_shared/auth.ts` and use a service-role client from `supabase/functions/_shared/supabaseAdmin.ts`.
4. Database RPCs persist multi-table changes in one transaction.

## State Management

**React Query**
- Configured in `src/lib/queryClient.ts`.
- Uses `staleTime` 5 minutes, `gcTime` 10 minutes, retry 1 for queries, retry 0 for mutations.
- Global query/mutation errors are sent to Sentry; mutation errors also produce Sonner toasts.
- Network recovery listeners invalidate active queries after long idle, focus, or online transitions.

**Zustand**
- `src/stores/authStore.ts` - resolved user, role, auth mode, session-expired state, Supabase auth listener.
- `src/stores/uiStore.ts` - sidebar state, active building, theme, language.
- `src/stores/notificationStore.ts` - notification list, unread count, realtime subscription handle.
- `src/stores/permissionStore.ts` - permission snapshot.

**Building Scope**
- UI building context comes from `activeBuildingId` in `src/stores/uiStore.ts`.
- `src/hooks/useQueryWithBuilding.ts` appends it to query keys and injects it into query functions.
- `buildingScoped()` applies `building_id` filters when services receive a building ID.

## Key Abstractions

**Typed Supabase Client**
- File: `src/lib/supabase.ts`
- Creates `createClient<Database, 'smartstay'>`.
- Adds custom fetch retry and hard timeouts to avoid indefinitely pending requests after tab wake.

**Enum Mapping Layer**
- File: `src/lib/enumMaps.ts`
- Maps DB enum strings into frontend labels and back.
- Keeps UI code mostly isolated from raw database enum values.

**Domain Services**
- Files: `src/services/*.ts`
- Pattern: row interfaces, transformer functions, exported service object or named async functions.
- Services are the expected place for Supabase select shapes and DB enum conversion.

**RouteObject Arrays**
- Files: `src/routes/ownerRoutes.tsx`, `src/routes/portalRoutes.tsx`, `src/routes/superAdminRoutes.tsx`
- `src/App.tsx` recursively maps arrays to `<Route>` elements.

**Edge Function Shared Helpers**
- Files: `supabase/functions/_shared/auth.ts`, `supabase/functions/_shared/supabaseAdmin.ts`, `supabase/functions/_shared/errors.ts`, `supabase/functions/_shared/cors.ts`
- Provide authentication, service-role client setup, common responses, and CORS.

## Entry Points

**Browser**
- `index.html`
- `src/main.tsx`
- `src/App.tsx`

**Supabase Edge Functions**
- `supabase/functions/create-contract/index.ts`
- `supabase/functions/create-user/index.ts`
- `supabase/functions/create-utility-invoice/index.ts`
- `supabase/functions/run-utility-billing/index.ts`
- `supabase/functions/process-payment/index.ts`
- `supabase/functions/sepay-webhook/index.ts`
- `supabase/functions/webhook-payment/index.ts`

## Error Handling

**Frontend**
- `unwrap()` enriches Supabase PostgREST errors in `src/lib/supabaseHelpers.ts`.
- `src/lib/queryClient.ts` captures query and mutation errors and toasts mutation failures.
- `src/components/ErrorBoundary.tsx` catches render failures and reports to Sentry.
- Several services catch schema compatibility or optional data failures and return fallbacks, for example `src/services/amenityAdminService.ts` and `src/services/publicListingsService.ts`.

**Edge Functions**
- Shared error helpers in `supabase/functions/_shared/errors.ts`.
- Auth helpers return denied responses instead of throwing through function handlers.
- Webhook functions return JSON status payloads and log server-side failures.

## Cross-Cutting Concerns

**Localization:** i18next resources live in `src/i18n/`; Vietnamese is the primary UI language, but some inline strings remain in components.

**Security:** Supabase RLS, route guards, URL/file validation, Edge Function auth, and RPC hardening all matter because the browser client directly accesses the backend.

**Observability:** Sentry is present for frontend errors; Edge Function logging is console-based.

**Design System:** Tailwind tokens and local shadcn-style primitives form the UI base. The current design direction favors dense operational workspaces over marketing layouts.

---

*Architecture analysis: 2026-05-01*
