---
name: map-creator
description: Create geographic maps for Belgian data visualizations. Use when the user asks to add a map, create a choropleth map, visualize geographic data, show data by region/province/municipality, or add a MunicipalityMap component. This skill covers Belgian geographic data (regions, provinces, municipalities) using NIS codes.
---

# Map Creator

## Overview

This skill guides you through creating geographic visualizations using the MunicipalityMap component, which displays Belgian geographic data at the municipality level (581 municipalities) with optional province boundaries.

## Key Concept: Municipality-Only Rendering

**Important:** All maps render ONLY at the municipality level. There is no hierarchical level-switching between regions, provinces, and municipalities.

- Maps always show 581 Belgian municipalities
- Province/region data must be expanded to municipality level
- Province boundaries can be shown as an overlay

## Quick Start

### Basic Municipality Map

```typescript
import { MunicipalityMap } from "@/components/analyses/shared/MunicipalityMap"

<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.municipalityCode}  // NIS code (5 digits)
  getValue={(d) => d.value}
/>
```

### Map with Province Boundaries

```typescript
<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.code}
  getValue={(d) => d.permits}
  showProvinceBoundaries={true}  // Overlay province borders
  colorScheme="YlOrRd"
/>
```

### Expanding Province Data to Municipalities

```typescript
import { expandProvinceToMunicipalities } from "@/lib/map-utils"

// Province-level data
const provinceData = [
  { provinceCode: '10000', permits: 500 },  // Antwerp
  { provinceCode: '20001', permits: 300 }   // Brussels
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

## Component API

### MunicipalityMap Props

```typescript
interface MunicipalityMapProps<T> {
  data: T[]                              // Array of municipality data
  getGeoCode: (item: T) => string        // Extract NIS municipality code (5 digits)
  getValue: (item: T) => number          // Extract value for color scale
  showProvinceBoundaries?: boolean       // Show province overlay (default: false)
  colorScheme?: string                   // D3 color scheme (default: YlOrRd)
}
```

## Belgian Geographic Codes (NIS)

### Region Codes (3 regions)
- `'01000'` - Brussels-Capital Region
- `'02000'` - Flemish Region (Vlaanderen)
- `'03000'` - Walloon Region (Wallonie)

### Province Codes (10 provinces + Brussels)
- `'10000'` - Antwerp (Antwerpen)
- `'20001'` - Brussels-Capital (Brussel Hoofdstedelijk Gewest)
- `'30000'` - Flemish Brabant (Vlaams-Brabant)
- `'40000'` - Limburg
- `'50000'` - East Flanders (Oost-Vlaanderen)
- `'60000'` - West Flanders (West-Vlaanderen)
- `'70000'` - Walloon Brabant (Waals-Brabant)
- `'80000'` - Hainaut (Henegouwen)
- `'90000'` - Liège (Luik)
- `'91000'` - Luxembourg (Luxemburg)
- `'92000'` - Namur (Namen)

### Municipality Codes (581 municipalities)
5-digit codes, e.g.:
- `'11001'` - Antwerp city
- `'21001'` - Brussels city (Anderlecht)
- `'44021'` - Hasselt

## Data Expansion Utilities

### expandProvinceToMunicipalities

Converts province-level data to municipality-level data by distributing values equally across all municipalities in each province.

```typescript
import { expandProvinceToMunicipalities } from "@/lib/map-utils"

const municipalityData = expandProvinceToMunicipalities<T>(
  data: T[],                             // Province-level data
  getProvinceCode: (item: T) => string,  // Extract province code
  getValue: (item: T) => number          // Extract value
): MunicipalityDataPoint[]

// Returns: [{ municipalityCode: string, value: number }, ...]
```

**Example:**
```typescript
const provinceData = [
  { p: '10000', permits: 600 },  // Antwerp province (69 municipalities)
  { p: '20001', permits: 200 }   // Brussels (19 municipalities)
]

const municipalityData = expandProvinceToMunicipalities(
  provinceData,
  (d) => d.p,
  (d) => d.permits
)

// Result:
// - Each Antwerp municipality gets: 600 / 69 ≈ 8.7 permits
// - Each Brussels municipality gets: 200 / 19 ≈ 10.5 permits
```

### expandRegionToMunicipalities

Similar to province expansion, but for region-level data.

```typescript
import { expandRegionToMunicipalities } from "@/lib/map-utils"

const municipalityData = expandRegionToMunicipalities<T>(
  data: T[],
  getRegionCode: (item: T) => string,
  getValue: (item: T) => number
): MunicipalityDataPoint[]
```

## Integration with AnalysisSection

The MunicipalityMap integrates seamlessly with AnalysisSection for full chart/table/map views:

```typescript
import { AnalysisSection } from "@/components/analyses/shared/AnalysisSection"
import { GeoProvider } from "@/components/analyses/shared/GeoContext"
import { expandProvinceToMunicipalities } from "@/lib/map-utils"

