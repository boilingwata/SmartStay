# Codebase Concerns

**Analysis Date:** 2026-04-26

## Tech Debt

**Repo documentation drift:**
- Issue: repo guidance still describes `/admin/*` as the primary staff namespace, but the live router uses `/owner/*` and legacy redirects in `src/App.tsx`.
- Files: `AGENTS.md`, `README.md`, `src/App.tsx`, `src/routes/ownerRoutes.tsx`
- Impact: onboarding, automation, and future planning can target the wrong URLs and mental model.
- Fix approach: update top-level docs to match current route namespaces and redirect behavior.

**Oversized page and service modules:**
- Issue: several files carry too much view logic, state, and mutation orchestration in one place.
- Files: `src/views/admin/rooms/RoomDetail.tsx`, `src/views/portal/finance/InvoiceList.tsx`, `src/services/invoiceService.ts`, `src/services/utilityAdminService.ts`
- Impact: changes are risky, review is slower, and targeted testing is harder.
- Fix approach: extract presentational sections, query hooks, and sub-services by feature slice.

**Encoding instability / mojibake:**
- Issue: multiple files contain garbled Vietnamese text, and the repo already ships a detection script for it.
- Files: `src/stores/authStore.ts`, `src/components/ErrorBoundary.tsx`, `tests/01-smoke.spec.ts`, `scripts/find-mojibake.mjs`
- Impact: broken user-facing copy, confusing test output, and harder maintenance.
- Fix approach: run `npm run audit:encoding`, normalize affected files to UTF-8, and gate future regressions in CI.

## Known Bugs

**Tenant onboarding can never mark room handover complete:**
- Symptoms: onboarding completion stalls because `isRoomHandovered` is always false.
- Files: `src/services/portalOnboardingService.ts`
- Trigger: any resident going through onboarding completion checks
- Workaround: none in code beyond manual progression decisions elsewhere
- Root cause: the service comment confirms the schema has no handover timestamp/flag to compute this state

**Public listings fail closed when DB view is absent:**
- Symptoms: public listing pages silently show empty data instead of a hard failure.
- Files: `src/services/publicListingsService.ts`
- Trigger: missing or broken `public_room_listings` view
- Workaround: inspect browser console warnings
- Root cause: service intentionally catches and returns `[]` or `null`, masking the underlying environment issue

## Security Considerations

**Hardcoded Playwright credentials in repo:**
- Risk: test credentials are embedded in the committed Playwright auth bootstrap.
- Files: `tests/auth.setup.ts`
- Current mitigation: none in code
- Recommendations: move credentials to CI/local env vars and keep storage state and secrets out of source control

**Direct browser access to privileged backend operations:**
- Risk: the SPA talks straight to database tables and storage from the client, so policy mistakes become production security issues.
- Files: `src/lib/supabase.ts`, `src/services/*.ts`
- Current mitigation: reliance on Supabase auth and RLS
- Recommendations: keep RLS audits tight, move sensitive operations to Edge Functions, and avoid assuming client guards are sufficient

**Client-side admin password reset path is fragile:**
- Risk: password reset for another user relies on `supabase.auth.admin.updateUserById` from frontend code.
- Files: `src/services/userService.ts`
- Current mitigation: comment notes this should ideally use an Edge Function
- Recommendations: replace with a server-side function using service-role credentials only

## Performance Bottlenecks

**Large route chunks and heavy single-page components:**
- Problem: admin and portal screens such as room detail and invoice list are large and likely expensive to parse, render, and maintain.
- Files: `src/views/admin/rooms/RoomDetail.tsx`, `src/views/portal/finance/InvoiceList.tsx`, `src/views/admin/buildings/BuildingDetail.tsx`
- Cause: many concerns live in one file, with big JSX trees and inline handlers
- Improvement path: split into route-level shells plus focused subcomponents and hooks

**Client-side filtering after broad ticket fetches:**
- Problem: `ticketService.getTickets()` fetches broad result sets, then applies search, building, and SLA filters in memory.
- Files: `src/services/ticketService.ts`
- Cause: some filters are pushed into Supabase, but several are applied after hydration
- Improvement path: move more filters server-side or introduce dedicated views/RPCs for common dashboards

## Fragile Areas

**Auth bootstrap and route guard interaction:**
- Files: `src/App.tsx`, `src/stores/authStore.ts`, `src/routes/ProtectedRoute.tsx`, `src/components/auth/PortalAuthGuard.tsx`
- Why fragile: auth session resolution, role mapping, tenant stage logic, session expiry, and redirects are distributed across several modules
- Safe modification: change one branch at a time and verify owner, staff, super-admin, and tenant flows separately
- Test coverage: very thin; no deep automated guard matrix was detected

**File upload and storage assumptions:**
- Files: `src/services/fileService.ts`, `src/utils/security.ts`
- Why fragile: upload acceptance, magic-byte validation, bucket naming, public URL generation, and rate limiting all live in client code
- Safe modification: preserve MIME validation and bucket contract, then add regression tests around allowed and rejected file types
- Test coverage: no direct automated tests detected for upload validation

## Scaling Limits

**Browser-first data layer:**
- Current capacity: acceptable for moderate admin usage, but every complex screen depends on client bandwidth and Supabase round trips
- Limit: large datasets and complex dashboards will push more filtering, joins, and security concerns into the browser
- Scaling path: move heavier workflows into RPCs, views, or Edge Functions and reduce client-side post-processing

## Dependencies at Risk

**No repo-wide formatter enforcement:**
- Risk: style drift continues because only ESLint is enforced and it is mostly warning-based
- Impact: churny diffs and inconsistent conventions across modules
- Migration plan: add Prettier or a stricter ESLint formatting strategy and run it repo-wide

## Missing Critical Features

**Missing general CI quality gate:**
- Problem: GitHub Actions currently runs Playwright only
- Blocks: build, lint, and unit test regressions can land without automated checks
- Files: `.github/workflows/playwright.yml`, `package.json`

## Test Coverage Gaps

**Service layer and auth flows:**
- What's not tested: most Supabase services, auth store initialization, route guards, and onboarding decisions
- Files: `src/services/*.ts`, `src/stores/authStore.ts`, `src/routes/ProtectedRoute.tsx`, `src/components/auth/PortalAuthGuard.tsx`
- Risk: permission and data-shaping regressions can ship unnoticed
- Priority: High

**Large admin workflows:**
- What's not tested: contract creation wizard, room detail maintenance actions, utility admin flows, and billing admin screens
- Files: `src/views/admin/contracts/CreateContractWizard.tsx`, `src/views/admin/rooms/RoomDetail.tsx`, `src/views/admin/settings/BillingRunsPage.tsx`
- Risk: high-value business flows can break with no fast feedback
- Priority: High

---

*Concerns audit: 2026-04-26*
