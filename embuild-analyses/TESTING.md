# Testing Guide

## Test Coverage Needed

This document outlines test coverage that should be added when a testing framework (Jest/Vitest) is set up for this project.

### Priority: Type Safety Helpers (`embed-types.ts`)

The following functions need comprehensive test coverage to ensure runtime validation works correctly:

#### `isKnownMetric()`
Tests for validating metric key recognition:

```typescript
describe('isKnownMetric', () => {
  it('should return true for valid metric "ren"', () => {
    expect(isKnownMetric('ren')).toBe(true)
  })

  it('should return true for valid metric "new"', () => {
    expect(isKnownMetric('new')).toBe(true)
  })

  it('should return false for invalid metric "typo123"', () => {
    expect(isKnownMetric('typo123')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isKnownMetric('')).toBe(false)
  })

  it('should return false for non-string values', () => {
    expect(isKnownMetric('REN')).toBe(false) // Case sensitivity
  })
})
```

#### `getMetricValue()`
Tests for error handling and value extraction:

```typescript
describe('getMetricValue', () => {
  const validRow: StandardEmbedDataRow = {
    m: 11001,
    y: 2024,
    q: 1,
    ren: 10,
    new: 5
  }

  it('should extract valid metric value', () => {
    expect(getMetricValue(validRow, 'ren')).toBe(10)
    expect(getMetricValue(validRow, 'new')).toBe(5)
  })

  it('should throw helpful error for unknown metric', () => {
    expect(() => getMetricValue(validRow, 'typo123')).toThrow(
      'Unknown metric key: "typo123". Expected one of: ren, new. Add new metrics to KnownMetricKey type in embed-types.ts'
    )
  })

  it('should throw error for non-number values', () => {
    const invalidRow = { ...validRow, ren: 'not-a-number' as any }
    expect(() => getMetricValue(invalidRow, 'ren')).toThrow(
      'Expected number for metric "ren"'
    )
  })

  it('should throw error for missing metric', () => {
    const incompleteRow = { m: 11001, y: 2024, q: 1 } as StandardEmbedDataRow
    expect(() => getMetricValue(incompleteRow, 'ren')).toThrow()
  })
})
```

#### `transformToEmbedDataRows()` (from `embed-data-transformers.ts`)
Tests to ensure transformation and validation work together:

```typescript
describe('transformToEmbedDataRows', () => {
  const validData: StandardEmbedDataRow[] = [
    { m: 11001, y: 2024, q: 1, ren: 10, new: 5 },
    { m: 11001, y: 2024, q: 2, ren: 15, new: 7 }
  ]

  it('should transform valid data with "ren" metric', () => {
    const result = transformToEmbedDataRows(validData, 'ren')
    expect(result).toEqual([
      { label: '2024-Q1', value: 10, periodCells: [2024, 1] },
      { label: '2024-Q2', value: 15, periodCells: [2024, 2] }
    ])
  })

  it('should transform valid data with "new" metric', () => {
    const result = transformToEmbedDataRows(validData, 'new')
    expect(result).toEqual([
      { label: '2024-Q1', value: 5, periodCells: [2024, 1] },
      { label: '2024-Q2', value: 7, periodCells: [2024, 2] }
    ])
  })

  it('should throw error for invalid metric key', () => {
    expect(() => transformToEmbedDataRows(validData, 'invalid')).toThrow(
      'Unknown metric key: "invalid"'
    )
  })

  it('should handle empty array', () => {
    expect(transformToEmbedDataRows([], 'ren')).toEqual([])
  })
})
```

### Additional Test Coverage

#### Validation Functions
- `validateMunicipalityData()` - Test valid/invalid municipality arrays
- `validateEmbedDataRows()` - Test valid/invalid embed data rows
- `validateStandardEmbedDataRow()` - Test required fields (m, y, q) and metric validation

#### Type Guards
- `isMunicipalityData()` - Test type checking logic
- `isEmbedDataRow()` - Test periodCells optional handling

## Setting Up Testing

### Recommended: Vitest

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Alternative: Jest

```bash
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom
```

## Integration with CI/CD

Add test step to GitHub Actions workflow before build:
```yaml
- name: Run tests
  run: npm test
```
