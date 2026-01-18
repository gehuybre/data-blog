---
name: content-writer
description: Write and edit MDX content for blog posts. Use when the user asks to write blog content, edit text, add descriptions, create intro paragraphs, write analysis summaries, or update content.mdx files. This skill covers MDX syntax, frontmatter requirements, content structure, and writing guidelines for data analysis blog posts.
---

# Content Writer

## Overview

This skill guides you through writing and editing MDX content for data analysis blog posts, including frontmatter configuration, content structure, and writing best practices.

## MDX File Structure

Every blog post is a `content.mdx` file in `embuild-analyses/analyses/<slug>/`:

```mdx
---
title: Post Title
date: 2025-01-18
summary: Brief 1-2 sentence summary
tags: [tag1, tag2]
slug: post-slug
sourceProvider: Organization Name
sourceTitle: Dataset Title
sourceUrl: https://source.url
sourcePublicationDate: 2025-01-01
---

import { DashboardComponent } from "@/components/analyses/slug/DashboardComponent"

Optional intro paragraph explaining the analysis.

<DashboardComponent />
```

## Frontmatter Fields

### Required Fields

**title** (string)
- Full descriptive title of the analysis
- Used as H1 on the page
- Should be clear and informative
- Examples: "Bouwondernemers", "Vergunningen Goedkeuringen"

