# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Data Blog is a static site generator for publishing data analyses. It combines a Next.js frontend with Python data processing scripts, deployed to GitHub Pages at https://gehuybre.github.io/data-blog/

## Claude Code Permissions

This section defines which commands Claude Code is allowed to execute without explicit user approval.

### Configuration

Permissions are configured in `.claude/settings.json` (committed to the repository). This file is automatically loaded by Claude Code and applies to all team members.

**Important**: Use the `:*` pattern for prefix matching (note the colon):
- ✅ Correct: `"Bash(npm :*)"`  - matches `npm install`, `npm audit`, etc.
- ❌ Wrong: `"Bash(npm *)"`     - invalid syntax
- ❌ Wrong: `"Bash(npm install:*)"` - only matches `npm install:something`

### Allowed Tools

The following tools and commands are pre-approved in `.claude/settings.json`:

```yaml
allowed_tools:
  # File operations (built-in tools - always available)
  - Read
  - Edit
  - Write
  - Glob
  - Grep

  # Package management
  - Bash(npm :*)      # All npm commands (install, audit, update, etc.)
  - Bash(pip :*)      # All pip commands
  - Bash(npx :*)      # All npx commands

  # Python execution
  - Bash(python :*)   # All python commands
  - Bash(python3 :*)  # All python3 commands

  # File system operations
  - Bash(ls :*)       # List files
  - Bash(cat :*)      # Display file contents
  - Bash(mkdir :*)    # Create directories
  - Bash(mv :*)       # Move/rename files
  - Bash(cp :*)       # Copy files
  - Bash(find :*)     # Find files

  # Network operations
  - Bash(curl :*)     # HTTP requests
  - Bash(wget :*)     # Download files

  # Version control & GitHub (restricted for security)
  - Bash(git add:*)    # Stage files
  - Bash(git commit:*) # Create commits
  - Bash(git push:*)   # Push to remote
  - Bash(git status:*) # Check status
  - Bash(git diff:*)   # View changes
  - Bash(git log:*)    # View history
  - Bash(git rm:*)     # Remove tracked files
  - Bash(gh :*)        # All GitHub CLI commands

  # Note: Destructive git operations are NOT allowed:
  # - git push --force (overwrites remote history)
  # - git reset --hard (discards uncommitted changes)
  # - git clean -fd (deletes untracked files)
  # - git rebase --force (can cause conflicts)

  # Process management
  - Bash(timeout :*)  # Run commands with timeout
  - Bash(node :*)     # Run Node.js scripts

  # Data processing
  - Bash(jq :*)       # JSON processing
  - Bash(sed :*)      # Stream editing
  - Bash(awk :*)      # Text processing
```

### Usage Patterns

#### Development
Start dev server, run builds, and linters:
- `npm run dev` - Start development server
- `npm run build` - Build static site
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (if applicable)
- `python run_blog.py` - Start dev server with port conflict handling

#### Python Data Processing
- `pip install <package>` - Install Python dependencies
- `python run_blog.py` - Run development server
- `python scripts/*` - Run utility scripts
- `python analyses/<slug>/src/*` - Run analysis processing scripts

#### GitHub Operations
Inspect and manage PRs and workflows:
- `gh pr create` - Create pull requests
- `gh pr edit` - Edit pull requests
- `gh pr view` - View pull request details
- `gh pr list` - List pull requests
- `gh workflow run` - Trigger GitHub Actions workflows
- `gh workflow view` - View workflow details

#### File Management
- `ls`, `cat`, `mkdir`, `mv`, `cp` - Basic file operations
- `find` - Search for files
- `jq` - Parse and manipulate JSON data
- `git rm` - Remove tracked files (safer than rm)

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

#### Geographic Visualization
- **MunicipalityMap** - Unified map component (municipality-only rendering with optional province boundaries)
- **MunicipalitySearch** - Autocomplete search for municipalities
- **GeoContext** - React Context for geographic filter state
- **GeoFilter** - Dropdown for region/province/municipality selection
- **MapControls** - Zoom/pan controls for maps
- **MapLegend** - Color legend for choropleth maps
- **TimeSlider** - Time series slider for maps

