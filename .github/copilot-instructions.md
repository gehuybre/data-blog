# GitHub Copilot Instructions for Data Blog

## Project Overview
This is a **Next.js 14** project (App Router) using **TypeScript**, **Tailwind CSS**, and **shadcn/ui**. It is a static site (SSG) deployed to GitHub Pages at https://gehuybre.github.io/data-blog/, focused on data analyses.

The project combines a Next.js frontend with Python data processing scripts. Each analysis is self-contained with its own data, processing scripts, and MDX content.

## Commands to Run

### Development
```bash
# Start development server (preferred - handles port conflicts automatically)
python run_blog.py

# Alternative - manual start
cd embuild-analyses && npm run dev

# Development server runs at http://localhost:3000
```

### Build & Lint
```bash
cd embuild-analyses

# Build static site for production (outputs to out/)
npm run build

# Run ESLint
npm run lint

# Validate embed paths before build
npm run validate:embeds
```

### Testing
```bash
cd embuild-analyses

# Run all Playwright E2E tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Show test report
npm run test:report

# Test production build locally
./test-production.sh
```

**Important**: Always run `./test-production.sh` before pushing changes that affect embeds or routing. This tests the production build with the `/data-blog` base path that's used on GitHub Pages.

### Python Data Processing
```bash
# Activate virtual environment (if using one)
source .venv/bin/activate

# Run analysis scripts (from project root)
python embuild-analyses/analyses/<slug>/src/<script>.py

# Install Python dependencies
pip install -r requirements.txt
```

## Testing Procedures

### When to Test
- **Always** run tests before committing changes to components, pages, or embeds
- Run `./test-production.sh` before pushing if you modified:
  - Embed functionality
  - Routing or navigation
  - Base path handling
  - Asset loading

### Test Coverage
- **E2E Tests**: Playwright tests cover embed functionality across 5 browsers
  - Chromium, Firefox, WebKit (Desktop)
  - Mobile Chrome, Mobile Safari
- **Test Files**: Located in `embuild-analyses/tests/e2e/`
  - `embed-filters.spec.ts` - Filter parameters
  - `embed-iframe.spec.ts` - Iframe embedding
  - `embed-loading.spec.ts` - Loading and error handling

### CI/CD Testing
- Tests run automatically on PRs and pushes to `main`
- CI builds with production config (includes `/data-blog` base path)
- All 5 browser configurations tested

### Adding New Tests
When adding embed sections, update test data:
```typescript
// tests/e2e/embed-loading.spec.ts
const testEmbeds = [
  {
    path: '/embed/your-analysis/your-section/?view=chart',
    name: 'Your Section Name',
    title: 'Section Title',
  },
];
```

## Project Structure

```
data-blog/
├── .github/
│   ├── copilot-instructions.md   # This file
│   └── workflows/                # GitHub Actions workflows
├── docs/                         # Documentation (follow LLM_DOCUMENTATION_PROTOCOL.md)
│   ├── INDEX.md                  # Documentation hub
│   ├── workflows/                # WF-*.md workflow docs
│   └── files/                    # File-specific docs (mirrors repo structure)
├── embuild-analyses/             # Next.js application root
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   └── analyses/         # Analysis-specific components
│   │   │       └── shared/       # Reusable geo/chart components
│   │   └── lib/                  # Utilities (geo-utils, map-utils, name-utils)
│   ├── analyses/                 # Content and data per analysis
│   │   └── <slug>/
│   │       ├── content.mdx       # Blog post (MDX)
│   │       ├── data/             # Raw input files (gitignored, auto-downloaded in CI)
│   │       ├── results/          # Processed JSON/CSV output
│   │       └── src/              # Python processing scripts
│   ├── shared-data/              # Shared reference data (geo, NACE, NIS codes)
│   ├── public/                   # Public assets
│   ├── tests/e2e/                # Playwright E2E tests
│   ├── contentlayer.config.ts    # Contentlayer configuration
│   ├── next.config.mjs           # Next.js config (includes basePath for GitHub Pages)
│   └── package.json              # Dependencies and scripts
├── scripts/                      # Utility scripts
├── CLAUDE.md                     # Instructions for Claude Code
├── LLM_DOCUMENTATION_PROTOCOL.md # Documentation standards
└── run_blog.py                   # Development server launcher
```

### Key Directories
- **`embuild-analyses/src/components/analyses/shared/`**: Reusable components for all analyses
  - Geographic visualization: `MunicipalityMap`, `MunicipalitySearch`, `GeoFilter`
  - Charts & analysis: `FilterableChart`, `FilterableTable`, `AnalysisSection`, `TimeSeriesSection`
  - Utilities: `ExportButtons`, `MapControls`, `MapLegend`, `TimeSlider`
- **`embuild-analyses/src/lib/`**: Core utilities
  - `geo-utils.ts`: Geographic reference data (regions, provinces, municipalities)
  - `map-utils.ts`: Data expansion utilities (province/region → municipality conversion)
  - `name-utils.ts`: Name formatting and normalization

