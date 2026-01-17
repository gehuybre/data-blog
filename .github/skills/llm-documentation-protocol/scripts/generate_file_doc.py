#!/usr/bin/env python3
"""Generate a file doc template under docs/files/ for a given repository path.

Usage:
  generate_file_doc.py <repo-path> [--output-dir docs/files] [--force] [--print-only]

Examples:
  generate_file_doc.py src/cli/main.py
  generate_file_doc.py .github/workflows/ci.yml --force
  generate_file_doc.py src/lib/utils.py --print-only
"""

from pathlib import Path
import argparse
import datetime
import sys

TEMPLATE = """---
kind: file
path: {path}
role: Unknown
workflows: []
inputs: []
outputs: []
interfaces: []
stability: experimental
owner: Unknown
safe_to_delete_when: Unknown
superseded_by: null
last_reviewed: {date}
---

# File: {path}

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
"""


def make_doc_content(repo_path: str, date: str) -> str:
    return TEMPLATE.format(path=repo_path, date=date)


def write_doc(repo_path: str, output_dir: Path, force: bool) -> Path:
    # Normalize repo path and build target path under output_dir
    repo_path = repo_path.lstrip("/")
    target = output_dir / (repo_path + ".md")
    target_parent = target.parent
    target_parent.mkdir(parents=True, exist_ok=True)

    if target.exists() and not force:
        print(f"❌ Error: Target already exists: {target}. Use --force to overwrite.")
        return None

    content = make_doc_content(repo_path, datetime.date.today().isoformat())
    target.write_text(content)
    print(f"✅ Wrote file doc: {target}")
    return target


def main(argv=None):
    parser = argparse.ArgumentParser(description="Generate a file doc template under docs/files/")
    parser.add_argument("repo_path", help="Repository-relative path to document (e.g., src/cli/main.py)")
    parser.add_argument("--output-dir", default="docs/files", help="Base output directory for generated docs")
    parser.add_argument("--force", action="store_true", help="Overwrite if file exists")
    parser.add_argument("--print-only", action="store_true", help="Print the generated content to stdout instead of writing")

    args = parser.parse_args(argv)

    repo_path = args.repo_path
    output_dir = Path(args.output_dir)

    content = make_doc_content(repo_path, datetime.date.today().isoformat())

    if args.print_only:
        print(content)
        return 0

    result = write_doc(repo_path, output_dir, args.force)
    if result:
        return 0
    else:
        return 1


if __name__ == "__main__":
    sys.exit(main())
