# Architecture

## Application Overview
SmartStay BMS is a Single Page Application (SPA) designed for Building Management with a multi-role structure (Owner/Staff and Tenants).

## High-Level Architecture
1. **Routing Layer (React Router v7)**: Manages navigation and implements namespace-based auth guards.
2. **View Layer (React)**: Component-based UI organized by role-based namespaces.
3. **Service Layer**: Decoupled API logic that interacts with Supabase. Each domain has a dedicated service.
4. **State Layer (Zustand)**: Persistent global state for authentication, UI preferences, and building context.
5. **Data Access Layer (TanStack Query)**: Manages server state, caching, and optimistic updates.

## Key Design Patterns
- **Role-Based Access Control (RBAC)**: Enforced via `ProtectedRoute` (Admin) and `PortalAuthGuard` (Tenant).
- **Building Scoping**: Admin views are globally scoped to an `activeBuildingId` stored in `uiStore`.
- **Enum Mapping**: Bidirectional mapping between DB enum values and UI-friendly labels via `src/lib/enumMaps.ts`.
- **Atomic Financial Operations**: Complex financial logic (billing, payments) is delegated to Supabase RPCs or Edge Functions to ensure atomicity.

## Data Flow
`Supabase` -> `TypeScript Services` -> `TanStack Query` -> `React Components`
