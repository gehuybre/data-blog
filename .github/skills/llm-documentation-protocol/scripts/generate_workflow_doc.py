#!/usr/bin/env python3
"""Generate a workflow doc template under docs/workflows/ for a given workflow id.

Usage:
  generate_workflow_doc.py <slug> [--output-dir docs/workflows] [--force] [--print-only]

Examples:
  generate_workflow_doc.py ingest-customer-data
  generate_workflow_doc.py example --print-only
"""
from pathlib import Path
import argparse
import datetime
import sys

TEMPLATE = """---
kind: workflow
id: WF-{slug}
owner: Unknown
status: experimental
trigger: Unknown
inputs: []
outputs: []
entrypoints: []
files: []
last_reviewed: {date}
---

# WF: {title}

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
"""


def title_case(slug: str) -> str:
    return " ".join(w.capitalize() for w in slug.split("-"))


def make_content(slug: str) -> str:
    return TEMPLATE.format(slug=slug, title=title_case(slug), date=datetime.date.today().isoformat())


def write_doc(slug: str, output_dir: Path, force: bool) -> Path:
    target = output_dir / (f"WF-{slug}.md")
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and not force:
        print(f"❌ Error: Target already exists: {target}. Use --force to overwrite.")
        return None
    content = make_content(slug)
    target.write_text(content)
    print(f"✅ Wrote workflow doc: {target}")
    return target


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("slug", help="Workflow slug (lowercase, hyphenated)")
    parser.add_argument("--output-dir", default="docs/workflows", help="Base output directory for generated docs")
    parser.add_argument("--force", action="store_true", help="Overwrite if file exists")
    parser.add_argument("--print-only", action="store_true", help="Print the generated content to stdout instead of writing")
    args = parser.parse_args(argv)

    content = make_content(args.slug)
    if args.print_only:
        print(content)
        return 0

    result = write_doc(args.slug, Path(args.output_dir), args.force)
    if result:
        return 0
    else:
        return 1


if __name__ == "__main__":
    sys.exit(main())
