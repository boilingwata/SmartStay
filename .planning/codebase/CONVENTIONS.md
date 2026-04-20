# Conventions

## Coding Standards
- **TypeScript**: Strict typing is required. Avoid `any`. Use interfaces in `src/models` for domain objects.
- **Path Aliases**: Always use `@/` for absolute imports from the `src` directory.
- **Lazy Loading**: All view components in `App.tsx` must be lazy-loaded using `React.lazy()` for optimized bundle size.
- **Custom Hooks**: Encapsulate complex logic in hooks (e.g., `useQueryWithBuilding` for building-scoped data).

## UI & Design
- **Shadcn UI**: Follow the established pattern for adding new UI primitives to `src/components/ui`.
- **Naming**: Use PascalCase for components and camelCase for functions and variables.
- **Tailwind CSS**: Use Tailwind utilities for styling. Avoid inline styles or complex CSS files where possible.

## Localization
- **i18next**: User-facing strings should be externalized to localization files in `src/i18n`. Vietnamese is the primary language.

## Data Access
- **Service Layer**: Components should not call Supabase directly. Use services in `src/services`.
- **Enum Mapping**: Use the bidirectional mappers in `src/lib/enumMaps.ts` to convert between DB values and UI labels.
- **React Query**: Use `useQuery` and `useMutation` for server state. Use the Query Key factory pattern where applicable.