export function Dashboard() {
  const provinceData = // load province-level data

  // Expand for map
  const mapData = expandProvinceToMunicipalities(
    provinceData,
    (d) => d.provinceCode,
    (d) => d.value
  )

  return (
    <GeoProvider>
      <AnalysisSection
        title="Permits by Province"
        slug="permits"
        sectionId="by-province"
        data={provinceData}
        getLabel={(d) => d.provinceName}
        getValue={(d) => d.value}
        columns={columns}
        mapData={mapData}
        getGeoCode={(d) => d.municipalityCode}
        showProvinceBoundaries={true}
      />
    </GeoProvider>
  )
}
```

## Geographic Reference Data

Use `geo-utils.ts` for reference data:

```typescript
import {
  REGIONS,
  PROVINCES,
  MUNICIPALITIES,
  getMunicipalitiesByProvince,
  getProvinceByCode
} from "@/lib/geo-utils"

// Get all municipalities in Antwerp province
const antwerpenMunis = getMunicipalitiesByProvince('10000')
// Returns: [{ code: '11001', name: 'Antwerpen' }, { code: '11002', name: 'Aartselaar' }, ...]

// Get province details
const province = getProvinceByCode('10000')
// Returns: { code: '10000', name: 'Antwerpen', regionCode: '02000' }
```

## Color Schemes

MunicipalityMap supports D3 color schemes for choropleth maps:

**Sequential (single hue):**
- `'YlOrRd'` (default) - Yellow-Orange-Red
- `'Blues'` - Light to dark blue
- `'Greens'` - Light to dark green
- `'Reds'` - Light to dark red

**Diverging (dual hue):**
- `'RdYlGn'` - Red-Yellow-Green
- `'RdBu'` - Red-Blue
- `'PuOr'` - Purple-Orange

**Example:**
```typescript
<MunicipalityMap
  data={data}
  getGeoCode={(d) => d.code}
  getValue={(d) => d.value}
  colorScheme="Blues"
/>
```

## Common Patterns

### Pattern 1: Province Data with Province Overlay

```typescript
import { MunicipalityMap } from "@/components/analyses/shared/MunicipalityMap"
import { expandProvinceToMunicipalities } from "@/lib/map-utils"

const provinceData = // load from results/by_province.json

const mapData = expandProvinceToMunicipalities(
  provinceData,
  (d) => d.p,
  (d) => d.count
)

<MunicipalityMap
  data={mapData}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.value}
  showProvinceBoundaries={true}
/>
```

### Pattern 2: Municipality Data (No Expansion Needed)

```typescript
const municipalityData = // load from results/by_municipality.json

<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.m}
  getValue={(d) => d.permits}
/>
```

### Pattern 3: Region Data with Province Overlay

```typescript
import { expandRegionToMunicipalities } from "@/lib/map-utils"

const regionData = // load from results/by_region.json

const mapData = expandRegionToMunicipalities(
  regionData,
  (d) => d.r,
  (d) => d.total
)

<MunicipalityMap
  data={mapData}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.value}
  showProvinceBoundaries={true}
/>
```

## Best Practices

**Data preparation:**
- Always use official NIS codes for geographic entities
- Validate codes against `geo-utils.ts` reference data
- Handle missing municipalities (some may not have data)

**Performance:**
- Municipality GeoJSON file is 790KB (acceptable for web)
- Expansion utilities are fast (runs in <10ms)
- Use useMemo for expensive data transformations

**Visualization choices:**
- Show province boundaries when displaying province/region aggregations
- Use appropriate color schemes (sequential for continuous data, diverging for comparisons)
- Provide both map and table views for accessibility

**Geographic filtering:**
- Wrap maps in `GeoProvider` for filtering capability
- Use `GeoFilter` component for region/province/municipality selection
- Filter data before expansion for better performance

## Troubleshooting

**Map not displaying:**
- Check that `data` is not empty
- Verify `getGeoCode` returns valid 5-digit NIS codes
- Check browser console for GeoJSON loading errors

**Incorrect colors:**
- Ensure `getValue` returns a number (not string)
- Check for null/undefined values in data
- Verify color scheme name is valid D3 scheme

**Province data showing incorrectly:**
- Use `expandProvinceToMunicipalities` utility
- Don't pass province codes to `getGeoCode` (must be municipality codes)
- Enable `showProvinceBoundaries={true}` for visual clarity

**Missing municipalities:**
- Not all municipalities may have data
- Map will render available data only
- Consider providing fallback value (e.g., 0) for missing municipalities

## Examples from Codebase

See real implementations:
- [embuild-analyses/src/components/analyses/bouwondernemers/](embuild-analyses/src/components/analyses/bouwondernemers/)
- [embuild-analyses/src/components/analyses/vergunningen-goedkeuringen/](embuild-analyses/src/components/analyses/vergunningen-goedkeuringen/)
