# Coding Conventions

**Analysis Date:** 2026-05-01

## Naming Patterns

**Files**
- React components and pages usually use `PascalCase.tsx`, for example `src/views/admin/rooms/RoomDetail.tsx` and `src/components/ui/Button.tsx`.
- Services, hooks, libs, schemas, and utilities usually use `camelCase.ts`, for example `src/services/ticketService.ts`, `src/hooks/useQueryWithBuilding.ts`, and `src/lib/supabaseHelpers.ts`.
- Unit tests use `*.test.ts`; Playwright tests use `*.spec.ts`.

**Types**
- Interfaces and type aliases use `PascalCase`, for example `RoomRow`, `PortalInvoiceDetail`, and `CreateRoomData`.
- DB row interfaces are often local to service files.
- Frontend-facing model types live in `src/models/`.

**Functions and Variables**
- Regular functions and variables use `camelCase`.
- React event handlers commonly use `handleX`.
- Constants use `UPPER_SNAKE_CASE` when they are static maps or config-like values, for example `TRUSTED_DOMAINS`.
- Some feature-heavy UI files use Vietnamese identifiers or inline Vietnamese copy; new shared abstractions should prefer English identifiers and i18n-backed user copy.

## Module Patterns

**Services**
- Pattern: imports, DTO/model types, row interfaces, transformer helpers, exported service object or named async functions.
- Services own Supabase select strings and row mapping.
- UI should consume frontend models, not raw database rows.
- Example files: `src/services/roomService.ts`, `src/services/contractService.ts`, `src/services/portalInvoiceService.ts`.

**Enum Mapping**
- DB enum strings should be mapped through `src/lib/enumMaps.ts` or domain-specific mappers such as `src/lib/assetMappers.ts`.
- UI code should avoid depending on raw DB enum values like `available`, `pending_payment`, or `super_admin`.

**Building Scope**
- Building-aware services should accept a building ID parameter and use `buildingScoped()` from `src/lib/supabaseHelpers.ts`.
- React Query consumers should prefer `src/hooks/useQueryWithBuilding.ts` when the active building changes query identity.
- Services should not directly read Zustand stores unless the surrounding file already established that pattern.

**Routes**
- Route trees are exported as `RouteObject[]`.
- Views are lazily imported through `React.lazy()`.
- `src/App.tsx` maps route arrays recursively.

## Code Style

**Formatting**
- No Prettier config was detected.
- The codebase mixes semicolon and no-semicolon styles.
- Follow the surrounding file style for scoped changes.
- Prefer concise comments only when explaining non-obvious business rules or integration behavior.

**Imports**
- Common order: external packages, `@/` alias imports, relative imports.
- Type-only imports are used in newer files, but not consistently.
- `@/` resolves to `src/` through `vite.config.ts` and TypeScript config.

**TypeScript**
- `tsconfig.app.json` uses strict settings, including `strict`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, and `noUncheckedSideEffectImports`.
- `any` still appears in several shared components, reports, services, and compatibility areas; avoid adding new `any` unless matching a local compatibility boundary.

## Error Handling

**Supabase Queries**
- Prefer `unwrap()` from `src/lib/supabaseHelpers.ts` for PostgREST responses.
- Preserve Supabase error details when useful.
- Guard invalid IDs before querying, as in `src/services/roomService.ts` and `src/services/contractService.ts`.

**React Query**
- Mutations rely on global error toasts in `src/lib/queryClient.ts`.
- Query and mutation errors are captured through Sentry helpers.
- Feature-level error copy should be user-facing Vietnamese where shown in UI.

**Fallbacks**
- Some services intentionally degrade for compatibility, such as `src/services/amenityAdminService.ts` falling back between `amenity_id` and `service_id`.
- If adding fallbacks, make the compatibility reason explicit and avoid hiding critical environment failures silently.

## UI Conventions

**Design System**
- Use local primitives in `src/components/ui/` and existing shared/domain components before adding new patterns.
- Tailwind tokens map to CSS variables in `src/index.css`.
- Icons should come from `lucide-react` when an icon exists.

**Copy and Localization**
- Vietnamese is the primary UI language.
- i18next resources are in `src/i18n/`; many older files still contain inline Vietnamese strings.
- Avoid introducing mojibake; run `npm run audit:encoding` when touching Vietnamese-heavy files.

**Layout**
- Operational screens favor dense, scannable layouts.
- Existing SmartStay design direction favors split workspaces for complex selection flows, especially building -> room -> tenant selection in contract creation.

## State and Side Effects

**Global State**
- Use Zustand stores only for session/UI/notification/permission state.
- Use React Query for server data rather than mirroring remote collections in Zustand.

**Auth**
- Auth initialization belongs to `src/stores/authStore.ts`.
- Route-level decisions belong in guards or `src/lib/authRouting.ts`.
- Do not rely only on client guards for sensitive backend authorization.

**Network Recovery**
- Supabase fetch retry and hard timeout behavior is centralized in `src/lib/supabase.ts`.
- React Query recovery listeners are centralized in `src/lib/queryClient.ts`.

## Testing Conventions

**Unit Tests**
- Co-locate pure logic tests beside source when practical.
- Use Vitest `describe`, `it`, and `expect`.
- Keep fixtures inline unless repeated enough to justify factories.

**E2E Tests**
- Put browser flows under `tests/`.
- Playwright auth setup writes `playwright/.auth/user.json`.
- Current E2E suite expects a working Supabase-backed app and demo/test account.

## Comments and Documentation

**Good Comment Targets**
- Business rule rationale.
- Compatibility fallbacks.
- Transaction boundaries.
- Security-sensitive assumptions.

**Avoid**
- Comments that restate simple assignments.
- Large unrelated refactors while implementing feature work.
- Updating generated Supabase types manually unless regenerating from schema.

---

*Convention analysis: 2026-05-01*
