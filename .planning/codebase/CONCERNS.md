# Concerns

## Technical Debt & Issues
- **Vietnamese Encoding (Mojibake)**: Some older wizard components (like `CreateContractWizard.tsx`) have corrupted Vietnamese strings that need manual correction.
- **Supabase Schema Drift**: The generated types in `src/types/supabase.ts` can become out of sync with the actual database schema if migrations aren't followed by a type regeneration.
- **Routing Complexity**: The application has several legacy redirects and a complex routing structure spanning multiple namespaces (Admin, Portal, Public).

## Domain Logic Complexity
- **Utility Billing**: The transition from policy-based billing to potential meter-based models introduces complexity in the service layer and database schema.
- **Financial Atomicity**: Ensuring that multi-step financial operations (like creating an invoice and updating a balance) remain atomic across distributed frontend calls.

## UI/UX Consistency
- **Component Reusability**: Some components are duplicated across Admin and Portal views and should be refactored into `src/components/shared`.
- **Performance**: As the number of buildings and rooms grows, some dashboard queries may need optimization (e.g., better pagination or Supabase views).