### Data Flow
1. **Raw data** in `analyses/<slug>/data/` (auto-downloaded in CI from remote sources)
2. **Python scripts** in `analyses/<slug>/src/` process data → output to `results/`
3. **Contentlayer** reads `content.mdx` → generates TypeScript types
4. **Next.js** builds static HTML → outputs to `out/`
5. **GitHub Actions** deploys to GitHub Pages with `/data-blog` base path

## Architecture & Conventions

### Core Components
- **Root**: `embuild-analyses/` contains the Next.js application
- **Content**: `embuild-analyses/analyses/` is the source of truth for blog posts
  - Each analysis is a self-contained folder: `analyses/<slug>/`
  - Required structure per analysis:
    - `content.mdx`: Blog post content (MDX)
    - `data/`: Raw data files (usually gitignored, downloaded in CI)
    - `results/`: Processed data (JSON/CSV) consumed by frontend
    - `src/`: Python/R scripts to process data
- **Content Management**: Contentlayer transforms MDX into type-safe JSON
  - Config: `embuild-analyses/contentlayer.config.ts`
  - Content Dir: `embuild-analyses/analyses`

### Documentation Protocol
**Strict Rule**: Follow `LLM_DOCUMENTATION_PROTOCOL.md` when modifying workflows or adding key files.

- **Workflow docs**: `docs/workflows/WF-<slug>.md`
- **File docs**: `docs/files/<repo-path>.md`
- **Always** update `docs/INDEX.md` when adding new docs
- Use YAML front matter with required fields (kind, inputs, outputs, etc.)

### Tech Stack Details
- **Framework**: Next.js 14 (App Router, static export)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (from `src/components/ui`)
- **Content**: Contentlayer (MDX → type-safe JSON)
- **Charts**: Recharts
- **Maps**: react-simple-maps, d3-geo
- **Icons**: lucide-react
- **Dates**: date-fns
- **Data Processing**: Python (pandas, geopandas)

## Code Style Guidance

### TypeScript
- **Strict mode is enabled** - Define interfaces for all data structures
- **Use absolute imports** with `@/` prefix (configured in `tsconfig.json`)
  ```typescript
  // Good
  import { MunicipalityMap } from "@/components/analyses/shared/MunicipalityMap"
  
  // Avoid
  import { MunicipalityMap } from "../../components/analyses/shared/MunicipalityMap"
  ```
- **Define interfaces** for data structures:
  ```typescript
  interface StandardEmbedDataRow {
    m: number;        // Municipality NIS code
    y: number;        // Year
    q: number;        // Quarter
    [metric: string]: number;  // Dynamic metrics
  }
  ```

### React Components
- **Use functional components** with TypeScript interfaces for props:
  ```typescript
  interface MyComponentProps {
    data: StandardEmbedDataRow[];
    onFilterChange?: (filter: string) => void;
  }
  
  export function MyComponent({ data, onFilterChange }: MyComponentProps) {
    // Component implementation
  }
  ```
- **Use shadcn/ui components** from `src/components/ui`
- **Use shared analysis components** from `src/components/analyses/shared`

### Styling
- **Use Tailwind CSS utility classes**:
  ```tsx
  <div className="flex items-center justify-between gap-4">
    <h2 className="text-2xl font-bold">Title</h2>
  </div>
  ```
- **Use `cn()` utility** for conditional classes:
  ```typescript
  import { cn } from "@/lib/utils"
  
  <div className={cn("base-class", isActive && "active-class")} />
  ```

### Geographic Data
- **Always use Belgian NIS codes** for municipalities, provinces, and regions
- **Use shared geo utilities**:
  ```typescript
  import { REGIONS, PROVINCES, MUNICIPALITIES } from "@/lib/geo-utils"
  import { expandProvinceToMunicipalities } from "@/lib/map-utils"
  ```
- **Municipality-only rendering**: All maps show only municipality boundaries (581 Belgian municipalities)

### Creating New Analyses
1. Create folder: `embuild-analyses/analyses/<slug>/`
2. Add `content.mdx` with required frontmatter:
   ```yaml
   ---
   title: "Analysis Title"
   date: 2025-01-01
   summary: "Short summary (1-2 sentences)"
   tags: ["tag1", "tag2"]
   slug: "your-slug"
   sourceProvider: "Data Source Organization"
   sourceTitle: "Dataset Title"
   sourceUrl: "https://..."
   sourcePublicationDate: 2025-01-01
   ---
   ```
3. Add data processing in `src/`, raw data in `data/`
4. Create corresponding workflow doc in `docs/workflows/`

### Required Elements per Analysis Page
- **Title** (via frontmatter): Clear and descriptive
- **Publication date** (via frontmatter `date`): When analysis was created
- **Data date**: Date of the data (explicitly mention if different from publication date)
- **Footer with source** (automatic via frontmatter)

