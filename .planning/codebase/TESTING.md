# Testing Patterns

**Analysis Date:** 2026-04-26

## Test Framework

**Runner:**
- Vitest 0.34 from `package.json`
- Config: no dedicated `vitest.config.ts` detected; tests run off default Vitest behavior
- Playwright 1.40 for browser E2E in `playwright.config.ts`

**Assertion Library:**
- Vitest built-in `expect`
- Playwright built-in `expect`

**Run Commands:**
```bash
npm run test                                # Run Vitest
npx vitest run src/path/to/file.test.ts     # Run one unit test file
npm run e2e                                 # Run all Playwright tests
npm run test:smoke                          # Run the smoke Playwright suite
```

## Test File Organization

**Location:**
- Unit tests are colocated in `src/`, for example `src/utils/security.test.ts` and `src/lib/assetBilling.test.ts`.
- Browser tests live in the separate `tests/` tree.

**Naming:**
- Unit tests: `*.test.ts`
- Playwright flows: `*.spec.ts`
- Playwright bootstrap: `*.setup.ts`

**Structure:**
```text
src/
  lib/
    assetBilling.ts
    assetBilling.test.ts
  utils/
    security.ts
    security.test.ts
tests/
  auth.setup.ts
  01-smoke.spec.ts
  admin/
    02-buildings-and-rooms.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
describe('moduleName', () => {
  it('handles the target case', () => {
    expect(result).toBe(expected);
  });
});
```

**Patterns:**
- Unit tests are straightforward behavior checks with minimal shared setup.
- Playwright uses scenario-style tests with explicit page navigation and UI assertions.
- `tests/auth.setup.ts` prepares a persisted storage state and Playwright projects depend on it.

## Mocking

**Framework:** Vitest `vi` is available, but little active mocking was detected in the current unit test set.

**Patterns:**
```typescript
import { describe, it, expect } from 'vitest';

describe('getNormalizedHttpUrl', () => {
  it('returns null for invalid inputs', () => {
    expect(getNormalizedHttpUrl('javascript:alert(1)')).toBeNull();
  });
});
```

**What to Mock:**
- External network, Supabase, file upload, and browser APIs when adding unit tests for services or hooks.
- Time and auth state for billing or portal workflow logic.

**What NOT to Mock:**
- Pure transformation helpers in `src/lib/` and `src/utils/`.
- String normalization and enum-mapping functions.

## Fixtures and Factories

**Test Data:**
- Current tests mostly inline their fixtures directly in each file.
- No shared `tests/fixtures/` or `tests/factories/` pattern was detected.

**Location:**
- Local constants inside each test file
- Browser auth fixture persisted to `playwright/.auth/user.json`

## Coverage

**Requirements:**
- No enforced coverage threshold detected.
- No CI step runs Vitest today.

**Configuration:**
- No explicit Vitest coverage config detected.
- Coverage appears ad hoc rather than gated.

**View Coverage:**
```bash
npx vitest run
npx vitest run --coverage
```

## Test Types

**Unit Tests:**
- Narrow utility coverage for URL security, notification normalization, and invoice/asset billing helpers.
- Examples: `src/utils/security.test.ts`, `src/utils/notificationUtils.test.ts`, `src/lib/assetBilling.test.ts`

**Integration Tests:**
- Some browser tests exercise integrated owner flows against a running app and real backend environment.
- Service-layer integration tests against Supabase were not detected.

**E2E Tests:**
- Playwright is the main end-to-end strategy.
- Config in `playwright.config.ts` runs one browser worker with auth setup and a local Vite server.

## Common Patterns

**Async Testing:**
```typescript
test('Critical Path: Dashboard & Navigation', async ({ page }) => {
  await page.goto('/owner/dashboard');
  await expect(page).toHaveURL(/.*\/owner\/dashboard/);
});
```

**Error Testing:**
```typescript
it('should return null for unsafe protocols', () => {
  expect(getNormalizedHttpUrl('javascript:alert(1)')).toBeNull();
});
```

**Snapshot Testing:**
- Not used.

---

*Testing analysis: 2026-04-26*
