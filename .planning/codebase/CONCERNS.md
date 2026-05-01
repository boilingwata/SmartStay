# Codebase Concerns

**Analysis Date:** 2026-05-01

## Tech Debt

**Documentation route drift**
- Issue: some repo guidance still describes `/admin/*` as a primary namespace, while the live app uses `/owner/*` for owner/staff and redirects legacy `/admin/*` paths.
- Files: `AGENTS.md`, `src/App.tsx`, `src/routes/ownerRoutes.tsx`
- Impact: planning, tests, and onboarding can target stale routes.
- Fix approach: update docs to reflect `/owner/*`, `/super-admin/*`, `/portal/*`, and current legacy redirects.

**Oversized service and view modules**
- Issue: several files mix data fetching, transformation, UI state, mutation handling, and presentation.
- Files: `src/services/invoiceService.ts`, `src/services/utilityAdminService.ts`, `src/services/tenantService.ts`, `src/views/admin/rooms/RoomDetail.tsx`, `src/views/portal/finance/InvoiceList.tsx`
- Impact: higher regression risk and slower review.
- Fix approach: extract focused hooks, service submodules, and presentational components around stable seams.

**Mojibake / encoding instability**
- Issue: garbled Vietnamese text appears in multiple source and test files, while the repo already has `npm run audit:encoding`.
- Files: `src/stores/authStore.ts`, `src/components/auth/PortalAuthGuard.tsx`, `src/lib/queryClient.ts`, `tests/01-smoke.spec.ts`, `playwright.config.ts`
- Impact: broken UI copy, confusing logs, brittle text selectors.
- Fix approach: normalize touched files to UTF-8 and add encoding audit to CI.

**`any` and compatibility casts**
- Issue: `any` remains common in reports, shared table/select components, schema-compat services, and Supabase RPC boundaries.
- Files: `src/components/shared/DataTable.tsx`, `src/components/ui/Select.tsx`, `src/services/amenityAdminService.ts`, `src/services/tenantService.ts`, `src/views/admin/reports/*.tsx`
- Impact: TypeScript catches fewer integration errors.
- Fix approach: narrow types around shared components and isolate untyped Supabase compatibility areas.

## Known Risks and Bugs

**Hardcoded E2E login credentials**
- Risk: `tests/auth.setup.ts` includes a concrete email/password.
- Impact: credential leakage and inflexible CI setup.
- Fix approach: read from environment variables and fail with a clear message when missing.

**Client-heavy security model**
- Risk: the SPA directly accesses Supabase tables from the browser.
- Files: `src/lib/supabase.ts`, `src/services/*.ts`
- Mitigation: RLS, route guards, RPC hardening, and Edge Function auth.
- Concern: any RLS gap becomes production exposure because client guards are not security boundaries.

**Edge Functions configured with `verify_jwt = false`**
- Risk: disabled platform JWT verification puts full responsibility on function-level auth.
- Files: `supabase/config.toml`, `supabase/functions/_shared/auth.ts`, `supabase/functions/sepay-webhook/index.ts`
- Current mitigation: operator functions call `requireWorkspaceOperator()` and webhooks validate API keys.
- Fix approach: keep an audit list of every public function and its custom auth path.

**Incomplete CI quality gates**
- Risk: GitHub Actions runs Playwright only.
- Files: `.github/workflows/playwright.yml`, `package.json`
- Impact: type, lint, and unit test regressions can merge without automated feedback.
- Fix approach: add `npm run build`, `npm run lint`, and `npm run test` to CI.

## Security Considerations

**Admin/service-role actions**
- Sensitive operations include user creation, contract creation, payment processing, resident activation, and utility invoice generation.
- Files: `supabase/functions/create-user/index.ts`, `supabase/functions/create-contract/index.ts`, `supabase/functions/process-payment/index.ts`, `supabase/functions/activate-resident/index.ts`, `supabase/functions/create-utility-invoice/index.ts`
- Recommendation: keep privileged paths behind Edge Functions or RPCs with explicit role checks; avoid adding direct browser service-role assumptions.

