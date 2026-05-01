# Codebase Structure

**Analysis Date:** 2026-05-01

## Directory Layout

```text
SmartStay/
|-- .github/              # GitHub Actions workflows
|-- .planning/            # GSD state, phases, sketches, generated codebase map
|-- docs/                 # Project and domain documentation
|-- public/               # Static assets served by Vite
|-- scripts/              # Repo scripts such as encoding audits
|-- src/                  # Frontend application source
|   |-- components/       # Reusable UI, layouts, modals, domain composites
|   |-- config/           # Permission and app configuration
|   |-- constants/        # App-wide constants and static data
|   |-- features/         # Feature-local helpers
|   |-- hooks/            # Custom React hooks
|   |-- i18n/             # i18next bootstrap and locale JSON
|   |-- lib/              # Infrastructure helpers and domain utilities
|   |-- models/           # Frontend-facing domain model types
|   |-- routes/           # Route trees and route guards
|   |-- schemas/          # Zod validation schemas
|   |-- services/         # Supabase-backed service layer
|   |-- stores/           # Zustand stores
|   |-- types/            # Shared and generated TypeScript types
|   |-- utils/            # Pure utilities and tests
|   `-- views/            # Route-level pages by namespace
|-- supabase/             # Migrations, Edge Functions, seeds, scripts
|-- tests/                # Playwright E2E tests
|-- package.json
|-- playwright.config.ts
|-- tailwind.config.js
|-- tsconfig.json
|-- vercel.json
`-- vite.config.ts
```

## Major Source Directories

**`src/components/`**
- Purpose: shared UI and domain-level components below page routes.
- Important folders: `ui/`, `layout/`, `shared/`, `auth/`, `rooms/`, `contracts/`, `invoices/`, `settings/`, `portal/`, `tickets/`.
- Key files: `src/components/layout/AppProviders.tsx`, `src/components/layout/AdminLayout.tsx`, `src/components/auth/PortalAuthGuard.tsx`, `src/components/ErrorBoundary.tsx`.

**`src/views/`**
- Purpose: route-level screens split by audience.
- Namespaces: `admin/`, `portal/`, `public/`, `auth/`, `super-admin/`, `error/`.
- Key examples: `src/views/admin/MarketplaceDashboard.tsx`, `src/views/admin/contracts/CreateContractWizard.tsx`, `src/views/admin/settings/AmenityManagementPage.tsx`, `src/views/portal/dashboard/TenantDashboard.tsx`, `src/views/public/ListingsPage.tsx`.

**`src/routes/`**
- Purpose: route arrays and guard components.
- Key files: `src/routes/ownerRoutes.tsx`, `src/routes/portalRoutes.tsx`, `src/routes/superAdminRoutes.tsx`, `src/routes/ProtectedRoute.tsx`.
- Note: there is no `src/routes/adminRoutes.tsx` in the current tree; `/admin/*` paths are legacy redirects to `/owner/*`.

**`src/services/`**
- Purpose: Supabase CRUD/RPC/function wrappers and row-to-model mapping.
- Shape: flat folder, one service per domain.
- Key services: `src/services/roomService.ts`, `src/services/buildingService.ts`, `src/services/contractService.ts`, `src/services/invoiceService.ts`, `src/services/paymentService.ts`, `src/services/ticketService.ts`, `src/services/utilityAdminService.ts`, `src/services/amenityAdminService.ts`, `src/services/portalInvoiceService.ts`.

**`src/lib/`**
- Purpose: core infrastructure and domain helpers.
- Key files: `src/lib/supabase.ts`, `src/lib/supabaseHelpers.ts`, `src/lib/queryClient.ts`, `src/lib/enumMaps.ts`, `src/lib/sentry.ts`, `src/lib/utilityBilling.ts`, `src/lib/assetBilling.ts`, `src/lib/authRouting.ts`.

**`src/stores/`**
- Purpose: persisted global client state.
- Files: `src/stores/authStore.ts`, `src/stores/uiStore.ts`, `src/stores/notificationStore.ts`, `src/stores/permissionStore.ts`.

