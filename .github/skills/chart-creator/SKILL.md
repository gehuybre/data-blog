---
name: chart-creator
description: Create charts and data visualizations for blog posts. Use when the user asks to add a chart, create a graph, visualize data, or add a FilterableChart component. This includes bar charts, line charts, area charts, composed charts (bar+line), time series visualizations, and multi-series comparisons.
---

# Chart Creator

## Overview

This skill guides you through creating data visualizations using the FilterableChart component, which supports multiple chart types with consistent styling, moving averages, and multi-series comparisons.

## Chart Types

FilterableChart supports 4 chart types:

| Type | Single Metric | Multi-Series | Best For |
|------|---------------|--------------|----------|
| `composed` | Bar + Line (MA) | Lines | Quarterly data with trend |
| `line` | Line + Line (MA) | Lines | Continuous trends |
| `bar` | Bar only | Grouped bars | Categorical comparison |
| `area` | Filled area + Line (MA) | Stacked areas | Cumulative/volume data |

## Quick Start

### Basic Line Chart

```typescript
import { FilterableChart } from "@/components/analyses/shared/FilterableChart"

<FilterableChart
  data={data}
  chartType="line"
  getLabel={(d) => d.period}
  getValue={(d) => d.amount}
  yAxisLabel="Amount"
/>
```

### Bar Chart with Moving Average

```typescript
<FilterableChart
  data={quarterlyData}
  chartType="composed"  // Bar + Line (default)
  getLabel={(d) => `${d.year} Q${d.quarter}`}
  getValue={(d) => d.value}
  showMovingAverage={true}  // 4-period moving average
  yAxisLabel="Units"
/>
```

### Area Chart for Cumulative Data

```typescript
<FilterableChart
  data={cumulativeData}
  chartType="area"
  getLabel={(d) => d.month}
  getValue={(d) => d.total}
  isCurrency={true}  // Format as € currency
  yAxisLabel="Total Revenue"
/>
```

### Multi-Series Comparison

```typescript
<FilterableChart
  data={comparisonData}
  series={[
    { key: 'vlaanderen', label: 'Vlaanderen', color: 'var(--color-chart-1)' },
    { key: 'brussel', label: 'Brussel', color: 'var(--color-chart-2)' },
    { key: 'wallonie', label: 'Wallonië', color: 'var(--color-chart-3)' }
  ]}
  highlightSeriesKey={selectedRegion}
  chartType="line"
/>
```

## Component API

### Props

```typescript
interface FilterableChartProps<T> {
  // Required
  data: T[]                              // Array of data points
  getLabel: (item: T) => string          // Extract X-axis label
  getValue: (item: T) => number          // Extract Y-axis value (single metric)

  // Optional - Styling
  chartType?: 'composed' | 'line' | 'bar' | 'area'  // Default: 'composed'
  yAxisLabel?: string                    // Y-axis label
  isCurrency?: boolean                   // Format values as € currency

  // Optional - Single metric features
  showMovingAverage?: boolean            // Show 4-period moving average

  // Optional - Multi-series support
  series?: Array<{
    key: string                          // Data property key
    label: string                        // Display name
    color: string                        // Line/bar color (use CSS variables)
  }>
  highlightSeriesKey?: string            // Highlight specific series
}
```

## Data Format

### Single Metric Data

```typescript
const data = [
  { period: '2023 Q1', value: 1000 },
  { period: '2023 Q2', value: 1200 },
  { period: '2023 Q3', value: 1100 },
  { period: '2023 Q4', value: 1300 }
]

<FilterableChart
  data={data}
  getLabel={(d) => d.period}
  getValue={(d) => d.value}
/>
```

### Multi-Series Data

```typescript
const data = [
  { period: '2023 Q1', vlaanderen: 500, brussel: 200, wallonie: 300 },
  { period: '2023 Q2', vlaanderen: 550, brussel: 220, wallonie: 330 }
]

<FilterableChart
  data={data}
  series={[
    { key: 'vlaanderen', label: 'Vlaanderen', color: 'var(--color-chart-1)' },
    { key: 'brussel', label: 'Brussel', color: 'var(--color-chart-2)' },
    { key: 'wallonie', label: 'Wallonië', color: 'var(--color-chart-3)' }
  ]}
/>
```

## Styling

### Colors

Use CSS color variables from `chart-theme.ts`:
- `var(--color-chart-1)` through `var(--color-chart-5)`

### Y-Axis Formatting

**Auto-scaling** (values > 10,000):
- 15,000 → "15k"
- 1,500,000 → "1.5M"

**Currency mode** (`isCurrency={true}`):
- 1,200 → "€1,200"
- 15,000 → "€15k"

## Integration with Sections

### With TimeSeriesSection

```typescript
import { TimeSeriesSection } from "@/components/analyses/shared/TimeSeriesSection"

<TimeSeriesSection
  title="Quarterly Analysis"
  slug="my-analysis"
  sectionId="quarterly"
  data={data}
  getLabel={(d) => `${d.year} Q${d.quarter}`}
  getValue={(d) => d.value}
  columns={columns}
  showMovingAverage={true}
  chartType="composed"
/>
```

### With AnalysisSection

```typescript
import { AnalysisSection } from "@/components/analyses/shared/AnalysisSection"

<AnalysisSection
  title="Regional Analysis"
  slug="my-analysis"
  sectionId="by-region"
  data={data}
  getLabel={(d) => d.regionName}
  getValue={(d) => d.count}
  columns={columns}
  mapData={mapData}
  getGeoCode={(d) => d.code}
  chartType="bar"
/>
```

## Best Practices

**Data preparation:**
- Sort data chronologically for time series
- Ensure consistent data types (numbers, not strings)
- Handle missing values before passing to chart

**Chart type selection:**
- Use `composed` for quarterly data with trends
- Use `line` for continuous time series
- Use `bar` for categorical comparisons
- Use `area` for cumulative or volume data

**Performance:**
- Load data at component level (not inside chart)
- Use useMemo for expensive data transformations
- Keep datasets under 1000 points for smooth rendering

**Accessibility:**
- Always provide `yAxisLabel` for context
- Use high-contrast colors
- Ensure chart complements table view
