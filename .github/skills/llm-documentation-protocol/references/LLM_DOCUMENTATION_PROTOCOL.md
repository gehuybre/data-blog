# Repository Documentation Protocol (for the coding LLM)

## Goal

Keep all repo explanations in one consistent place with one consistent structure so a reader, including an LLM, can quickly answer what a file is for, why it exists, which workflow uses it, what it takes as input, what it outputs, and when it can be deleted or archived.

Do not write long implementation walkthroughs. Focus on purpose, context, data shape, interfaces, and lifecycle.

## Where docs live

Use `docs/` as the canonical location.

- Workflow docs go in `docs/workflows/`
- File docs go in `docs/files/`
- The master index goes in `docs/INDEX.md`

Use `.github/` only for GitHub process items like PR templates. If you add a PR template, it should link to `docs/INDEX.md`.

## When to create docs

Whenever you add or significantly change any of the following, create or update docs in the same PR:

- A new workflow or a meaningful change to an existing workflow’s inputs, outputs, or steps
- A new entrypoint (CLI, script executed by CI, worker/cron job, GitHub Action workflow)
- A new pipeline stage or module that consumes or produces data
- A new integration with an external system
- A new config surface (new env vars, new config file keys)
- Any change that makes older files potentially unused

You do not need a doc page for tiny helpers unless they directly define a contract or touch data IO. Prefer documenting units of meaning, but if the repo policy is one doc per new file, do it with minimal content and keep it short.

## Naming conventions

### Workflow docs

File: `docs/workflows/WF-<slug>.md`

- `<slug>` is lowercase and hyphenated
- Example: `docs/workflows/WF-ingest-customer-data.md`

Workflow ID is the filename stem, for example `WF-ingest-customer-data`.

### File docs

Mirror the repository path inside `docs/files/` and append `.md`.

Example mappings:

- Repo file `src/pipeline/normalize.py` becomes `docs/files/src/pipeline/normalize.py.md`
- Repo file `.github/workflows/ci.yml` becomes `docs/files/.github/workflows/ci.yml.md`

Do not invent a different naming scheme. Always mirror the real path.

## Required structure and content rules

### Writing rules

- Use short paragraphs. One idea per paragraph.
- Avoid long lists of steps explaining internal logic.
- Inputs and outputs should describe type and shape, not code.
- Prefer stable nouns and explicit names.
- If you don’t know a detail, write `Unknown` and add a `TODO:` line.

### Front matter (mandatory)

Every workflow doc and file doc must start with YAML front matter so it is machine-parseable.

#### Workflow doc front matter

```md
---
kind: workflow
id: WF-<slug>
owner: Unknown
status: active
trigger: Unknown
inputs: []
outputs: []
entrypoints: []
files: []
last_reviewed: YYYY-MM-DD
---
```

Rules:

- `id` must exactly match the workflow filename stem.
- `status` is one of: `active`, `deprecated`, `experimental`
- `inputs` and `outputs` are arrays of short objects, described below.
- `files` is a list of repo paths, not doc paths.

#### File doc front matter

```md
---
kind: file
path: <repo-relative-path>
role: Unknown
workflows: []
inputs: []
outputs: []
interfaces: []
stability: experimental
owner: Unknown
safe_to_delete_when: Unknown
superseded_by: null
last_reviewed: YYYY-MM-DD
---
```

Rules:

- `path` must exactly match the repo path.
- `stability` is one of: `experimental`, `stable`, `legacy`, `deprecated`
- `superseded_by` is a repo path or null.

### Input and output object format

Use this exact shape in both workflow and file docs:

```yml
inputs:
  - name: <short name>
    from: <source repo path or system name>
    type: <dataframe|json|csv|parquet|sql-table|api-request|config|file|artifact|other>
    schema: <short description or link to schema doc>
    required: true
outputs:
  - name: <short name>
    to: <destination repo path or system name>
    type: <dataframe|json|csv|parquet|sql-table|api-request|config|file|artifact|other>
    schema: <short description or link>
```

