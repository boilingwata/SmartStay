# Technology Stack

**Analysis Date:** 2026-05-01

## Languages

**Primary:**
- TypeScript 5.x - application code under `src/`, route definitions in `src/routes/`, Supabase service wrappers in `src/services/`, and Playwright tests under `tests/`.
- SQL - Supabase migrations, seed data, and schema maintenance under `supabase/migrations/`, `supabase/seeds/`, and `supabase/scripts/`.

**Secondary:**
- TS/JS configuration - Vite, Tailwind, Playwright, and scripts in root config files such as `vite.config.ts`, `tailwind.config.js`, and `playwright.config.ts`.
- Deno TypeScript - Supabase Edge Functions under `supabase/functions/`.
- Markdown - project guidance and planning artifacts in `README.md`, `AGENTS.md`, `docs/`, and `.planning/`.

## Runtime

**Frontend Runtime:**
- Browser-only React SPA bootstrapped by `src/main.tsx`.
- Vite dev server binds to `127.0.0.1:5173` with `strictPort: true` in `vite.config.ts`.

**Backend Runtime:**
- Supabase hosted Postgres, Auth, Storage, Realtime, RPCs, and Edge Functions.
- Edge Functions use Deno and shared helpers from `supabase/functions/_shared/`.

**Package Manager:**
- npm with `package-lock.json`.
- Node 18 is used by `.github/workflows/playwright.yml`.

## Frameworks

**Application:**
- React 18.2 - all UI pages and components.
- React Router DOM 7.13 - route namespaces and redirects in `src/App.tsx` plus `src/routes/*.tsx`.
- Vite 5 - dev server, bundling, aliasing, and optional Sentry source-map upload.

**Data and State:**
- `@supabase/supabase-js` 2.99 - browser client, auth, storage, RPCs, and edge function invocation.
- TanStack Query 5 - server-state cache and mutation lifecycle through `src/lib/queryClient.ts`.
- Zustand 4 - persisted client state in `src/stores/authStore.ts`, `src/stores/uiStore.ts`, `src/stores/notificationStore.ts`, and `src/stores/permissionStore.ts`.

**Forms and Validation:**
- React Hook Form 7 and Zod 3 - form state and validation schemas under `src/schemas/`.
- `@hookform/resolvers` - Zod integration for form flows.

**UI:**
- Tailwind CSS 3 with CSS custom properties in `src/index.css` and theme extension in `tailwind.config.js`.
- shadcn-style local primitives under `src/components/ui/`.
- Lucide React icons, Sonner toasts, Recharts charts, TanStack Table, dnd-kit, TipTap, jsPDF, html2canvas, QR code rendering, and Framer Motion.

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` - central integration in `src/lib/supabase.ts`.
- `@tanstack/react-query` - data cache and global error reporting.
- `react-router-dom` - all access control and namespace routing depend on it.
- `zustand` - session, building context, UI state, and notifications.
- `react-hook-form`, `zod` - high-value workflows such as contract, room, service, and building forms.
- `sonner` and `@sentry/react` - global feedback and error capture.

**Feature Dependencies:**
- `@tiptap/*` - rich text editing.
- `@tanstack/react-table` - dense admin tables.
- `recharts` - dashboard and report visualization.
- `@dnd-kit/*` - drag/drop interactions.
- `dompurify` - sanitized rich text or HTML handling.
- `qrcode.react` - QR display for payment flows.

## Configuration

**Required Environment:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

These are enforced at startup in `src/lib/supabase.ts`.

**Optional Environment:**
- `VITE_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- `VITE_USE_EDGE_FUNCTIONS`
- `VITE_BANK_NAME`, `VITE_BANK_CODE`, `VITE_BANK_ACCOUNT_NUMBER`, `VITE_BANK_ACCOUNT_NAME`, `VITE_BANK_BRANCH`
- `VITE_DEMO_MODE`
- Supabase Edge Function secrets such as `SEPAY_WEBHOOK_API_KEY`, `SEPAY_ALLOW_DEMO`, `MOMO_*`, `SITE_URL`, and Supabase runtime keys.

**Build and Tooling Files:**
- `package.json` - scripts and dependency manifest.
- `vite.config.ts` - React plugin, alias `@/`, Sentry plugin, sourcemaps, dev server.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - strict TypeScript settings.
- `.eslintrc.json` - ESLint rules with zero-warning script policy.
- `tailwind.config.js`, `postcss.config.js`, `components.json` - design system and styling config.
- `playwright.config.ts` - E2E runner, auth storage state, local web server.
- `supabase/config.toml` - Edge Function deployment settings and seed paths.
- `vercel.json` - SPA history fallback rewrite.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run e2e
npm run preview
npm run audit:encoding
```

## Platform Requirements

**Development:**
- Node.js/npm.
- `.env.local` with Supabase publishable credentials.
- A Supabase project containing the `smartstay` schema used by `src/lib/supabase.ts`.
- Playwright browsers for E2E.

**Production:**
- Static SPA hosting with history fallback.
- Supabase project with migrations applied, storage policies, and Edge Function secrets configured.
- Optional Sentry DSN and source-map upload credentials.

---

*Stack analysis: 2026-05-01*
