# Shared Components Reference

This document provides detailed information about reusable components for creating data analysis dashboards.

## Table of Contents

1. [Section Wrappers](#section-wrappers)
   - AnalysisSection
   - TimeSeriesSection
2. [Charts](#charts)
   - FilterableChart
3. [Maps](#maps)
   - MunicipalityMap
4. [Filters and Context](#filters-and-context)
   - GeoContext & GeoProvider
   - GeoFilter
5. [Export Components](#export-components)
   - ExportButtons
6. [Utilities](#utilities)
   - map-utils
   - geo-utils

---

## Section Wrappers

### AnalysisSection

**Location:** `embuild-analyses/src/components/analyses/shared/AnalysisSection.tsx`

Full-featured section component with tabs for Chart/Table/Map views, geographic filtering, and export functionality.

**When to use:**
- Analysis has geographic dimensions (region/province/municipality)
- Need to show data as chart, table, AND map
- Want built-in CSV/embed export

**Props:**
```typescript
interface AnalysisSectionProps<T> {
  title: string                           // Section title
  slug: string                           // Analysis slug for embed URLs
  sectionId: string                      // Unique section identifier
  data: T[]                              // Chart/table data
  getLabel: (item: T) => string          // X-axis label extractor
  getValue: (item: T) => number          // Y-axis value extractor
  columns: ColumnDef<T>[]                // Table column definitions (react-table)
  mapData: MapDataPoint[]                // Map data (with NIS codes)
  getGeoCode: (item: MapDataPoint) => string  // Extract NIS code for map
  yAxisLabel?: string                    // Y-axis label (optional)
  isCurrency?: boolean                   // Format values as currency (optional)
  showMovingAverage?: boolean            // Show 4-period MA on chart (optional)
}
```

**Example:**
```typescript
import { AnalysisSection } from "@/components/analyses/shared/AnalysisSection"
import { GeoProvider } from "@/components/analyses/shared/GeoContext"

export function MyDashboard() {
  return (
    <GeoProvider>
      <AnalysisSection
        title="Permits by Province"
        slug="bouwvergunningen"
        sectionId="by-province"
        data={chartData}
        getLabel={(d) => d.provinceName}
        getValue={(d) => d.permits}
        columns={tableColumns}
        mapData={mapData}
        getGeoCode={(d) => d.provinceCode}
        yAxisLabel="Number of Permits"
      />
    </GeoProvider>
  )
}
```

**Features:**
- Three tabs: Grafiek (Chart), Tabel (Table), Kaart (Map)
- Geographic filter (region/province/municipality) above tabs
- CSV download and embed code buttons (top right)
- Responsive layout
- Auto-filtered data based on geo selection

---

### TimeSeriesSection

**Location:** `embuild-analyses/src/components/analyses/shared/TimeSeriesSection.tsx`

Simpler section component for time series data without geographic dimensions. Shows Chart and Table tabs only.

**When to use:**
- Time series data without geographic filtering
- Only need chart and table views (no map)
- Want CSV/embed export

**Props:**
```typescript
interface TimeSeriesSectionProps<T> {
  title: string                           // Section title
  slug: string                           // Analysis slug for embed URLs
  sectionId: string                      // Unique section identifier
  data: T[]                              // Chart/table data
  getLabel: (item: T) => string          // X-axis label extractor
  getValue: (item: T) => number          // Y-axis value extractor
  columns: ColumnDef<T>[]                // Table column definitions
  yAxisLabel?: string                    // Y-axis label (optional)
  isCurrency?: boolean                   // Format as currency (optional)
  showMovingAverage?: boolean            // Show 4-period MA (optional)
  chartType?: 'composed' | 'line' | 'bar' | 'area'  // Chart type (default: composed)
}
```

**Example:**
```typescript
import { TimeSeriesSection } from "@/components/analyses/shared/TimeSeriesSection"

export function QuarterlyDashboard() {
  return (
    <TimeSeriesSection
      title="Quarterly Revenue"
      slug="revenue-analysis"
      sectionId="quarterly"
      data={quarterlyData}
      getLabel={(d) => `${d.year} Q${d.quarter}`}
      getValue={(d) => d.revenue}
      columns={columns}
      showMovingAverage={true}
      isCurrency={true}
    />
  )
}
```

---

## Charts

### FilterableChart

**Location:** `embuild-analyses/src/components/analyses/shared/FilterableChart.tsx`

Flexible Recharts wrapper supporting multiple chart types with consistent styling.

**Chart Types:**
- `composed` (default): Bar + Line with moving average
- `line`: Line chart (continuous trends)
- `bar`: Bar chart only (categorical comparison)
- `area`: Filled area chart (cumulative/volume data)

**Props:**
```typescript
interface FilterableChartProps<T> {
  data: T[]
  getLabel: (item: T) => string
  getValue: (item: T) => number
  yAxisLabel?: string
  isCurrency?: boolean
  showMovingAverage?: boolean            // Only for single metric
  chartType?: 'composed' | 'line' | 'bar' | 'area'

  // Multi-series support
  series?: Array<{
    key: string
    label: string
    color: string
  }>
  highlightSeriesKey?: string            // Highlight specific series
}
```

**Single Metric Example:**
```typescript
<FilterableChart
  data={timeSeriesData}
  chartType="line"
  getLabel={(d) => d.period}
  getValue={(d) => d.amount}
  yAxisLabel="Aantal"
  showMovingAverage={true}
/>
```

**Multi-Series Example:**
```typescript
<FilterableChart
  data={comparisonData}
  series={[
    { key: 'vlaanderen', label: 'Vlaanderen', color: 'var(--color-chart-1)' },
    { key: 'brussel', label: 'Brussel', color: 'var(--color-chart-2)' },
    { key: 'wallonie', label: 'Wallonië', color: 'var(--color-chart-3)' }
  ]}
  highlightSeriesKey={selectedRegion}
  chartType="area"
/>
```

**Chart Type Behavior:**

| Type | Single Metric | Multi-Series | Best For |
|------|---------------|--------------|----------|
| `composed` | Bar + Line (MA) | Lines | Quarterly data with trend |
| `line` | Line + Line (MA) | Lines | Continuous trends |
| `bar` | Bar only | Grouped bars | Categorical comparison |
| `area` | Filled area + Line (MA) | Stacked areas | Cumulative/volume data |

**Styling:**
- Colors: `var(--color-chart-1)` through `var(--color-chart-5)` from `chart-theme.ts`
- Y-axis auto-scales with k/M suffixes above 10k
- Currency mode adds € symbol
- Consistent grid, tooltips, legend across all types

---

## Maps

### MunicipalityMap

**Location:** `embuild-analyses/src/components/analyses/shared/MunicipalityMap.tsx`

Map component showing Belgian municipalities (581 total). Always renders municipality-level data.

**When to use:**
- Visualizing geographic data for Belgium
- Data has municipality/province/region codes
- Want choropleth (colored) maps

**Important:**
- ONLY renders municipalities (no hierarchical level switching)
- Province data must be expanded to municipalities via `expandProvinceToMunicipalities` from `@/lib/map-utils`
- Can optionally show province boundaries as overlay

**Props:**
```typescript
interface MunicipalityMapProps<T> {
  data: T[]
  getGeoCode: (item: T) => string        // Extract NIS municipality code
  getValue: (item: T) => number          // Extract value for color scale
  showProvinceBoundaries?: boolean       // Show province overlay (default: false)
  colorScheme?: string                   // Color scheme for choropleth
}
```

**Example with Province Data:**
```typescript
import { MunicipalityMap } from "@/components/analyses/shared/MunicipalityMap"
import { expandProvinceToMunicipalities } from "@/lib/map-utils"

// Province-level data
const provinceData = [
  { provinceCode: '10000', permits: 500 },
  { provinceCode: '20001', permits: 300 }
]

// Expand to municipalities
const municipalityData = expandProvinceToMunicipalities(
  provinceData,
  (d) => d.provinceCode,
  (d) => d.permits
)

<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.value}
  showProvinceBoundaries={true}
/>
```

**Geographic Codes (Belgian NIS):**
- Region codes: `'01000'` (Brussels), `'02000'` (Flanders), `'03000'` (Wallonia)
- Province codes: `'10000'` (Antwerp), `'20001'` (Brussels), etc.
- Municipality codes: 5-digit codes (e.g., `'11001'` for Antwerp city)

---

## Filters and Context

### GeoContext & GeoProvider

**Location:** `embuild-analyses/src/components/analyses/shared/GeoContext.tsx`

React Context for managing geographic filter state across components.

**Usage:**
```typescript
import { GeoProvider, useGeoContext } from "@/components/analyses/shared/GeoContext"

// Wrap your dashboard
export function Dashboard() {
  return (
    <GeoProvider>
      <YourSections />
    </GeoProvider>
  )
}

// Access in child components
function MyComponent() {
  const { selectedRegion, selectedProvince, selectedMunicipality } = useGeoContext()
  // Filter data based on selection
}
```

---

### GeoFilter

**Location:** `embuild-analyses/src/components/analyses/shared/GeoFilter.tsx`

Dropdown component for selecting region/province/municipality.

**Usage:**
```typescript
import { GeoFilter } from "@/components/analyses/shared/GeoFilter"

<GeoFilter />  // Automatically uses GeoContext
```

**Features:**
- Three-level hierarchy: Region → Province → Municipality
- Auto-populated from `geo-utils.ts`
- Updates `GeoContext` on selection
- Filtered data automatically flows to child components

---

## Export Components

### ExportButtons

**Location:** `embuild-analyses/src/components/analyses/shared/ExportButtons.tsx`

CSV download and embed code generation buttons.

**Props:**
```typescript
interface ExportButtonsProps<T> {
  data: T[]
  filename: string                       // CSV filename (without .csv)
  slug: string                          // Analysis slug
  sectionId: string                     // Section identifier for embed URL
  columns: Array<{
    header: string
    accessor: (item: T) => string | number
  }>
}
```

**Example:**
```typescript
<ExportButtons
  data={filteredData}
  filename="permits-by-province"
  slug="bouwvergunningen"
  sectionId="by-province"
  columns={[
    { header: 'Province', accessor: (d) => d.name },
    { header: 'Permits', accessor: (d) => d.count }
  ]}
/>
```

**Features:**
- CSV download with proper headers and encoding
- Embed code modal with copy-to-clipboard
- Embed URL format: `/data-blog/embed/{slug}/{sectionId}`
- Styled with shadcn/ui components

**Embed Configuration:**
Add sections to `embuild-analyses/src/lib/embed-config.ts`:

```typescript
export const embedSections = {
  'bouwvergunningen': {
    'by-province': { title: 'Permits by Province' }
  }
}
```

---

## Utilities

### map-utils

**Location:** `embuild-analyses/src/lib/map-utils.ts`

Utilities for expanding province/region data to municipality level for maps.

**Key function:**
```typescript
expandProvinceToMunicipalities<T>(
  data: T[],
  getProvinceCode: (item: T) => string,
  getValue: (item: T) => number
): MunicipalityDataPoint[]
```

**Example:**
```typescript
import { expandProvinceToMunicipalities } from "@/lib/map-utils"

const provinceData = [{ p: '10000', value: 500 }]
const municipalityData = expandProvinceToMunicipalities(
  provinceData,
  (d) => d.p,
  (d) => d.value
)
// Returns: [{ municipalityCode: '11001', value: 500 }, { municipalityCode: '11002', value: 500 }, ...]
```

---

### geo-utils

**Location:** `embuild-analyses/src/lib/geo-utils.ts`

Geographic reference data for Belgian regions, provinces, and municipalities.

**Exports:**
- `REGIONS`: Array of Belgian regions
- `PROVINCES`: Array of Belgian provinces
- `MUNICIPALITIES`: Array of 581 Belgian municipalities
- Helper functions for lookups and filtering

**Example:**
```typescript
import { PROVINCES, getMunicipalitiesByProvince } from "@/lib/geo-utils"

const antwerpenMunicipalities = getMunicipalitiesByProvince('10000')
// Returns: [{ code: '11001', name: 'Antwerpen' }, ...]
```

---

## Component Compatibility Matrix

| Component | Geo Filtering | Time Series | Multi-Series | Maps | Export |
|-----------|---------------|-------------|--------------|------|--------|
| AnalysisSection | ✅ | ✅ | ❌ | ✅ | ✅ |
| TimeSeriesSection | ❌ | ✅ | ❌ | ❌ | ✅ |
| FilterableChart | ❌ | ✅ | ✅ | ❌ | ❌ |
| MunicipalityMap | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## Common Patterns

### Pattern 1: Simple Time Series

```typescript
import { TimeSeriesSection } from "@/components/analyses/shared/TimeSeriesSection"

<TimeSeriesSection
  title="Quarterly Data"
  slug="my-analysis"
  sectionId="quarterly"
  data={data}
  getLabel={(d) => `${d.year} Q${d.q}`}
  getValue={(d) => d.value}
  columns={columns}
  showMovingAverage={true}
/>
```

### Pattern 2: Geographic Analysis

```typescript
import { AnalysisSection } from "@/components/analyses/shared/AnalysisSection"
import { GeoProvider } from "@/components/analyses/shared/GeoContext"
import { expandProvinceToMunicipalities } from "@/lib/map-utils"

export function Dashboard() {
  const mapData = expandProvinceToMunicipalities(
    provinceData,
    (d) => d.code,
    (d) => d.value
  )

  return (
    <GeoProvider>
      <AnalysisSection
        title="By Province"
        slug="my-analysis"
        sectionId="by-province"
        data={chartData}
        getLabel={(d) => d.name}
        getValue={(d) => d.count}
        columns={columns}
        mapData={mapData}
        getGeoCode={(d) => d.municipalityCode}
        showProvinceBoundaries={true}
      />
    </GeoProvider>
  )
}
```

### Pattern 3: Multi-Series Comparison

```typescript
import { FilterableChart } from "@/components/analyses/shared/FilterableChart"

<FilterableChart
  data={data}
  series={[
    { key: 'metric1', label: 'Metric 1', color: 'var(--color-chart-1)' },
    { key: 'metric2', label: 'Metric 2', color: 'var(--color-chart-2)' }
  ]}
  chartType="line"
/>
```
