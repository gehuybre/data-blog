---
name: blog-post-creator
description: Create new blog posts and data analyses for the Data Blog. Use when the user wants to create a new blog post, add a new analysis, or set up a new data visualization. This includes creating the content.mdx file with proper frontmatter, setting up the directory structure (data/, results/, src/), and implementing dashboard components with charts, tables, and maps.
---

# Blog Post Creator

## Overview

This skill guides you through creating complete data analysis blog posts for the Data Blog. Each post includes a content.mdx file, data processing scripts, and interactive React dashboard components with visualizations.

## Workflow

### 1. Gather Requirements

Ask the user for:
- **Slug**: Short, hyphenated identifier (e.g., "bouwondernemers", "vergunningen-goedkeuringen")
- **Title**: Full descriptive title
- **Summary**: 1-2 sentence description
- **Tags**: Array of tags (e.g., ["bouw", "economie"])
- **Data source details**:
  - Source provider name
  - Source title/dataset name
  - Source URL
  - Publication date of the data
- **Analysis focus**: What questions should this analysis answer?

### Manual validation scripts

This repository includes helper validation scripts you can run locally to check analysis files and components. These scripts are intentionally provided as *manual* checks and are not part of the global CI/test suite. They live under `.github/skills/blog-post-creator/scripts/`.

- `python .github/skills/blog-post-creator/scripts/validate_mdx.py` — check MDX conventions (no body H1, import + mount component)
- `python .github/skills/blog-post-creator/scripts/validate_component_usage.py` — check that `AnalysisSection` / `TimeSeriesSection` usages have `slug` and `sectionId`
- `node .github/skills/blog-post-creator/scripts/validate_embed_consistency.js` — check standard embeds have entries in `embed-data-registry`

Add these to your local pre-commit workflow if you want them to run before commits (recommended for contributors).
### 2. Create Directory Structure

Create the following structure in `embuild-analyses/analyses/<slug>/`:

```
<slug>/
├── content.mdx          # Blog post with frontmatter
├── data/                # Raw input files (CSV, JSON, etc.)
│   └── .gitkeep
├── results/             # Processed output files
│   └── .gitkeep
└── src/                 # Python data processing scripts
    └── .gitkeep
```

### 3. Create content.mdx

Use this template:

```mdx
---
title: [Full Title]
date: [YYYY-MM-DD]
summary: [1-2 sentence summary]
tags: [tag1, tag2]
slug: [slug]
sourceProvider: [Organization name]
sourceTitle: [Dataset/page title]
sourceUrl: [https://...]
sourcePublicationDate: [YYYY-MM-DD]
---

import { [DashboardComponent] } from "@/components/analyses/[slug]/[DashboardComponent]"

[Optional intro paragraph explaining the analysis]

<[DashboardComponent] />
```

**Critical rules:**
- NO `# H1` headings in MDX body (title comes from frontmatter)
- If data date differs from publication date, mention it explicitly in intro
- Footer with source citation is auto-generated from frontmatter

### 4. Implement Dashboard Component

Create `embuild-analyses/src/components/analyses/<slug>/[DashboardComponent].tsx`

**Component structure options:**

#### Option A: Geographic Analysis (with maps)

Use `AnalysisSection` component:

```typescript
import { AnalysisSection } from "@/components/analyses/shared/AnalysisSection"
import { GeoProvider } from "@/components/analyses/shared/GeoContext"

export function MyDashboard() {
  const data = // load from results/data.json

  return (
    <GeoProvider>
      <AnalysisSection
        title="Section Title"
        slug="your-slug"
        sectionId="section-1"
        data={data}
        getLabel={(d) => d.label}
        getValue={(d) => d.value}
        columns={[/* table columns */]}
        mapData={mapData}
        getGeoCode={(d) => d.code}
        yAxisLabel="Units"
      />
    </GeoProvider>
  )
}
```

#### Option B: Time Series Analysis (no maps)

