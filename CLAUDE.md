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

## Blog Post Requirements

Every blog post must include these elements:

### Required Content
- **Title**: Clear and descriptive title
- **Publication Date**: Date when the blog post was created
- **Data Date**: Date of the data (if different from publication date, must be explicitly mentioned)

### Sections
Each section displaying data must include:

1. **Data Visualization**: Display data as:
   - Tables
   - Charts (using Recharts)
   - Maps (using RegionMap/ProvinceMap/MunicipalityMap)

2. **Download CSV Button**: Each section must have a button to download the data as CSV

3. **Embed Code Button**: Each section must have a button to generate embed code for sharing the visualization on other websites

4. **Filtering (when applicable)**:
   - Geographic filters: Allow filtering by region, province, or municipality (using GeoFilter component)
   - Sector filters: Allow filtering by main sector (hoofdsector) when the data includes sector information

### Footer
- **Data Source**: Include source citation at the bottom of the blog post with a link to the original data

### Implementation Notes
- Use the shared components from `src/components/analyses/shared/`:
  - `AnalysisSection` for section wrappers
  - `GeoContext` and `GeoFilter` for geographic filtering
  - `FilterableChart` for charts with filtering capability
  - `RegionMap`, `ProvinceMap`, `MunicipalityMap` for geographic visualizations

## Conventions

- Use absolute imports: `@/` (configured in tsconfig.json)
- Use shadcn/ui components from `src/components/ui`
- Use lucide-react for icons
- Geographic data uses Belgian NIS codes (regions, provinces, municipalities)
- Production build uses basePath `/data-blog` for GitHub Pages
- 
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
