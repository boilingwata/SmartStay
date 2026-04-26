# Technology Stack

**Analysis Date:** 2026-04-26

## Languages

**Primary:**
- TypeScript 5.x - all application code under `src/`, Playwright tests under `tests/`, and most build config.

**Secondary:**
- JavaScript - tool and config files such as `tailwind.config.js`, `postcss.config.js`, and `vite.config.js`.
- SQL - Supabase assets under `supabase/` and schema-driven types generated into `src/types/supabase.ts`.
- Markdown - repo guidance in `README.md`, `AGENTS.md`, and `.planning/`.

## Runtime

**Environment:**
- Node.js 18+ - documented in `README.md` and used in `.github/workflows/playwright.yml`.
- Browser SPA runtime - React app bootstrapped from `src/main.tsx` and rendered through `src/App.tsx`.

**Package Manager:**
- npm - scripts are declared in `package.json`.
- Lockfile: `package-lock.json` present.

## Frameworks

**Core:**
- React 18.2 - UI framework for all screens in `src/views/` and `src/components/`.
- React Router DOM 7.13 - route orchestration in `src/App.tsx` and `src/routes/*.tsx`.
- Supabase JS 2.99 - auth, database, storage, and edge function access via `src/lib/supabase.ts`.
- TanStack Query 5 - request caching and mutation lifecycle in `src/lib/queryClient.ts` and view-level hooks.
- Zustand 4 - persisted client state in `src/stores/authStore.ts`, `src/stores/uiStore.ts`, and `src/stores/notificationStore.ts`.

**Testing:**
- Vitest 0.34 - unit tests such as `src/utils/security.test.ts` and `src/lib/assetBilling.test.ts`.
- Playwright 1.40 - browser flows under `tests/`.
- Testing Library 14 - React component test dependency is installed, but little active usage was detected.

**Build/Dev:**
- Vite 5 - local dev server and production bundling configured in `vite.config.ts`.
- TypeScript compiler - typecheck step in `npm run build`.
- Tailwind CSS 3.3 - utility styling configured in `tailwind.config.js`.
- Sentry Vite plugin 5 - optional source map upload in `vite.config.ts` when auth env vars exist.

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` - the app talks directly to the `smartstay` schema and storage buckets from the browser.
- `@tanstack/react-query` - most data screens use query/mutation wrappers instead of ad hoc fetch state.
- `react-router-dom` - route namespaces, redirects, and guards all depend on it.
- `react-hook-form` and `zod` - complex forms such as `src/views/admin/contracts/CreateContractWizard.tsx` rely on schema-driven validation.
- `sonner` - global toast surface used in providers, services, and views.
- `@sentry/react` - runtime error capture in `src/lib/sentry.ts` and `src/components/ErrorBoundary.tsx`.

**Infrastructure:**
- `i18next` and `react-i18next` - localization resources in `src/i18n/`.
- `@tanstack/react-table` - data-heavy admin tables.
- `recharts` - dashboard and report visualizations in `src/components/data/`.
- `@tiptap/*` - rich text editing in `src/components/shared/RichTextEditor.tsx`.
- `html2canvas` and `jspdf` - client-side export flows.
- `@playwright/test` - E2E automation and GitHub workflow coverage.

## Configuration

**Environment:**
- Frontend runtime expects `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as shown in `.env.example` and enforced by `src/lib/supabase.ts`.
- Optional runtime envs detected: `VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SITE_URL`, `VITE_BANK_*`, `VITE_DEMO_MODE`, `VITE_USE_EDGE_FUNCTIONS`, `SEPAY_*`.
- Local development uses `.env.local`; `.env.example` is the committed reference file.

**Build:**
- `vite.config.ts` - Vite server, alias, Sentry plugin, source maps.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript compiler settings.
- `.eslintrc.json` - lint rules.
- `tailwind.config.js` and `postcss.config.js` - styling pipeline.
- `playwright.config.ts` - browser test runtime.

## Platform Requirements

**Development:**
- Any OS with Node.js and npm.
- A reachable Supabase project with the `smartstay` schema and storage bucket expected by `src/lib/supabase.ts` and `src/services/fileService.ts`.
- Browser access to `http://127.0.0.1:5173` for Playwright and local testing.

**Production:**
- Static SPA hosting with history fallback; `vercel.json` rewrites all non-asset paths to `index.html`.
- Environment variables must be injected by the host platform.
- Source-map upload to Sentry is optional but the app expects browser DSN wiring if observability is enabled.

---

*Stack analysis: 2026-04-26*
