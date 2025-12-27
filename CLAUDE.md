# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Data Blog is a static site generator for publishing data analyses. It combines a Next.js frontend with Python data processing scripts, deployed to GitHub Pages at https://gehuybre.github.io/data-blog/

## Commands

### Development
```bash
# Start development server (preferred - handles port conflicts)
python run_blog.py

# Alternative
cd embuild-analyses && npm run dev
```

### Build & Lint
```bash
cd embuild-analyses
npm run build    # Build static site (outputs to out/)
npm run lint     # Run ESLint
```

### Python Data Processing
```bash
# Activate virtual environment
source .venv/bin/activate

# Run analysis scripts (from analysis directory)
python analyses/<slug>/src/<script>.py
```

## Architecture

### Directory Structure
```
embuild-analyses/           # Next.js application root
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   └── analyses/      # Analysis-specific components
│   │       └── shared/    # Reusable geo/chart components
│   └── lib/               # Utilities (geo-utils, name-utils)
├── analyses/              # Content and data per analysis
│   └── <slug>/
│       ├── content.mdx    # Blog post (MDX)
│       ├── data/          # Raw input files
│       ├── results/       # Processed JSON/CSV output
│       └── src/           # Python processing scripts
└── shared-data/           # Shared reference data (geo, NACE, NIS codes)

docs/                      # Documentation (see LLM_DOCUMENTATION_PROTOCOL.md)
├── workflows/             # WF-*.md workflow docs
├── files/                 # File-specific docs (mirrors repo structure)
└── INDEX.md               # Documentation hub
```

### Data Flow
1. Raw data in `analyses/<slug>/data/`
2. Python scripts in `analyses/<slug>/src/` process → output to `results/`
3. Contentlayer reads `content.mdx` → generates TypeScript types
4. Next.js builds static HTML → outputs to `out/`
5. GitHub Actions deploys to GitHub Pages

### Key Shared Components (`src/components/analyses/shared/`)
- **GeoContext** - React Context for geographic filter state
- **GeoFilter** - Dropdown for region/province/municipality selection
- **RegionMap/ProvinceMap/MunicipalityMap** - D3-based Belgian maps
- **FilterableChart** - Recharts wrapper with filtering
- **AnalysisSection** - Main wrapper for analysis visualizations

## Tech Stack

- **Framework**: Next.js 14 (App Router, static export)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Content**: Contentlayer (MDX → type-safe JSON)
- **Charts**: Recharts
- **Maps**: react-simple-maps, d3-geo
- **Data Processing**: Python (pandas, geopandas)

## Documentation Protocol

**Critical**: Follow `LLM_DOCUMENTATION_PROTOCOL.md` when modifying workflows or adding key files.

- Workflow docs: `docs/workflows/WF-<slug>.md`
- File docs: `docs/files/<repo-path>.md`
- Always update `docs/INDEX.md` when adding new docs
- Use YAML front matter with required fields (kind, inputs, outputs, etc.)

## Creating a New Analysis

1. Create folder: `embuild-analyses/analyses/<slug>/`
2. Add `content.mdx` with frontmatter:
   ```yaml
   ---
   title: "Title"
   date: 2024-01-01
   summary: "Short summary"
   tags: ["tag1"]
   slug: "slug"
   ---
   ```
3. Add data processing in `src/`, raw data in `data/`
4. Create corresponding workflow doc in `docs/workflows/`

## Adding Iframe Embeds to Analysis Posts

The centralized iframe embed system allows you to make analysis visualizations embeddable in external websites. See full documentation in `docs/workflows/WF-embed-system.md`.

### Quick Start: Standard Embed

For simple visualizations with consistent data structure:

1. **Register the embed** in `embuild-analyses/src/lib/embed-config.ts`:
   ```typescript
   {
     slug: "your-analysis-slug",
     sections: {
       "section-id": {
         type: "standard",
         title: "Section Title",
         dataPath: "your-analysis-slug/results/data.json",
         municipalitiesPath: "your-analysis-slug/results/municipalities.json",
         metric: "metric_key",
         label: "Metric Label",
         height: 500  // Optional, defaults to 500px
       }
     }
   }
   ```

2. **Prepare your data files** in `analyses/<slug>/results/`:
   - `data.json` - Array with structure: `{m: municipalityCode, y: year, q: quarter, [metric]: value}`
   - `municipalities.json` - Array with structure: `{code: nisCode, name: "Name"}`

3. **Add ExportButtons** to your analysis component:
   ```tsx
   import { ExportButtons } from "@/components/analyses/shared/ExportButtons"

   <ExportButtons
     data={yourData}
     title="Section Title"
     slug="your-analysis-slug"
     sectionId="section-id"
     viewType={currentView}  // "chart" | "table" | "map"
   />
   ```

4. **Build and deploy** - The embed route is auto-generated at `/embed/your-analysis-slug/section-id`

### Advanced: Custom Embed

For complex visualizations requiring custom logic:

1. **Create custom component** at `src/components/analyses/[analysis]/[Component]Embed.tsx`
2. **Register in config** with `type: "custom"` and `component: "ComponentEmbed"`
3. **Register component** in `src/app/embed/[slug]/[section]/EmbedClient.tsx`

See `docs/workflows/WF-embed-system.md` for detailed instructions on custom embeds.

### Validation

The build process validates all embed configurations:
- `npm run build` runs `validate:embeds` script automatically
- Checks that data paths exist and are correctly formatted
- Validates against path traversal attacks
- Ensures all required config fields are present

## Conventions

- Use absolute imports: `@/` (configured in tsconfig.json)
- Use shadcn/ui components from `src/components/ui`
- Use lucide-react for icons
- Geographic data uses Belgian NIS codes (regions, provinces, municipalities)
- Production build uses basePath `/data-blog` for GitHub Pages
