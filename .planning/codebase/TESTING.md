# Testing

## Unit & Integration Testing
- **Vitest**: The primary test runner for unit and integration tests.
- **Testing Library**: Used for component testing.
- **Location**: Tests are co-located with their components/services or in a dedicated `__tests__` directory.
- **Command**: `npm run test`

## End-to-End (E2E) Testing
- **Playwright**: Used for testing critical user flows (Login, Onboarding, Contract creation).
- **Location**: E2E tests are located in the `tests/` root directory.
- **Command**: `npm run e2e`

## Quality Checks
- **ESLint**: Configured to enforce coding standards. Zero warnings tolerance.
- **TypeScript**: `tsc -b` is run during build to ensure type safety.
- **Command**: `npm run lint`