### Required Elements per Data Section
Each section showing data must include:
- **Data visualization** (at least one of):
  - Table
  - Chart (Recharts)
  - Map (MunicipalityMap)
- **CSV download button**
- **Embed code button** (for sharing on other websites)

Use shared components from `src/components/analyses/shared/`:
- `AnalysisSection`: Tabs (Chart, Table, Map) + geo-filters + export
- `TimeSeriesSection`: Time series visualization with controls + export

## Git Workflow & PR Conventions

### Branch Naming
- Feature branches: `feature/<descriptive-name>`
- Bug fixes: `fix/<descriptive-name>`
- Copilot branches: `copilot/<task-description>`

### Commit Messages
- Use clear, descriptive commit messages
- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`
- Examples:
  ```
  feat(analysis): add new gemeentelijke-investeringen analysis
  fix(embed): correct base path handling for GitHub Pages
  docs(workflow): add WF-data-processing.md
  chore(deps): update Next.js to 14.2.13
  ```

### Pull Requests
- **Test before creating PR**: Run `npm test` and `./test-production.sh`
- **Update documentation**: Follow `LLM_DOCUMENTATION_PROTOCOL.md`
- **Update `docs/INDEX.md`** if adding new workflows or major files
- **Review checklist**:
  - [ ] Tests pass locally
  - [ ] Production build tested (for embed/routing changes)
  - [ ] Documentation updated
  - [ ] No console errors or warnings
  - [ ] Follows code style guidelines

### GitHub Pages Deployment
- **Production uses `/data-blog` base path**
- Configured in `next.config.mjs`: `basePath: '/data-blog'`
- **Always test** with `./test-production.sh` before merging changes

## Boundaries & Avoidances

### Files to Never Modify
- **`.github/agents/`**: Agent configuration files (not relevant for general development)
- **Generated files**: `.next/`, `out/`, `node_modules/`, `.contentlayer/`
- **Binary data files**: Large datasets in `analyses/*/data/` (these are auto-downloaded)

### Patterns to Avoid
- **Never hardcode paths** that conflict with GitHub Pages base path (`/data-blog`)
  ```typescript
  // Bad
  href="/analysis/my-page"
  
  // Good - Next.js handles basePath automatically
  href="/analysis/my-page"  // becomes /data-blog/analysis/my-page in production
  ```
- **Never use `any` type** in TypeScript - Always define proper interfaces
- **Never commit secrets** or API keys
- **Never remove working code** unless absolutely necessary or fixing a security vulnerability

### Security Considerations
- **Validate all external data** before processing
- **Use type guards** for runtime validation:
  ```typescript
  function isValidData(data: unknown): data is ExpectedType {
    // Validation logic
  }
  ```
- **Sanitize user inputs** in embed URLs
- **Keep dependencies updated** to avoid known vulnerabilities

### What Not to Commit
(See `.gitignore` for full list)
- Python cache: `__pycache__/`, `*.pyc`
- Virtual environments: `.venv/`, `venv/`
- Environment variables: `.env`
- Build artifacts: `.next/`, `out/`, `node_modules/`
- OS files: `.DS_Store`, `Thumbs.db`
- Large data files: `analyses/**/data/*` (except `.remote_metadata.json`)
- CSV debug files: `analyses/**/results/*.csv` (frontend uses JSON)

## Map Architecture (January 2025)

All maps show **municipality boundaries only** (581 Belgian municipalities). There is no hierarchical level-switching between regions, provinces, and municipalities.

### Core Principles
- **One map component**: `MunicipalityMap`
- **Always municipality-level GeoJSON**: `belgium_municipalities.json` (790KB)
- **Province data is expanded** to municipalities via `map-utils.ts`
- **Province boundaries** can be shown as overlay

### Example Usage
```typescript
import { MunicipalityMap } from "@/components/analyses/shared/MunicipalityMap"
import { expandProvinceToMunicipalities } from "@/lib/map-utils"

// Province-level data
const provinceData = [{ p: '10000', permits: 500 }]

// Expand to municipalities
const municipalityData = expandProvinceToMunicipalities(
  provinceData,
  (d) => d.p,
  (d) => d.permits
)

<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.value}
  showProvinceBoundaries={true}  // Show province overlay
/>
```

### Removed Components (DO NOT USE)
- ❌ `RegionMap.tsx` (deleted)
- ❌ `ProvinceMap.tsx` (deleted)
- ❌ `UnifiedMap.tsx` (deleted)
- ❌ `MapLevelToggle.tsx` (deleted)
- ❌ `InteractiveMap.tsx` (refactored → MunicipalityMap)

## Additional Resources

- **CLAUDE.md**: Instructions for Claude Code (similar content, different AI)
- **LLM_DOCUMENTATION_PROTOCOL.md**: Documentation standards and templates
- **docs/INDEX.md**: Documentation hub with links to all workflows
- **TESTING.md**: Detailed testing guide (in `embuild-analyses/`)
- **GitHub Pages**: https://gehuybre.github.io/data-blog/