**`src/i18n/`**
- Purpose: i18next resources and initialization.
- Files: `src/i18n/i18n.ts`, `src/i18n/vi/common.json`, `src/i18n/vi/public.json`, `src/i18n/en/common.json`, `src/i18n/en/public.json`.

**`supabase/`**
- Purpose: backend assets colocated with the frontend repo.
- Includes: `supabase/migrations/`, `supabase/functions/`, `supabase/seeds/`, `supabase/config.toml`.
- Function shared modules are in `supabase/functions/_shared/`.

**`tests/`**
- Purpose: Playwright browser tests.
- Files: `tests/auth.setup.ts`, `tests/01-smoke.spec.ts`, `tests/admin/02-buildings-and-rooms.spec.ts`, `tests/admin/03-owner-tickets.spec.ts`.

## File Counts Snapshot

- TypeScript/TSX files under `src/`: 316
- Route-level TSX files under `src/views/`: 83
- Supabase Edge Function TS files: 18
- Active Supabase migration files: 20

Counts are from the 2026-05-01 workspace snapshot and exclude `node_modules`.

## Key File Locations

**Entrypoints**
- `src/main.tsx` - React root, Sentry, CSS, i18n.
- `src/App.tsx` - auth bootstrap, route tree, legacy redirects.
- `index.html` - Vite HTML entry.

**Configuration**
- `package.json`
- `vite.config.ts`
- `tsconfig.app.json`
- `.eslintrc.json`
- `tailwind.config.js`
- `playwright.config.ts`
- `supabase/config.toml`
- `.env.example`

**Business Logic**
- `src/services/*.ts` - service layer.
- `src/lib/enumMaps.ts` - enum translation.
- `src/lib/utilityBilling.ts` - utility billing computation.
- `src/lib/assetBilling.ts` - billable asset line computation.
- `supabase/migrations/*.sql` - schema and RPC evolution.

**Tests**
- `src/**/*.test.ts`
- `tests/**/*.spec.ts`

## Naming Conventions

**Files**
- `PascalCase.tsx` for React pages/components, for example `RoomDetail.tsx` and `Button.tsx`.
- `camelCase.ts` for services, hooks, helpers, and schemas, for example `roomService.ts`, `useQueryWithBuilding.ts`, `enumMaps.ts`.
- `*.test.ts` for unit tests and `*.spec.ts` for Playwright.

**Directories**
- Mostly lower-case by domain or role: `portal`, `admin`, `public`, `auth`, `settings`, `contracts`, `rooms`.
- Some feature subfolders use descriptive compound names such as `amenity-components`.

**Routes**
- Owner/staff workspace route definitions: `src/routes/ownerRoutes.tsx`.
- Tenant portal route definitions: `src/routes/portalRoutes.tsx`.
- Super admin route definitions: `src/routes/superAdminRoutes.tsx`.

## Where to Add New Code

**New owner/staff page**
- Route: `src/routes/ownerRoutes.tsx`
- View: `src/views/admin/<domain>/`
- Service: `src/services/<domain>Service.ts`
- Component pieces: `src/components/<domain>/` or `src/components/shared/`

**New tenant portal page**
- Route: `src/routes/portalRoutes.tsx`
- View: `src/views/portal/<domain>/`
- Tenant-scoped service: `src/services/portal<Domain>Service.ts`

**New backend capability**
- Migration: `supabase/migrations/`
- Edge Function if service-role or webhook behavior is needed: `supabase/functions/<function-name>/`
- Shared Edge Function helper: `supabase/functions/_shared/`
- Frontend wrapper: `src/services/`

**New pure logic**
- Use `src/lib/` for domain logic that is app-aware.
- Use `src/utils/` for generic utility logic.
- Add colocated `*.test.ts` when practical.

## Generated and Local Artifact Directories

**Generated:**
- `dist/`
- `playwright-report/`
- `test-results/`
- `*.tsbuildinfo`

**Planning:**
- `.planning/codebase/` - generated codebase maps.
- `.planning/phases/` - phase artifacts.
- `.planning/sketches/` - sketch outputs.

**Temporary / scratch:**
- `tmp*` folders and screenshot files are present locally and should not be treated as application source.

---

*Structure analysis: 2026-05-01*