**Storage and URL safety**
- Client-side URL validation is in `src/utils/security.ts`.
- File upload logic is in `src/services/fileService.ts`.
- Risk remains if storage policies or trusted domain lists drift from production needs.

**Webhook handling**
- Payment webhook handlers use provider API keys and demo bypass flags.
- Files: `supabase/functions/sepay-webhook/index.ts`, `supabase/functions/webhook-payment/index.ts`
- Recommendation: keep demo mode disabled outside controlled environments and audit logs for webhook failures.

## Performance Bottlenecks

**Large route chunks**
- Big route-level pages and services can increase parse/render cost and make hot paths harder to optimize.
- Files: `src/views/portal/finance/InvoiceList.tsx`, `src/views/admin/rooms/RoomDetail.tsx`, `src/views/admin/buildings/BuildingDetail.tsx`
- Fix approach: split route shells from heavy panels, modals, and hooks.

**Client-side post-processing**
- Some services fetch broad data and filter or reshape in memory.
- Files: `src/services/ticketService.ts`, `src/services/tenantService.ts`, `src/services/reportService.ts`
- Fix approach: push common filters into Supabase queries, views, or RPCs.

**Dashboard/report queries**
- Reporting screens use broad typed-as-any data flows.
- Files: `src/views/admin/reports/*.tsx`, `src/services/reportService.ts`
- Fix approach: define stable report DTOs and backend views for heavy aggregations.

## Fragile Areas

**Auth bootstrap and redirects**
- Files: `src/App.tsx`, `src/stores/authStore.ts`, `src/lib/authRouting.ts`, `src/routes/ProtectedRoute.tsx`, `src/components/auth/PortalAuthGuard.tsx`
- Why fragile: session refresh, role mapping, tenant stage, onboarding gating, and redirect sanitization are spread across modules.
- Verification needed: owner, staff, super-admin, prospect tenant, pending resident, active resident.

**Contract lifecycle**
- Files: `src/services/contractService.ts`, `src/views/admin/contracts/CreateContractWizard.tsx`, `supabase/migrations/*contract*.sql`
- Why fragile: room occupancy, representative tenant, occupants, deposit, utility policy, services, owner legal confirmation, addendums, transfers, and liquidation all interact.
- Verification needed: create, detail, add occupant, remove occupant, transfer representative, terminate/liquidate.

**Utility and asset billing**
- Files: `src/lib/utilityBilling.ts`, `src/services/utilityBillingService.ts`, `src/services/utilityAdminService.ts`, `supabase/functions/_shared/utilityInvoiceBuilder.ts`
- Why fragile: policy inheritance, overrides, device adjustments, prorating, rounding, asset lines, and invoice persistence must match across frontend and Edge Function code.

**Amenity governance compatibility**
- Files: `src/services/amenityAdminService.ts`, `src/services/domainSchemaCompat.ts`, `src/views/admin/settings/amenity-components/*.tsx`
- Why fragile: code supports both newer `amenity_id` and legacy `service_id` schema shapes.

## Missing or Thin Tests

**High-risk gaps**
- Auth store and route guard matrix.
- Supabase service mapping and permission errors.
- Contract wizard and contract lifecycle.
- Payment confirmation and webhook edge cases.
- Amenity policy version/review/exception flows.
- Super-admin access behavior.

**Existing strengths**
- Pure utility billing and asset line tests.
- URL sanitization tests.
- Notification normalization tests.
- Basic owner Playwright flows.

## Maintenance Recommendations

1. Add CI steps for build, lint, unit tests, and encoding audit.
2. Move Playwright credentials to environment variables.
3. Update route documentation to match `/owner/*`.
4. Track every `verify_jwt = false` function with its custom auth mechanism.
5. Gradually type high-value `any` boundaries as features are touched.
6. Split the largest service/view modules only when working in those areas.

---

*Concerns audit: 2026-05-01*
