# External Integrations

**Analysis Date:** 2026-05-01

## Backend Platform

**Supabase**
- Purpose: database, auth, storage, realtime, RPCs, and Edge Functions.
- Browser client: `src/lib/supabase.ts`
- Schema: custom Postgres schema `smartstay`.
- Generated types: `src/types/supabase.ts`
- Local config: `supabase/config.toml`
- Migrations: `supabase/migrations/`
- Seeds: `supabase/seed.sql`, `supabase/seeds/domain_demo_seed.sql`, `supabase/seeds/domain_smoke_checks.sql`

The frontend talks to Supabase directly through domain services in `src/services/`. Sensitive or transactional paths also use RPCs and Edge Functions.

## Database and RPCs

**Primary Database:**
- PostgreSQL on Supabase.
- Accessed by `supabase.from(...)` calls in `src/services/*.ts`.
- Common helper: `unwrap()` in `src/lib/supabaseHelpers.ts`.
- Building scoping helper: `buildingScoped()` in `src/lib/supabaseHelpers.ts`.

**Frequent RPCs:**
- Contract lifecycle: `create_contract_v3`, `add_contract_occupant`, `remove_contract_occupant`, `transfer_contract_representative`, `liquidate_contract` in `src/services/contractService.ts`.
- Room handover: `create_handover_checklist_v1` in `src/services/roomService.ts`.
- Payments: `approve_payment`, `process_payment`, `portal_record_invoice_payment`, `portal_mark_invoice_paid`, `portal_cancel_invoice` in `src/services/paymentService.ts` and `src/services/portalInvoiceService.ts`.
- Utility billing: `create_policy_utility_invoice` and `validate_utility_billing_cron_secret` from `supabase/functions/run-utility-billing/index.ts` and `supabase/functions/create-utility-invoice/index.ts`.
- Webhooks: `handle_sepay_webhook` from `supabase/functions/sepay-webhook/index.ts` and `supabase/functions/webhook-payment/index.ts`.

## Authentication and Identity

**Supabase Auth**
- Browser session is initialized in `src/stores/authStore.ts`.
- Supabase session persistence is enabled in `src/lib/supabase.ts`.
- App user enrichment reads `smartstay.profiles` and maps roles with `src/lib/enumMaps.ts`.
- Route guards live in `src/routes/ProtectedRoute.tsx` and `src/components/auth/PortalAuthGuard.tsx`.

**Roles Detected:**
- `Owner`
- `Staff`
- `Tenant`
- `SuperAdmin`

`SuperAdmin` can be resolved from `app_metadata.workspace_role` in `src/stores/authStore.ts`; other roles are loaded from profiles.

## Edge Functions

**Configured in `supabase/config.toml`:**
- `sepay-webhook` - incoming SePay payment webhook, JWT verification disabled but API-key validation implemented in function code.
- `run-utility-billing` - scheduled or operator-triggered utility billing run.
- `create-contract` - transactional contract creation wrapper around `create_contract_v3`.
- `create-user` - privileged user creation.
- `create-utility-invoice` - utility invoice persistence through RPC.

**Additional function directories present:**
- `activate-resident`
- `adjust-balance`
- `create-owner`
- `process-payment`
- `webhook-payment`

Shared Edge Function infrastructure is under `supabase/functions/_shared/`, including auth verification, service-role client creation, CORS, error responses, and utility invoice building.

## Storage

**Supabase Storage**
- Service wrapper: `src/services/fileService.ts`
- Public bucket expected by code: `smartstay-files`
- Common object paths include uploads, tickets, and contract supporting documents.
- Client-side file and URL safety helpers are in `src/utils/security.ts`.

## Payments

**Bank Transfer / QR Display**
- Frontend env variables feed invoice and portal payment display:
  - `VITE_BANK_NAME`
  - `VITE_BANK_CODE`
  - `VITE_BANK_ACCOUNT_NUMBER`
  - `VITE_BANK_ACCOUNT_NAME`
  - `VITE_BANK_BRANCH`
- Portal invoice support lives in `src/services/portalInvoiceService.ts`.

**SePay**
- Incoming webhook handlers: `supabase/functions/sepay-webhook/index.ts`, `supabase/functions/webhook-payment/index.ts`.
- Frontend demo trigger exists in `src/views/portal/finance/InvoiceList.tsx`.
- Secrets: `SEPAY_WEBHOOK_API_KEY`, `SEPAY_API_KEY`, `SEPAY_ALLOW_DEMO`.

**MoMo**
- Payment creation support appears in `supabase/functions/process-payment/index.ts`.
- Env variables include `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_PARTNER_NAME`, `MOMO_STORE_ID`, `MOMO_REDIRECT_URL`, `MOMO_IPN_URL`, and `MOMO_API_ENDPOINT`.

## Observability

**Sentry**
- Client setup: `src/lib/sentry.ts`
- Error boundary: `src/components/ErrorBoundary.tsx`
- React Query integration: `src/lib/queryClient.ts`
- Build-time source maps: optional `sentryVitePlugin` in `vite.config.ts`.

**Logging**
- Browser and Edge Function console logging is still used directly in several areas.
- No centralized logging abstraction beyond Sentry was detected.

## CI/CD and Hosting

**GitHub Actions**
- Workflow: `.github/workflows/playwright.yml`
- Runs dependency install, Playwright browser install, and `npx playwright test`.
- It does not currently run `npm run build`, `npm run lint`, or `npm run test`.

**Vercel-style Static Hosting**
- `vercel.json` rewrites all non-asset paths to `index.html`.
- This supports client-side React Router paths such as `/owner/dashboard`, `/portal/dashboard`, and `/super-admin/dashboard`.

## Environment Reference

**Committed reference:** `.env.example`

**Local secrets:** `.env.local` exists in the workspace but was not read during this mapping.

**Security note:** Edge Functions that set `verify_jwt = false` must continue to enforce custom authentication internally. Most configured operator functions use `requireWorkspaceOperator()`; webhooks use provider API-key validation.

---

*Integration audit: 2026-05-01*
