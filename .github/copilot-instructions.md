# GitHub Copilot Instructions for Data Blog

## Project Overview
This is a **Next.js 14** project (App Router) using **TypeScript**, **Tailwind CSS**, and **shadcn/ui**. It is a static site (SSG) deployed to GitHub Pages, focused on data analyses.

## Architecture & Structure

### Core Components
- **Root**: `embuild-analyses/` contains the Next.js application.
- **Content**: `embuild-analyses/analyses/` is the source of truth for blog posts.
  - Each analysis is a self-contained folder: `analyses/<slug>/`.
  - Required structure per analysis:
    - `content.mdx`: The blog post content (MDX).
    - `data/`: Raw data files.
    - `results/`: Processed data (JSON/CSV) to be consumed by the frontend.
    - `src/`: Python/R scripts to process data.
- **Content Management**: **Contentlayer** is used to transform MDX into type-safe JSON data.
  - Config: `embuild-analyses/contentlayer.config.ts`.
  - Content Dir: `embuild-analyses/analyses`.

### Data Flow
1.  **Analysis**: Scripts in `analyses/<slug>/src/` process data from `data/` and output to `results/`.
2.  **Build**: Contentlayer reads `content.mdx`.
3.  **Runtime**: Frontend components fetch data from `results/` (Note: Ensure data is accessible via public path or imported directly if small).

## Developer Workflows

### Running the Project
- **Preferred**: Run `python run_blog.py` from the project root. This handles the dev server startup.
- **Alternative**: `cd embuild-analyses && npm run dev`.

### Creating a New Analysis
1.  Create a new folder: `embuild-analyses/analyses/<new-slug>/`.
2.  Add `content.mdx` with required frontmatter:
    ```yaml
    ---
    title: "Title"
    date: 2023-10-27
    summary: "Short summary"
    tags: ["tag1", "tag2"]
    slug: "new-slug"
    ---
    ```
3.  Add data processing scripts in `src/` and raw data in `data/`.

## Conventions & Standards

### Documentation Protocol
- **Strict Rule**: Follow `LLM_DOCUMENTATION_PROTOCOL.md`.
- **Location**: All docs live in `docs/`.
- **Workflows**: `docs/workflows/WF-<slug>.md`.
- **Files**: `docs/files/<path-to-file>.md`.
- **Update Rule**: When modifying workflows or adding key files, update the corresponding documentation in `docs/`.

### Tech Stack Details
- **Styling**: Use Tailwind CSS utility classes.
- **Components**: Use `shadcn/ui` components from `src/components/ui`.
- **Icons**: `lucide-react`.
- **Dates**: `date-fns`.

### Code Style
- **TypeScript**: Strict mode is enabled. Define interfaces for all data structures.
- **Imports**: Use absolute imports `@/` where possible (configured in `tsconfig.json`).
