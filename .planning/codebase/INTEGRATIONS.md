# External Integrations

**Analysis Date:** 2026-04-26

## APIs & External Services

**Backend Platform:**
- Supabase - primary backend for database, auth, storage, realtime, and edge functions.
  - SDK/Client: `@supabase/supabase-js` via `src/lib/supabase.ts`
  - Auth: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
  - Features used: auth sessions, table CRUD, RPCs, storage uploads, edge function invoke

**Error Tracking:**
- Sentry - client-side exception tracking and session replay.
  - SDK/Client: `@sentry/react` and `@sentry/vite-plugin`
  - Auth: `VITE_SENTRY_DSN` at runtime, plus `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` for source-map upload
  - Entry points: `src/lib/sentry.ts`, `src/lib/queryClient.ts`, `src/components/ErrorBoundary.tsx`

**Banking / Payment QR Metadata:**
- Bank transfer display config - consumed from env for invoice and portal payment UI.
  - Integration method: env-driven frontend rendering
  - Auth: `VITE_BANK_NAME`, `VITE_BANK_CODE`, `VITE_BANK_ACCOUNT_NUMBER`, `VITE_BANK_ACCOUNT_NAME`, `VITE_BANK_BRANCH`
  - Usage: portal finance flows and invoice display helpers

**Webhook-related Payment Support:**
- SePay webhook configuration is declared in `.env.example`.
  - Integration method: config presence only in the frontend repo
  - Auth: `SEPAY_WEBHOOK_API_KEY`, `SEPAY_ALLOW_DEMO`
  - Runtime ownership likely belongs to backend or Supabase edge functions; no direct frontend webhook handler was detected

## Data Storage

**Databases:**
- PostgreSQL on Supabase, custom schema `smartstay`
  - Connection: `VITE_SUPABASE_URL` plus publishable key
  - Client: Supabase JS typed with `src/types/supabase.ts`
  - Query pattern: service layer under `src/services/` plus helper wrappers in `src/lib/supabaseHelpers.ts`
  - RPC usage detected in `src/services/roomService.ts`

**File Storage:**
- Supabase Storage bucket `smartstay-files`
  - SDK/Client: Supabase storage client via `src/services/fileService.ts`
  - Auth: browser session or anon-key-backed access with RLS
  - Upload path pattern: `uploads/...`, `tickets/...`, `contract-supporting-docs/...`

**Caching:**
- No external cache service detected.
- Client-side cache relies on TanStack Query in `src/lib/queryClient.ts`.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: browser client session persisted in `localStorage` through `src/lib/supabase.ts`
  - Token storage: localStorage-backed Supabase auth plus Zustand persistence in `src/stores/authStore.ts`
  - Session management: `supabase.auth.getSession()`, `onAuthStateChange`, and refresh handled client-side

**Role / Tenant Identity:**
- Profile enrichment comes from `smartstay.profiles`
  - Implementation: `src/stores/authStore.ts` resolves session user into app role and tenant stage
  - Route guards: `src/routes/ProtectedRoute.tsx` and `src/components/auth/PortalAuthGuard.tsx`

## Monitoring & Observability

**Error Tracking:**
- Sentry
  - DSN: `VITE_SENTRY_DSN`
  - Coverage: React boundary, React Query cache/mutation errors, manual `captureException`

**Logs:**
- Browser console logging is still present in multiple files such as `src/lib/sentry.ts`, `src/services/fileService.ts`, and Playwright tests.
- No centralized log shipping beyond Sentry was detected.

## CI/CD & Deployment

**Hosting:**
- Vercel-style SPA deployment is implied by `vercel.json`.
  - Deployment behavior: history rewrite to `index.html`
  - Environment vars: expected to be configured in hosting dashboard for production

**CI Pipeline:**
- GitHub Actions workflow in `.github/workflows/playwright.yml`
  - Scope: install deps, install Playwright browsers, run `npx playwright test`
  - Missing from CI: dedicated `npm run build`, `npm run lint`, and `npm run test` steps

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

**Optional env vars detected in code or examples:**
- `VITE_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SITE_URL`
- `VITE_BANK_NAME`
- `VITE_BANK_CODE`
- `VITE_BANK_ACCOUNT_NUMBER`
- `VITE_BANK_ACCOUNT_NAME`
- `VITE_BANK_BRANCH`
- `VITE_DEMO_MODE`
- `VITE_USE_EDGE_FUNCTIONS`
- `SEPAY_WEBHOOK_API_KEY`
- `SEPAY_ALLOW_DEMO`

**Secrets location:**
- Local: `.env.local`
- Shared example: `.env.example`
- Production: not committed; expected via host or Supabase/Vercel settings

## Webhooks & Callbacks

**Incoming:**
- No browser-side webhook endpoints exist in this repo.
- Payment webhook review pages exist in `src/views/admin/finance/WebhookLogs.tsx`, implying webhook producers exist outside this frontend.

**Outgoing:**
- Supabase Edge Function invocation detected in `src/services/portalOnboardingService.ts` for `activate-resident`.
- Supabase function invocation detected in `src/services/userService.ts` for `create-user`.
- No third-party REST webhook sender was detected in the frontend code.

---

*Integration audit: 2026-04-26*
