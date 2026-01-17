---
name: llm-documentation-protocol
description: "Guidelines and templates for creating and updating repository documentation following the LLM Documentation Protocol. Use when adding or modifying workflow or file docs, updating `docs/INDEX.md`, or reviewing PRs that change entrypoints, workflows, data IO, or config surfaces."
---

# LLM Documentation Protocol Skill

## Overview

Provide concise, machine-friendly guidance and templates for applying the project's documentation protocol. This skill helps authors and reviewers create or update `docs/workflows/`, `docs/files/`, and `docs/INDEX.md` entries that conform to the repository standard.

## When to use this skill

- Adding a new workflow or modifying an existing workflow's inputs/outputs/steps
- Adding a new entrypoint (CLI script, CI job, worker) or modifying one
- Introducing or changing data IO (new pipelines, new schemas, new integrations)
- Changing config surfaces (env vars, config keys)
- Updating `docs/INDEX.md` to reflect new or changed docs
- Reviewing PRs that touch the above areas and ensuring the documentation checklist is followed

## Quick start

1. Identify the impacted workflows and files.
2. Create or update workflow docs in `docs/workflows/WF-<slug>.md` with the required front matter and template sections. Use `scripts/generate_workflow_doc.py <slug> --print-only` to preview.
3. Create or update matching file docs in `docs/files/<repo-path>.md` mirroring the repo path as required. Use `scripts/generate_file_doc.py <repo-path> --print-only` to preview.
4. Update `docs/INDEX.md` to include new workflows and key entrypoints.
5. Set `last_reviewed` to today's date in each updated doc.
6. Run the quality checklist (see Checklist section below) and include doc changes in the PR.

Example commands:

```bash
# Preview a file doc
python .github/skills/llm-documentation-protocol/scripts/generate_file_doc.py src/my/new_file.py --print-only

# Create a workflow doc
python .github/skills/llm-documentation-protocol/scripts/generate_workflow_doc.py my-new-workflow --force

# Run validator (non-fatal warnings return code 1; errors return code 2)
python .github/skills/llm-documentation-protocol/scripts/validate_docs.py --check-paths
```

## Required templates & rules (high-level)

- Workflow front matter must include: `kind: workflow`, `id`, `owner`, `status`, `trigger`, `inputs`, `outputs`, `entrypoints`, `files`, `last_reviewed`.
- File doc front matter must include: `kind: file`, `path` (repo path), `role`, `workflows`, `inputs`, `outputs`, `interfaces`, `stability`, `owner`, `safe_to_delete_when`, `superseded_by`, `last_reviewed`.
- Use the exact Input/Output object shape specified in the protocol (name, from/to, type, schema, required).
- Mirror repo paths exactly when creating file docs under `docs/files/`.

## Checklist (quality bar)

- Every new repo file has a file doc or a clear reason in the PR why it does not need one. ✅
- No file doc explains internal line-by-line behavior. ✅
- Inputs and outputs are consistent between front matter and body text. ✅
- Links resolve and workflows/file docs referenced exist. ✅
- `safe_to_delete_when` is set for files that might become obsolete. ✅

## Output format for the LLM when asked to perform doc work

When this skill is used to *generate or modify docs*, produce only the following deliverable (no extra commentary unless explicitly requested):

- A list of files created or updated (repo path under `docs/`), and
- For each file, the full markdown content exactly as it should appear in the repository.

Do not include additional explanation, analysis, or notes in the same response. If asked for a summary, provide it in a separate response only when explicitly requested.

## Examples

- Create `docs/workflows/WF-ingest-data.md` with required front matter and template sections when adding a scheduled ingestion job.
- Update `docs/files/src/cli/main.py.md` and set `last_reviewed: YYYY-MM-DD` when a CLI entrypoint changes.

## Resources

- Full protocol (authoritative): `references/LLM_DOCUMENTATION_PROTOCOL.md` (mirror of repository protocol)
- Templates and examples: use `docs/workflows/` and `docs/files/` for examples in this repo
- Helper scripts:
  - `scripts/generate_file_doc.py` — generate a file doc template for a given repo path (see usage in script header)
  - `scripts/generate_workflow_doc.py` — generate `docs/workflows/WF-<slug>.md` template
  - `scripts/validate_docs.py` — run validations used in CI (checks front matter, INDEX, and optional path checks)
  - `scripts/check_docs_coverage.py` — scan `embuild-analyses/src` and `embuild-analyses/analyses` for files without `docs/files/` entries; supports `--fix` to create docs via `generate_file_doc.py`
- Ignore file: `assets/docs-coverage-ignore.txt` — example glob patterns to skip files from coverage checks (one pattern per line)
- CI: A GitHub Action `.github/workflows/validate-docs.yml` runs the validator and unit tests on PRs touching docs or skills.

## Local-only check

The docs coverage check (`scripts/check_docs_coverage.py`) is intended to be run locally only (it is not executed in CI by default). Use this command locally to list missing docs:

```bash
python .github/skills/llm-documentation-protocol/scripts/check_docs_coverage.py --print-only
```

To automatically create missing file docs (use with care):

```bash
python .github/skills/llm-documentation-protocol/scripts/check_docs_coverage.py --fix
```

If you need a repository-level enforcement later, we can add a manual `workflow_dispatch` job that maintainers can run on-demand; for now the check is local-only to avoid noisy PR failures.
---

**Usage note:** Keep guidance short and action-oriented. Prefer absolute templates and machine-readable front matter over implementation details.
