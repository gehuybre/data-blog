Manual validation scripts for the Blog Post Creator skill

These helper scripts are provided so contributors can run local checks before creating or updating analyses. They are intentionally **not** part of the global test suite; run them manually from the repository root when needed.

Scripts
- validate_mdx.py: checks MDX files for
  - no top-level `# H1` in the MDX body
  - presence of `import` from `@/components/analyses/<slug>/...`
  - that imported dashboard components are mounted in the MDX body

  Run: python .github/skills/blog-post-creator/scripts/validate_mdx.py

- validate_component_usage.py: scans analysis components for `<AnalysisSection` and `<TimeSeriesSection` usages and verifies `slug` and `sectionId` are provided on the JSX tag.

  Run: python .github/skills/blog-post-creator/scripts/validate_component_usage.py

- validate_embed_consistency.js: checks `EMBED_CONFIGS` and `embed-data-registry.ts` to ensure all `standard` embeds have an entry in the registry.

  Run: node .github/skills/blog-post-creator/scripts/validate_embed_consistency.js

Usage notes
- These scripts look for the repository root by walking up from their location until they find `embuild-analyses`.
- Keep these scripts up-to-date if you change validation rules or move files.