If the schema is documented elsewhere, set `schema` to a relative link like `docs/schemas/customer.json`.

## Templates to use

### Workflow doc template

After front matter, use this exact heading structure:

```md
# WF: <Human name>

## Purpose
One paragraph on why this workflow exists.

## Trigger
How it starts. Mention schedule, manual, webhook, CI, etc.

## Inputs
Explain each input in one short paragraph. Match the front matter items.

## Outputs
Explain each output in one short paragraph. Match the front matter items.

## Steps (high level)
3 to 7 short bullets only. Phase-level, not implementation.

## Files involved
List repo paths. Each must have a corresponding file doc in docs/files/.
```

### File doc template

After front matter, use this exact heading structure:

```md
# File: <repo path>

## Role
One paragraph describing the responsibility.

## Why it exists
One paragraph explaining why it is a separate file.

## Used by workflows
List workflow IDs. Each must link to a workflow doc.

## Inputs
One short paragraph per input. Match the front matter items.

## Outputs
One short paragraph per output. Match the front matter items.

## Interfaces
Name only. For example: CLI command, public function names, exported class names.

## Ownership and lifecycle
State stability, owner, safe_to_delete_when, and superseded_by in plain words.
```

## Cross-linking rules

- In workflow docs, every file listed in Files involved must have a file doc.
- In file docs, every workflow listed in Used by workflows must exist as a workflow doc.
- In `docs/INDEX.md`, every workflow must be listed and linked.

Use relative links that work in GitHub, for example:

- `../workflows/WF-ingest-customer-data.md`
- `../files/src/pipeline/normalize.py.md`

## Updating `docs/INDEX.md`

Maintain `docs/INDEX.md` as the navigation hub.

It must include:

- A list of workflows with a one-line description and link
- A Key entrypoints section linking to the file docs for entrypoints
- A note explaining how to add new docs following this protocol

Minimal structure:

```md
# Documentation Index

## Workflows
- [WF-ingest-customer-data](workflows/WF-ingest-customer-data.md): <one line>

## Key entrypoints
- [src/cli/main.py](files/src/cli/main.py.md): <one line>
```

## How to document changes in a PR

When you create or modify code, follow this procedure:

1. Identify whether the change introduces or modifies a workflow, entrypoint, data IO, integration, or config surface.
2. Create or update the relevant workflow doc.
3. Create or update the relevant file docs.
4. Update `docs/INDEX.md`.
5. In each touched file doc, update `last_reviewed` to today’s date.
6. If a workflow change makes files unused, mark those file docs as:
   - `stability: deprecated`
   - set `safe_to_delete_when` with a concrete condition
   - optionally set `superseded_by`

## Quality bar checklist (must pass)

Before finishing, ensure:

- Every new repo file has either a file doc, or an explicit reason in the PR summary why it does not need one.
- No file doc explains internal line-by-line behavior.
- Inputs and outputs are described consistently in front matter and text.
- Links resolve. No missing workflows or missing file docs.
- Safe to delete when is filled in for files that might become obsolete.

## Output format for the LLM when asked to do doc work

When you perform documentation work, output:

- A list of files you created or updated
- For each, include the full markdown content exactly as it should appear

Do not include extra commentary outside of those deliverables unless requested.

## Automation and CI

This repository provides helper scripts and a CI workflow to support doc quality:

- `scripts/generate_file_doc.py` - Generate `docs/files/<repo-path>.md` templates.
- `scripts/generate_workflow_doc.py` - Generate `docs/workflows/WF-<slug>.md` templates.
- `scripts/validate_docs.py` - Validate front matter, `docs/INDEX.md`, and optional repo path references.
- CI workflow: `.github/workflows/validate-docs.yml` runs the validator and `pytest` on PRs touching docs or skill files.

Use `--check-paths` with `validate_docs.py` to make the validator also fail when workflows refer to missing repo paths.

Last generated: 2025-12-09
