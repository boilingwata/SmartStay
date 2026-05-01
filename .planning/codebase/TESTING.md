# Testing Patterns

**Analysis Date:** 2026-05-01

## Test Frameworks

**Unit Tests**
- Runner: Vitest 0.34 from `package.json`.
- Config: no dedicated `vitest.config.ts` detected; Vite/Vitest defaults apply.
- Assertion API: Vitest `expect`.
- Common command: `npm run test`.

**Browser / E2E Tests**
- Runner: Playwright 1.40.
- Config: `playwright.config.ts`.
- Browser project: Chromium with saved storage state from `tests/auth.setup.ts`.
- Common command: `npm run e2e`.

**React Testing Library**
- Installed as `@testing-library/react` and `@testing-library/jest-dom`, but active component-test usage is minimal in the current tree.

## Run Commands

```bash
npm run test
npx vitest run src/path/to/file.test.ts
npm run e2e
npm run test:smoke
npm run build
npm run lint
```

`npm run build` performs TypeScript project build plus Vite production build. `npm run lint` uses ESLint with `--max-warnings 0`.

## Test File Organization

**Unit Tests**
- `src/lib/assetBilling.test.ts`
- `src/utils/security.test.ts`
- `src/utils/notificationUtils.test.ts`
- `tests/admin/utilityBilling.test.ts`
- `tests/admin/utilityPresentation.test.ts`

**Playwright Tests**
- `tests/auth.setup.ts`
- `tests/01-smoke.spec.ts`
- `tests/admin/02-buildings-and-rooms.spec.ts`
- `tests/admin/03-owner-tickets.spec.ts`

## Unit Test Patterns

**Pure Logic Tests**
- Best-covered areas are pure helpers:
  - `src/lib/assetBilling.ts`
  - `src/lib/invoiceItems.ts`
  - `src/lib/utilityBilling.ts`
  - `src/lib/utilityPresentation.ts`
  - `src/utils/security.ts`
  - `src/utils/notificationUtils.ts`

**Typical Shape**
```typescript
import { describe, expect, it } from 'vitest';

describe('module behavior', () => {
  it('handles a concrete case', () => {
    expect(result).toBe(expected);
  });
});
```

**Fixtures**
- Mostly inline object literals.
- No shared factories or fixture modules were detected.

## Playwright Patterns

**Auth Setup**
- `tests/auth.setup.ts` signs in through `/login`.
- It currently uses a committed owner email/password pair.
- The storage state is written to `playwright/.auth/user.json`.

**Configuration**
- Tests run against `http://127.0.0.1:5173`.
- Playwright starts `npm run dev` automatically.
- `fullyParallel` is `false`; `workers` is set to `1`.
- Chromium project depends on the setup project.

**Flow Style**
- Tests navigate to role-specific routes such as `/owner/dashboard`, `/owner/buildings`, and `/owner/rooms`.
- Assertions use visible headings, tables, cards, forms, and toast text.
- Some tests are serial because they create and clean up state.

## CI Coverage

**GitHub Actions**
- Workflow: `.github/workflows/playwright.yml`
- Runs on pushes and pull requests to `main` and `master`.
- Steps: checkout, setup Node 18, `npm install`, install Playwright browsers, run `npx playwright test`, upload Playwright report.

**Current CI Gaps**
- No explicit `npm run build` step.
- No explicit `npm run lint` step.
- No explicit `npm run test` Vitest step.
- No coverage threshold or report upload for unit tests.

## Mocking

**Current State**
- Little active Vitest mocking was detected.
- Most unit tests target pure functions and avoid network/browser mocks.

**When Adding Tests**
- Mock Supabase for service and hook tests.
- Mock auth state and time for route guards, billing, and session logic.
- Prefer pure function extraction when service/view logic is hard to test.

**Avoid Mocking**
- Pure enum, presentation, and calculation helpers.
- The input/output shape under test when the function is already deterministic.

## Coverage Strengths

**Good Existing Coverage**
- URL sanitization and trusted-domain behavior in `src/utils/security.test.ts`.
- Notification type normalization and style fallback in `src/utils/notificationUtils.test.ts`.
- Utility billing math and seasonal/device/override behavior in `tests/admin/utilityBilling.test.ts`.
- Asset charge generation and invoice item type fallback in `src/lib/assetBilling.test.ts`.
- Basic owner smoke and building/room browser flows in Playwright.

## Coverage Gaps

**High Priority**
- Auth store initialization and role resolution in `src/stores/authStore.ts`.
- Guard behavior in `src/routes/ProtectedRoute.tsx` and `src/components/auth/PortalAuthGuard.tsx`.
- Supabase service mapping and error handling in `src/services/*.ts`.
- Contract creation, transfer, addendum, and liquidation flows.
- Utility admin screens and batch billing workflows.
- Amenity policy creation/edit/version/review flows.
- Super admin routes and authorization behavior.

**Medium Priority**
- File upload validation and storage paths in `src/services/fileService.ts`.
- Network recovery behavior in `src/lib/supabase.ts` and `src/lib/queryClient.ts`.
- Public listing apply flow and owner lead conversion.
- Realtime hooks under `src/hooks/`.

## Test Data Risks

**Hardcoded Credentials**
- `tests/auth.setup.ts` contains an owner test credential.
- This should be moved to environment variables before broader CI or shared deployments.

**Live Backend Coupling**
- Playwright tests depend on a reachable Supabase-backed app and seeded data.
- Failures may indicate environment drift rather than frontend regression.

**Serial State**
- Some E2E tests create/update/delete records; keep them serial unless they are made isolated by unique test data and cleanup.

---

*Testing analysis: 2026-05-01*