Use `TimeSeriesSection` component:

```typescript
import { TimeSeriesSection } from "@/components/analyses/shared/TimeSeriesSection"

export function MyDashboard() {
  const data = // load from results/time_series.json

  return (
    <TimeSeriesSection
      title="Time Series Title"
      slug="your-slug"
      sectionId="time-series"
      data={data}
      getLabel={(d) => `${d.year} Q${d.quarter}`}
      getValue={(d) => d.amount}
      columns={[/* table columns */]}
      showMovingAverage={true}
    />
  )
}
```

### 5. Data Processing (Python)

Create processing scripts in `analyses/<slug>/src/`:

```python
#!/usr/bin/env python3
import pandas as pd
import json

# Load raw data from data/
df = pd.read_csv("../data/input.csv")

# Process data
results = df.groupby("category").agg({
    "value": "sum"
}).reset_index()

# Export to results/
results.to_csv("../results/processed.csv", index=False)
results.to_json("../results/processed.json", orient="records")
```

### 6. Required Elements

Every analysis **must** include:

**Per page:**
- Title (via frontmatter)
- Publication date (via frontmatter `date`)
- Data date (if different, mention in intro)
- Source footer (auto-generated from frontmatter)

**Per data section:**
- At least one visualization: Chart, Table, or Map
- CSV download button (via `AnalysisSection` or `TimeSeriesSection`)
- Embed code button (via `AnalysisSection` or `TimeSeriesSection`)

### 7. Shared Components Reference

See [references/shared-components.md](references/shared-components.md) for detailed documentation on:
- `AnalysisSection` - Full analysis with charts/tables/maps and geo-filters
- `TimeSeriesSection` - Time series with charts/tables (no maps)
- `FilterableChart` - Chart component with 4 types (composed, line, bar, area)
- `MunicipalityMap` - Maps showing Belgian municipalities
- `GeoFilter` - Geographic filter dropdown
- `ExportButtons` - CSV/embed export functionality

### 8. Best Practices

**Data loading:**
- Load JSON files at component top level
- Use type-safe data structures
- Keep data files in `results/` directory

**Component design:**
- Use absolute imports with `@/`
- Use shadcn/ui components from `@/components/ui`
- Use lucide-react for icons
- Keep dashboard components focused and composable

**Embed support:**
- Always provide `slug` and `sectionId` to section components
- Add sections to `embuild-analyses/src/lib/embed-config.ts` for embed support

**Geographic data:**
- Use Belgian NIS codes (regio/provincie/gemeente)
- Expand province data to municipalities using `expandProvinceToMunicipalities` from `@/lib/map-utils`
- Always use `MunicipalityMap` (581 municipalities)
- Show province boundaries via `showProvinceBoundaries={true}` prop

### 9. Example: Complete Analysis

For a real example, see `embuild-analyses/analyses/bouwondernemers/`:
- content.mdx with proper frontmatter
- data/ folder with raw CSV files
- results/ folder with processed JSON/CSV
- src/ folder with Python processing script
- Dashboard component with multiple sections using `AnalysisSection`

## Quick Reference

**Directory paths:**
- Content: `embuild-analyses/analyses/<slug>/content.mdx`
- Components: `embuild-analyses/src/components/analyses/<slug>/`
- Data: `embuild-analyses/analyses/<slug>/data/`
- Results: `embuild-analyses/analyses/<slug>/results/`
- Scripts: `embuild-analyses/analyses/<slug>/src/`

**Key imports:**
```typescript
import { AnalysisSection } from "@/components/analyses/shared/AnalysisSection"
import { TimeSeriesSection } from "@/components/analyses/shared/TimeSeriesSection"
import { GeoProvider } from "@/components/analyses/shared/GeoContext"
import { MunicipalityMap } from "@/components/analyses/shared/MunicipalityMap"
```

**Testing:**
```bash
# Start dev server
python run_blog.py

# Build for production
cd embuild-analyses && npm run build
```