**date** (YYYY-MM-DD)
- Publication date of the blog post
- NOT the data date (that's `sourcePublicationDate`)
- Format: `2025-01-18`

**summary** (string)
- Brief 1-2 sentence description
- Appears in blog post listings and meta tags
- Should capture the main insight or purpose
- Keep under 160 characters for SEO

**tags** (array of strings)
- Categorical tags for the post
- Common tags: `["bouw", "economie", "ondernemerschap", "vergunningen"]`
- Use lowercase, no spaces (use hyphens for multi-word tags)

**slug** (string)
- URL-friendly identifier
- Must match the directory name
- Use lowercase with hyphens
- Examples: `"bouwondernemers"`, `"vergunningen-goedkeuringen"`

**sourceProvider** (string)
- Name of the data source organization
- Examples: `"Statbel"`, `"FOD Economie"`, `"Vlaanderen.be"`

**sourceTitle** (string)
- Title of the dataset or source page
- Examples: `"Ondernemers - Datalab"`, `"Bouwvergunningen Database"`

**sourceUrl** (string)
- Full URL to the data source
- Must be a valid URL starting with `http://` or `https://`

**sourcePublicationDate** (YYYY-MM-DD)
- Date when the data was published or last updated
- This is the DATA date, not the blog post date
- Format: `2025-01-01`

## Content Body

### Structure

**1. Imports** (required)
```mdx
import { DashboardComponent } from "@/components/analyses/slug/DashboardComponent"
```

**2. Intro paragraph** (optional but recommended)
- 1-3 sentences introducing the analysis
- Explain what the data shows
- Mention if data date differs from publication date
- Keep it concise

**3. Dashboard component** (required)
```mdx
<DashboardComponent />
```

### Writing Guidelines

**Do:**
- Write in clear, accessible Dutch
- Use active voice
- Keep sentences concise
- Explain data context when needed
- Mention data date if it differs from publication date

**Don't:**
- Add H1 headings (`#`) - the title is rendered from frontmatter
- Include source citations in body - these are auto-generated from frontmatter
- Write lengthy introductions - keep it brief
- Add navigation or metadata - this is handled by the layout

### Example Intro Paragraphs

**Minimal:**
```mdx
Deze pagina analyseert het aantal zelfstandige ondernemers in België.
```

**With context:**
```mdx
Deze pagina analyseert het aantal zelfstandige ondernemers in België,
uitgesplitst per sector, geslacht, regio en leeftijd. De data omvat alle
NACE-sectoren en toont de evolutie over de periode 2017-2022.
```

**With data date clarification:**
```mdx
Deze analyse toont de evolutie van bouwvergunningen in Vlaanderen.
De data is afkomstig van FOD Economie en is actueel tot december 2024.
```

## MDX Syntax

### Components

Import and use React components:
```mdx
import { MyComponent } from "@/components/analyses/slug/MyComponent"

<MyComponent prop="value" />
```

### Text Formatting

**Bold:**
```mdx
Dit is **belangrijk**.
```

**Italic:**
```mdx
Dit is *benadrukt*.
```

**Links:**
```mdx
Zie [de officiële website](https://example.com) voor meer info.
```

### Lists

**Unordered:**
```mdx
- Punt 1
- Punt 2
- Punt 3
```

**Ordered:**
```mdx
1. Eerste stap
2. Tweede stap
3. Derde stap
```

### Code (rare in blog posts)

**Inline code:**
```mdx
De variabele `count` bevat het aantal.
```

**Code blocks:**
```mdx
\`\`\`
code here
\`\`\`
```

## Common Patterns

### Pattern 1: Minimal Post

```mdx
---
title: Bouwondernemers
date: 2025-01-10
summary: Analyse van zelfstandige ondernemers in de bouwsector.
tags: [bouw, ondernemerschap]
slug: bouwondernemers
sourceProvider: Statbel
sourceTitle: Ondernemers - Datalab
sourceUrl: https://statbel.fgov.be/nl/open-data/ondernemers-datalab
sourcePublicationDate: 2022-12-31
---

import { BouwondernemersDashboard } from "@/components/analyses/bouwondernemers/BouwondernemersDashboard"

<BouwondernemersDashboard />
```

### Pattern 2: With Intro

```mdx
---
title: Vergunningen Goedkeuringen
date: 2025-01-15
summary: Analyse van goedgekeurde bouwvergunningen per provincie en jaar.
tags: [bouw, vergunningen]
slug: vergunningen-goedkeuringen
sourceProvider: FOD Economie
sourceTitle: Bouwvergunningen Database
sourceUrl: https://statbel.fgov.be/nl/themas/bouwen-wonen
sourcePublicationDate: 2024-12-31
---

import { VergunningenDashboard } from "@/components/analyses/vergunningen-goedkeuringen/VergunningenDashboard"

Deze analyse toont de evolutie van goedgekeurde bouwvergunningen in België.
De data is uitgesplitst per provincie en bevat zowel nieuwe bouwprojecten
als verbouwingen.

<VergunningenDashboard />
```

### Pattern 3: Multiple Sections

```mdx
---
title: Gemeentelijke Investeringen
date: 2025-01-12
summary: Analyse van investeringen door gemeenten in België.
tags: [economie, gemeenten]
slug: gemeentelijke-investeringen
sourceProvider: FOD Financiën
sourceTitle: Gemeentelijke Financiën Dataset
sourceUrl: https://financien.belgium.be/nl/over-de-fod/cijfers
sourcePublicationDate: 2024-12-31
---

import { InvesteringenDashboard } from "@/components/analyses/gemeentelijke-investeringen/InvesteringenDashboard"

Deze analyse onderzoekt de investeringen door Belgische gemeenten over
de periode 2015-2023. De data toont trends in infrastructuur, onderwijs,
en sociale voorzieningen.

<InvesteringenDashboard />
```

## Editing Existing Content

When editing an existing `content.mdx` file:

**1. Read the file first**
```bash
Read embuild-analyses/analyses/<slug>/content.mdx
```

**2. Make targeted edits**
- Update only what needs changing
- Preserve existing structure
- Don't remove working components

**3. Common edits:**
- Update title or summary
- Add/clarify intro paragraph
- Update source information
- Fix typos or grammar
- Add missing frontmatter fields

## Data Date vs Publication Date

**Important distinction:**

- **`date`** (publication date): When you published the blog post
- **`sourcePublicationDate`** (data date): When the data was published

If these differ significantly (>6 months), mention it in the intro:

```mdx
Deze analyse is gebaseerd op data van december 2023. De data is
afkomstig van Statbel en wordt jaarlijks bijgewerkt.
```

## Frontmatter Validation

Check that frontmatter is valid:

**Valid:**
```yaml
---
title: My Title
date: 2025-01-18
summary: A brief summary.
tags: [tag1, tag2]
slug: my-slug
sourceProvider: Provider Name
sourceTitle: Dataset Title
sourceUrl: https://example.com
sourcePublicationDate: 2025-01-01
---
```

**Invalid:**
```yaml
---
title: My Title
date: 01-18-2025  # Wrong date format
summary: A brief summary.
tags: tag1, tag2  # Should be array syntax
slug: My Slug     # Should be lowercase with hyphens
sourceUrl: example.com  # Missing https://
---
```

## Best Practices

**Frontmatter:**
- Use consistent date format (YYYY-MM-DD)
- Keep summaries under 160 characters
- Use descriptive, SEO-friendly titles
- Ensure slug matches directory name exactly

**Content:**
- Write in Dutch (primary audience)
- Keep intro paragraphs brief (1-3 sentences)
- Don't duplicate information from frontmatter
- Let the dashboard components do the heavy lifting

**Components:**
- Import components before using them
- Use absolute imports with `@/`
- One dashboard component per post is typical
- Components handle all data visualization

**Source Attribution:**
- Always provide complete source information
- Use official organization names
- Link to the actual data source (not generic homepage)
- Include data publication date

## Troubleshooting

**Build errors:**
- Check YAML frontmatter syntax (colons, quotes, arrays)
- Ensure all required fields are present
- Verify component import paths are correct
- Check for unclosed JSX tags

**Component not rendering:**
- Verify import statement matches file path
- Check component name capitalization
- Ensure component is exported from source file

**Frontmatter not parsing:**
- Ensure `---` delimiters are on their own lines
- No spaces before `---`
- Valid YAML syntax (colons, indentation)
- All strings with special characters in quotes

## Examples from Codebase

See real content files:
- [embuild-analyses/analyses/bouwondernemers/content.mdx](embuild-analyses/analyses/bouwondernemers/content.mdx)
- [embuild-analyses/analyses/vergunningen-goedkeuringen/content.mdx](embuild-analyses/analyses/vergunningen-goedkeuringen/content.mdx)
- [embuild-analyses/analyses/faillissementen/content.mdx](embuild-analyses/analyses/faillissementen/content.mdx)
