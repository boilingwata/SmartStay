# Structure

## Directory Overview
- `src/views/`: Page components grouped by role/namespace.
    - `admin/`: Owner and staff dashboards.
    - `portal/`: Tenant-facing portal.
    - `auth/`: Login, registration, and password recovery.
    - `public/`: Landing page and public listings.
    - `layouts/`: Shared layout templates.
- `src/components/`: Reusable UI elements.
    - `ui/`: Shadcn primitive components (buttons, inputs, etc.).
    - `shared/`: Composite components used across different views.
- `src/services/`: Domain-specific API interaction logic.
- `src/stores/`: Zustand store definitions.
- `src/hooks/`: Custom React hooks (e.g., `useQueryWithBuilding`, `useConfirm`).
- `src/lib/`: Core utilities and configurations (Supabase client, i18n, enum maps).
- `src/models/`: TypeScript interfaces representing the frontend data model.
- `src/schemas/`: Zod schemas for validation.
- `src/types/`: Generated Supabase types and shared type definitions.
- `supabase/`: Local Supabase configuration and database migrations.