#### Data Utilities (`src/lib/`)
- **map-utils.ts** - Data expansion utilities (province/region → municipality conversion)
- **geo-utils.ts** - Geographic reference data (regions, provinces, municipalities)

#### Charts & Analysis
- **FilterableChart** - Recharts wrapper with filtering
- **FilterableTable** - Sortable data tables
- **AnalysisSection** - Main wrapper for analysis visualizations (chart/table/map tabs)
- **TimeSeriesSection** - Time series visualization wrapper
- **ExportButtons** - CSV download and embed code generation

## Tech Stack

- **Framework**: Next.js 14 (App Router, static export)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Content**: Contentlayer (MDX → type-safe JSON)
- **Charts**: Recharts
- **Maps**: react-simple-maps, d3-geo
- **Data Processing**: Python (pandas, geopandas)

## Map Architecture

### Municipality-Only Rendering (Januari 2025)

Alle kaarten tonen **alleen gemeentegrenzen** (581 Belgische gemeenten). Er is geen hierarchische level-switching meer tussen regio's, provincies en gemeenten.

**Kernprincipes:**
- Één map component: `MunicipalityMap`
- Altijd gemeenteniveau GeoJSON (belgium_municipalities.json - 790KB)
- Provincie data wordt geëxpandeerd naar gemeenten via `map-utils.ts`
- Provinciegrenzen kunnen als overlay worden getoond

**Voorbeeld:**
```typescript
import { MunicipalityMap } from "@/components/analyses/shared/MunicipalityMap"
import { expandProvinceToMunicipalities } from "@/lib/map-utils"

// Provincie-niveau data
const provinceData = [{ p: '10000', permits: 500 }]

// Expandeer naar gemeenten
const municipalityData = expandProvinceToMunicipalities(
  provinceData,
  (d) => d.p,
  (d) => d.permits
)

<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.value}
  showProvinceBoundaries={true}  // Toon provincie overlay
/>
```

**Verwijderde componenten:**
- ❌ `RegionMap.tsx` (deleted)
- ❌ `ProvinceMap.tsx` (deleted)
- ❌ `UnifiedMap.tsx` (deleted)
- ❌ `MapLevelToggle.tsx` (deleted)
- ❌ `InteractiveMap.tsx` (gerefactored → MunicipalityMap)

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

# Blog post en analyse requirements 


## 1. content.mdx structuur

Maak een nieuwe analyse in `embuild-analyses/analyses/<slug>/content.mdx`.

Voorbeeld:

```mdx
---
title: Jouw titel
date: 2025-01-01
summary: Korte uitleg (1–2 zinnen) die onder de titel komt.
tags: [tag1, tag2]
slug: jouw-slug
sourceProvider: Bronorganisatie
sourceTitle: Titel van de bronpagina/dataset
sourceUrl: https://...
sourcePublicationDate: 2025-01-01
---

import { JouwDashboard } from "@/components/analyses/jouw-slug/JouwDashboard"

Korte introtekst (optioneel).

<JouwDashboard />
```

Afspraken:
- Zet geen `# H1` in de MDX. De pagina-layout rendert de titel al.
- De footer “Bron: …” komt automatisch uit `sourceProvider`, `sourceUrl`, `sourceTitle`, `sourcePublicationDate`.
- Publicatiedatum van de analyse is `date` in frontmatter.
- Data date blijft verplicht als concept. Als die verschilt van `date`, vermeld je dat expliciet in de intro of in de relevante sectie.

## 2. Verplichte elementen per analysepagina

Elke analysepagina moet bevatten:
- Titel (via frontmatter): duidelijk en beschrijvend.
- Publication date (via frontmatter `date`): datum waarop de analyse gemaakt is.
- Data date: datum van de data. Als die verschilt van publication date, expliciet vermelden.
- Footer met bronvermelding (automatisch via frontmatter).

