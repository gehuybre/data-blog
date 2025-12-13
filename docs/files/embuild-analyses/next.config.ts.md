---
kind: file
path: embuild-analyses/next.config.ts
role: Configuration
workflows:
  - WF-project-setup
inputs: []
---

# next.config.ts

Next.js configuration.

- Wraps the config with `withContentlayer` to enable MDX processing.
- Sets `output: "export"` for static site generation.
- Configures `basePath` and `assetPrefix` for GitHub Pages deployment (assumes repo name is `data-blog`).
