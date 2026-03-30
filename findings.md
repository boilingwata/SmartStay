# Research Findings: Portal Mock Data

## 1. Meter Modules
- **File**: `src/views/portal/meters/MeterReadingList.tsx`
- **Current State**: 100% Mock. Local `currentReading` and `history` objects.
- **Rule Requirement**: RULE-01 (Must use `vw_LatestMeterReading` for `CurrentIndex`).
- **Missing**: A service to fetch current readings and history for the logged-in tenant's room.

## 2. Finance Modules
- **Files**: `src/views/portal/finance/PaymentHistory.tsx`, `src/views/portal/finance/BalanceDetail.tsx`
- **Current State**: Using `portalFinanceService`, but has hardcoded "fallback" cards when data is empty.
- **Refactor**: Remove fallbacks. Ensure `EmptyState` is shown instead.

## 3. Amenity Modules
- **File**: `src/views/portal/amenities/MyBookings.tsx`
- **Current State**: Using `useState(mockBookings)`.
- **Missing**: `portalAmenityService.ts` to fetch from `amenity_bookings` table.

## 4. DB Structures to Verify
- `vw_LatestMeterReading`: Exists? (Used in RULE-01).
- `amenity_bookings`: Needed for `MyBookings.tsx`.
- `balance_history`: Used in `portalFinanceService.ts`.

## 5. UI elements to fix
- `CreateAddendumModal.tsx`: Has a "Simulate Upload" button with hardcoded `mock_url`.
- `FileUpload.tsx`: Common mock pattern for URL creation.