## 3. Verplichte elementen per datasectie

Elke sectie die data toont moet bevatten:
- Data visualisatie als minstens één van:
  - Tabel
  - Chart (Recharts)
  - Kaart (RegionMap, ProvinceMap, MunicipalityMap)
- Een knop om de data als CSV te downloaden.
- Een knop om embed code te genereren om de visualisatie op andere websites te delen.

## 4. Consistente UI-plaatsing voor knoppen en filters

Doel is overal dezelfde look & feel:
- Rechtsboven in de sectie: CSV + Embed.
- Onder de sectietitel: tabs of selector links, filters en extra controls rechts.

Gebruik bij voorkeur gedeelde componenten uit `src/components/analyses/shared/`.

### 4.1 Geo + grafiek/tabel/kaart

Gebruik `AnalysisSection`:
- Bestand: `embuild-analyses/src/components/analyses/shared/AnalysisSection.tsx`
- UI: tabs (Grafiek, Tabel, Kaart) + geo-filters + export

Gebruik voor geo-filtering:
- `GeoContext` en `GeoFilter`

Gebruik voor kaarten:
- `RegionMap`, `ProvinceMap`, `MunicipalityMap`

Geografische data gebruikt Belgische NIS-codes voor regio’s, provincies en gemeenten.

### 4.2 Time series zonder geo

Gebruik `TimeSeriesSection`:
- Bestand: `embuild-analyses/src/components/analyses/shared/TimeSeriesSection.tsx`
- UI: sectietitel + export, en daaronder tabs links + extra controls rechts (bv. metriek-selector)

## 5. Filtering (wanneer van toepassing)

- Geografische filters: filter op regio, provincie of gemeente met `GeoFilter` wanneer de data geo-dimensies heeft.
- Sectorfilters: filter op hoofdsector wanneer de data sectorinformatie bevat.
- Combineer filters wanneer zowel geo als sector aanwezig is, zonder af te wijken van de vaste UI-plaatsing.

Voor charts met filtering capability gebruik je `FilterableChart` waar passend.

## 6. Embed en CSV afspraken

- Geef altijd `slug` en `sectionId` door aan `AnalysisSection` of `TimeSeriesSection` zodat `ExportButtons` correcte embed-URL’s kan genereren.
- Als een sectie embed moet ondersteunen, voeg ze toe aan `embuild-analyses/src/lib/embed-config.ts`.

## 7. Codeconventies

- Gebruik absolute imports met `@/` (tsconfig).
- Gebruik shadcn/ui componenten uit `src/components/ui`.
- Gebruik `lucide-react` voor icons.
- Production build gebruikt basePath `/data-blog` voor GitHub Pages. Vermijd hardcoded paden die hiermee botsen.

## Commands (Allowed Tools for Claude Code)

allowed_tools:
  Read,
  Edit,
  Write,
  Glob,
  Grep,
  Bash(git *),
  Bash(npm *),
  Bash(pip *),
  Bash(python *),
  Bash(ls *),
  Bash(cat *),
  Bash(mkdir *),
  Bash(rm *),
  Bash(curl *),
  Bash(gh *),
  Bash(gh pr *),
  Bash(gh workflow *),
  Bash(gh secret *),
  Bash(gh api *),
  Bash(npx *),
  Bash(timeout *),

## Usage Patterns

### Development
Start de dev server, run builds en linters:
- `Bash(npm run dev *)`
- `Bash(npm run build *)`
- `Bash(npm run lint *)`
- `Bash(npm run test *)`

### Python Data Processing
- `Bash(pip install *)`
- `Bash(python run_blog.py*)`
- `Bash(python scripts/*)`

### GitHub Actions
Allow Claude to inspect en run workflows:
- `Bash(gh workflow run *)`
- `Bash(gh pr create *)`
- `Bash(gh pr edit *)`
