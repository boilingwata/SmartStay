# Task Plan: Clean Mock Data & Sync Supabase (Portal Module)

## Goal
Systematically remove hardcoded mock data from the Tenant Portal (Meters, Finance, Amenities) and replace it with real data fetched via TanStack Query and Supabase Services, adhering to `rule.md`.

## Phases

### Phase 1: Research & Discovery [/]
- [x] Audit `MeterReadingList.tsx`, `PaymentHistory.tsx`, `BalanceDetail.tsx`, `MyBookings.tsx`.
- [x] Check existing services (`portalFinanceService.ts`).
- [ ] Identify missing DB views/tables for Meters and Amenities.
- [ ] Scan for other "Simulate" buttons or local mocks in the portal.

### Phase 2: Implementation Plan [ ]
- [ ] Create `implementation_plan.md` with specific file diffs and service signatures.
- [ ] Obtain user approval.

### Phase 3: Service Layer Updates [ ]
- [ ] Implement `portalMeterService.ts` (using `vw_LatestMeterReading`).
- [ ] Implement `portalAmenityService.ts` for amenity bookings.
- [ ] Update `portalFinanceService.ts` if needed.

### Phase 4: UI Refactoring [ ]
- [ ] Update `MeterReadingList.tsx` to use `useQuery`.
- [ ] Remove fallback mocks from `PaymentHistory.tsx` and `BalanceDetail.tsx`.
- [ ] Update `MyBookings.tsx` to use `useQuery`.
- [ ] Ensure "Empty States" are premium and styled correctly.

### Phase 5: Verification & Cleanup [ ]
- [ ] Test with local dev server.
- [ ] Remove unused mock files/imports.
- [ ] Create walkthrough.

## Decisions
- Use `useQuery` for all data fetching.
- Strictly follow RULE-01 (Meters) and RULE-07 (Ledger).
- Keep design premium (glassmorphism, animations).

## Errors Encountered
- `rule.md` not found at root (found at `.agents/rules/rule.md`).
