# Coding Conventions

**Analysis Date:** 2026-04-26

## Naming Patterns

**Files:**
- `PascalCase.tsx` for most React views and components, for example `src/views/admin/rooms/RoomDetail.tsx` and `src/components/ui/Button.tsx`.
- `camelCase.ts` for services, hooks, libs, and schemas, for example `src/services/ticketService.ts`, `src/hooks/useQueryWithBuilding.ts`, `src/lib/supabaseHelpers.ts`.
- Test files use `*.test.ts` and Playwright uses `*.spec.ts`.

**Functions:**
- `camelCase` for helpers and service methods such as `buildStatus`, `getRooms`, `updateStatus`.
- React event handlers usually use `handleX` naming, though Vietnamese names also appear in feature-heavy screens such as `taiHoSoPhapLy` and `sangBuocSau` in `src/views/admin/contracts/CreateContractWizard.tsx`.
- Async functions are not prefixed specially.

**Variables:**
- `camelCase` for regular locals and state.
- `UPPER_SNAKE_CASE` for constants such as `STORAGE_STATE`, `TRUSTED_DOMAINS`, and `DB_TICKET_STATUSES`.
- Some files mix English and Vietnamese identifiers, especially in UI-heavy pages.

**Types:**
- Interfaces and type aliases use `PascalCase` without `I` prefixes, for example `ProfileRow`, `PortalOnboardingStatus`, `CreateTicketInput`.
- Enum-like unions also use `PascalCase` type names, while runtime values are string literals.

## Code Style

**Formatting:**
- No Prettier config detected.
- Codebase currently mixes semicolon-heavy and semicolon-light styles; new code tends to follow the surrounding file rather than a repo-wide formatter.
- Quotes are mixed but single quotes are common in newer TypeScript files.

**Linting:**
- ESLint via `.eslintrc.json`
- Key rules: `no-console` warn, `@typescript-eslint/no-explicit-any` warn, `react-refresh/only-export-components` warn
- Run: `npm run lint`

## Import Organization

**Order:**
1. External packages
2. Internal alias imports from `@/`
3. Relative imports
4. Type imports are sometimes separated, but not consistently

**Grouping:**
- Blank lines between groups are common in newer files such as `src/services/ticketService.ts`.
- Alphabetical sorting is not enforced.

**Path Aliases:**
- `@/*` maps to `src/*` from `tsconfig.json` and `vite.config.ts`.

## Error Handling

**Patterns:**
- Prefer service-level throws using `unwrap()` from `src/lib/supabaseHelpers.ts`.
- UI mutations often rely on React Query `onError` plus `sonner` toasts.
- Some boundary cases intentionally swallow failures and return empty data or warnings, for example `src/services/publicListingsService.ts`.

**Error Types:**
- Standard `Error` objects dominate; custom error classes were not detected.
- Services often convert Supabase messages into end-user strings before throwing.
- Guard clauses are common for invalid IDs and missing auth context.

## Logging

**Framework:** `console` plus Sentry.

**Patterns:**
- Runtime error reporting goes through `captureException()` in `src/lib/sentry.ts`.
- Console logging and warnings still exist in auth flows, services, and security helpers.
- There is no structured logger abstraction yet.

## Comments

**When to Comment:**
- Comments usually explain business rules, temporary gaps, or implementation warnings.
- Examples: onboarding limitations in `src/services/portalOnboardingService.ts`, routing notes in `src/views/layouts/Layouts.tsx`.
- Some comments are architectural breadcrumbs left by previous refactors.

**JSDoc/TSDoc:**
- Sparse. Short block comments exist on helpers and utilities, but full API docs are not common.

## Function Design

**Size:**
- Utility modules stay compact, but some view and service files are very large, for example `src/views/admin/rooms/RoomDetail.tsx` and `src/services/invoiceService.ts`.
- Large files often keep multiple responsibilities together rather than extracting submodules.

**Parameters:**
- Services usually accept a single options object or a small number of positional arguments.
- Form-heavy pages pass many props into step components instead of giant prop bags on one component.

**Return Values:**
- Early returns are common for guards.
- Service methods usually return frontend model objects rather than raw Supabase rows.

## Module Design

**Exports:**
- Named exports are common for services, helpers, and route arrays.
- Default exports are common for React pages and a few service modules.

**Barrel Files:**
- Present selectively, for example `src/views/layouts/index.ts` and `src/hooks/index.ts`.
- Not a strict convention; many modules are imported directly from source files.

---

*Convention analysis: 2026-04-26*
