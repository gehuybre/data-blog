# Testing Setup Guide

This project currently does not have a test framework configured. Test files have been created as examples of what should be tested, but they cannot run until a test framework is set up.

## Setting Up Tests

To enable testing in this project, follow these steps:

### 1. Install Test Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 2. Create Vitest Configuration

Create `vitest.config.ts` in the `embuild-analyses` directory:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 3. Create Test Setup File

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

### 4. Add Test Script to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 5. Run Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test run

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Files

The following test files have been created:

- `src/lib/__tests__/embed-config.test.ts` - Tests for embed configuration logic
- `src/components/analyses/shared/__tests__/ExportButtons.test.tsx` - Tests for export buttons component

## What Should Be Tested

### Critical Paths

1. **`getAllEmbedParams()`** - Ensures all embeds are discovered for static generation
2. **`isEmbeddable()`** - Prevents broken embed buttons
3. **URL parameter validation** - Prevents XSS/injection
4. **CSV export functionality** - Ensures data exports work correctly
5. **Embed code generation** - Validates iframe code is correct and secure

### Integration Tests

Consider adding integration tests for:
- Loading embed data dynamically
- Error handling for missing files
- Custom component registration
- URL parameter parsing

### End-to-End Tests

For full coverage, consider setting up Playwright or Cypress for:
- Testing actual embed rendering in iframe
- Verifying map interactions work
- Testing chart filtering functionality

## Best Practices

- Run tests before committing: `npm test run`
- Maintain high coverage for critical paths (>80%)
- Test error cases, not just happy paths
- Keep tests isolated and fast
- Mock external dependencies (file imports, API calls)
