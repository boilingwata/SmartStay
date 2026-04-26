# Codebase Structure

**Analysis Date:** 2026-04-26

## Directory Layout

```text
SmartStay/
├── .planning/           # GSD planning state and generated codebase docs
├── .github/             # GitHub Actions workflows
├── docs/                # Project documentation outside app runtime
├── public/              # Static public assets served by Vite
├── scripts/             # Repo scripts such as encoding audits
├── src/                 # Frontend application source
│   ├── components/      # Reusable UI and composite building blocks
│   ├── hooks/           # Custom React hooks
│   ├── i18n/            # Translation resources and i18n bootstrap
│   ├── lib/             # Core infrastructure helpers and mappers
│   ├── models/          # Frontend-facing domain models
│   ├── routes/          # Route trees and guards
│   ├── schemas/         # Zod form schemas
│   ├── services/        # Supabase-backed domain services
│   ├── stores/          # Zustand stores
│   ├── utils/           # Pure utilities and security helpers
│   └── views/           # Route-level pages by namespace
├── supabase/            # Supabase SQL, scripts, or backend support assets
├── tests/               # Playwright tests
├── package.json         # Project manifest and scripts
├── playwright.config.ts # E2E test runner config
├── tailwind.config.js   # Tailwind theme config
├── tsconfig.json        # TypeScript config
├── vercel.json          # SPA rewrite rules
└── vite.config.ts       # Vite build and dev server config
```

## Directory Purposes

**src/components/**
- Purpose: reusable pieces below full-page views
- Contains: `ui/`, `layout/`, `shared/`, `auth/`, plus domain folders such as `tickets/`, `contracts/`, `service/`, `public/`
- Key files: `src/components/layout/AppProviders.tsx`, `src/components/ErrorBoundary.tsx`, `src/components/auth/PortalAuthGuard.tsx`
- Subdirectories: mostly grouped by concern or domain

**src/views/**
- Purpose: route-level screens
- Contains: namespace folders such as `admin/`, `portal/`, `auth/`, `public/`, `super-admin/`, `error/`, `layouts/`
- Key files: `src/views/admin/contracts/CreateContractWizard.tsx`, `src/views/portal/dashboard/TenantDashboard.tsx`, `src/views/public/LandingPage.tsx`
- Subdirectories: large feature branches with nested `components/`, `tabs/`, or `wizard/`

**src/services/**
- Purpose: all Supabase CRUD, RPC, auth-aware workflows, and storage orchestration
- Contains: one service module per domain plus portal-specific service modules
- Key files: `src/services/roomService.ts`, `src/services/ticketService.ts`, `src/services/userService.ts`, `src/services/publicListingsService.ts`
- Subdirectories: flat

**src/lib/**
- Purpose: infrastructure glue and mapping code shared across features
- Contains: `supabase.ts`, `supabaseHelpers.ts`, `queryClient.ts`, `sentry.ts`, enum and presentation helpers
- Key files: `src/lib/supabase.ts`, `src/lib/enumMaps.ts`, `src/lib/queryClient.ts`
- Subdirectories: flat

**src/stores/**
- Purpose: persisted app-wide state
- Contains: auth, UI, permission, and notification stores
- Key files: `src/stores/authStore.ts`, `src/stores/uiStore.ts`, `src/stores/notificationStore.ts`
- Subdirectories: flat

**tests/**
- Purpose: Playwright browser automation
- Contains: smoke flow, auth setup, admin feature suites, utility-focused tests
- Key files: `tests/auth.setup.ts`, `tests/01-smoke.spec.ts`, `tests/admin/02-buildings-and-rooms.spec.ts`
- Subdirectories: `tests/admin/`

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React root bootstrap
- `src/App.tsx`: router composition and auth initialization

**Configuration:**
- `package.json`: npm scripts and dependencies
- `vite.config.ts`: bundler/server config and alias setup
- `playwright.config.ts`: Playwright runtime
- `.eslintrc.json`: ESLint rules
- `tailwind.config.js`: CSS theme tokens and breakpoints
- `.env.example`: committed env var reference

**Core Logic:**
- `src/services/`: domain services over Supabase
- `src/routes/`: route trees and auth guards
- `src/stores/`: persisted state
- `src/lib/`: mappers, clients, infra helpers

**Testing:**
- `src/**/*.test.ts`: small set of unit tests
- `tests/**/*.spec.ts`: Playwright E2E
- `tests/auth.setup.ts`: storage-state auth bootstrap

**Documentation:**
- `README.md`: setup and stack overview
- `AGENTS.md`: agent guidance for the repo
- `.planning/codebase/*.md`: generated codebase map

## Naming Conventions

**Files:**
- `PascalCase.tsx` for many components and pages such as `Button.tsx`, `PortalLayout.tsx`, `CreateContractWizard.tsx`
- `camelCase.ts` for many services, hooks, and helpers such as `roomService.ts`, `useQueryWithBuilding.ts`, `enumMaps.ts`
- `*.test.ts` and `*.spec.ts` for tests

**Directories:**
- lower-case or kebab-lite folder names such as `views/admin/contracts`, `components/shared`, `services`
- namespace folders reflect user role or concern: `portal`, `admin`, `public`, `auth`

**Special Patterns:**
- Route files export `RouteObject[]` arrays from `src/routes/*.tsx`
- Some feature folders embed local support modules, for example `src/views/admin/contracts/wizard/`
- Barrel files exist in a few places such as `src/views/layouts/index.ts` and `src/components/ui/index.ts`, but they are not universal

## Where to Add New Code

**New Feature:**
- Primary code: matching page under `src/views/` plus related service in `src/services/`
- Tests: unit logic beside source in `src/` and browser coverage under `tests/` if the flow is user-facing
- Config if needed: root config files or `src/constants/`

**New Component/Module:**
- Implementation: `src/components/<domain>/` or `src/components/shared/`
- Types: `src/models/` or `src/types/`
- Tests: colocated `*.test.ts(x)` where practical

**New Route:**
- Definition: `src/routes/ownerRoutes.tsx`, `src/routes/portalRoutes.tsx`, or sibling route files
- Page: `src/views/...`
- Guarding: `src/routes/ProtectedRoute.tsx` or `src/components/auth/PortalAuthGuard.tsx`

**Utilities:**
- Shared helpers: `src/utils/` for pure utilities, `src/lib/` for infra-aware helpers
- Query wrappers or view hooks: `src/hooks/`

## Special Directories

**dist/**
- Purpose: Vite build output
- Source: generated by `npm run build`
- Committed: No

**playwright-report/**
- Purpose: HTML report from Playwright runs
- Source: generated by `npx playwright test`
- Committed: No

**test-results/**
- Purpose: Playwright artifacts
- Source: generated during E2E execution
- Committed: No

**.planning/codebase/**
- Purpose: generated repo map used by GSD workflows
- Source: refreshed by `$gsd-map-codebase`
- Committed: Yes, intended living documentation

---

*Structure analysis: 2026-04-26*
