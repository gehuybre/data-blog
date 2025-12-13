---
kind: file
path: embuild-analyses/contentlayer.config.ts
role: Configuration
workflows:
  - WF-project-setup
inputs: []
---

# contentlayer.config.ts

Configuration for Contentlayer. Defines the `Analysis` document type and source directory.

It is configured to look for MDX files in the `analyses` directory. Each analysis is expected to be in its own subdirectory (e.g., `analyses/my-analysis/content.mdx`).
