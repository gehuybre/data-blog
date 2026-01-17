#!/usr/bin/env python3
"""Validate documentation files according to LLM Documentation Protocol.

Exits with code 0 when all checks pass; non-zero otherwise.

Checks performed:
- Workflow docs (`docs/workflows/*.md`) front matter validation
- File docs (`docs/files/**/*.md`) front matter validation
- `docs/INDEX.md` workflows listed exist
- Workflows' `files` entries refer to existing repo paths (warn or fail)

Usage:
  validate_docs.py [--check-paths]

Options:
  --check-paths  Check that file paths referenced in workflow `files:` exist in the repo
"""
from pathlib import Path
import sys
import re
try:
    import yaml
except Exception:
    yaml = None  # PyYAML not installed; fallback to a simple parser below

from typing import Tuple, List

import os

def find_repo_root() -> Path:
    """Find the repository root by checking for common repo markers.

    Order of checks:
      1. Environment override REPO_ROOT_OVERRIDE
      2. Look for '.git' from current working dir upward
      3. Look for 'docs' or 'README.md' or 'package.json' upward from current working dir
      4. Repeat checks starting from the script directory
      5. Fallback to a sensible parent of the script path
    """
    # 1. env override
    env = os.environ.get("REPO_ROOT_OVERRIDE")
    if env:
        return Path(env)

    markers = [".git", "README.md", "package.json", "docs"]

    def climb(start: Path):
        p = start
        for _ in range(50):
            for m in markers:
                if (p / m).exists():
                    return p
            if p.parent == p:
                break
            p = p.parent
        return None

    # 2 & 3: try from current working dir
    cwd_root = climb(Path.cwd())
    if cwd_root:
        return cwd_root

    # 4: try from script location
    script_root = climb(Path(__file__).resolve().parent)
    if script_root:
        return script_root

    # 5: fallback - pick an ancestor that seems like repo root (parents[4]) if available
    parents = Path(__file__).resolve().parents
    if len(parents) >= 5:
        return parents[4]
    return parents[-1]


REPO_ROOT = find_repo_root()
DOCS_ROOT = REPO_ROOT / "docs"
WORKFLOWS_DIR = DOCS_ROOT / "workflows"
FILES_DIR = DOCS_ROOT / "files"
INDEX_FILE = DOCS_ROOT / "INDEX.md"

WORKFLOW_REQUIRED = ["kind", "id", "status", "last_reviewed", "files"]
FILE_REQUIRED = ["kind", "path", "last_reviewed"]


def simple_yaml_parse(s: str) -> dict:
    """A very small YAML-like parser to avoid a hard dependency on PyYAML for basic front matter.
    Supports simple key: value pairs and lists in the front matter blocks used by this repo.
    """
    out = {}
    cur_key = None
    for raw in s.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line and not line.startswith("-"):
            key, val = line.split(":", 1)
            key = key.strip()
            val = val.strip()
            if val == "[]":
                out[key] = []
            elif val.lower() in ("null", "none"):
                out[key] = None
            else:
                # try to interpret simple lists written as [a, b]
                if val.startswith("[") and val.endswith("]"):
                    items = [i.strip() for i in val[1:-1].split(",") if i.strip()]
                    out[key] = items
                else:
                    out[key] = val
            cur_key = key
        elif line.startswith("-") and cur_key:
            # treat as a list under the last key; convert scalars to lists if necessary
            item = line[1:].strip()
            existing = out.get(cur_key)
            if existing is None:
                out[cur_key] = [item]
            elif isinstance(existing, list):
                existing.append(item)
            else:
                # scalar -> convert to list preserving previous value
                out[cur_key] = [existing, item]
    return out


def load_front_matter(path: Path) -> Tuple[dict, str]:
    text = path.read_text()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return None, text
    fm_text = m.group(1)
    if yaml:
        fm = yaml.safe_load(fm_text) or {}
    else:
        fm = simple_yaml_parse(fm_text)
    body = text[m.end():]
    return fm, body


def check_date_format(date_str: str) -> bool:
    return bool(re.match(r"^\d{4}-\d{2}-\d{2}$", date_str))


def add_last_reviewed(path: Path, date_str: str):
    """Insert last_reviewed: YYYY-MM-DD into the existing front matter of the file at `path`."""
    text = path.read_text()
    m = re.match(r"^(---\n)(.*?\n)(---\n)(.*)$", text, re.S)
    if not m:
        raise ValueError("No front matter to update")
    start, body_block, end_block, rest = m.groups()
    # If last_reviewed already exists, do nothing
    if re.search(r"^last_reviewed:\s*\d{4}-\d{2}-\d{2}", body_block, re.M):
        return
    # Append last_reviewed before the closing ---
    new_body = body_block + f"last_reviewed: {date_str}\n"
    new_text = start + new_body + end_block + rest
    path.write_text(new_text)


def scaffold_front_matter(path: Path):
    """Create a minimal front matter block for a file missing it.

    For workflows, create a workflow front matter; for file docs, create a file front matter.
    """
    rel = path.relative_to(DOCS_ROOT)
    if rel.parts[0] == 'workflows':
        slug = path.stem.replace('WF-','')
        fm = {
            'kind': 'workflow',
            'id': path.stem,
            'owner': 'Unknown',
            'status': 'experimental',
            'trigger': 'manual',
            'inputs': [],
            'outputs': [],
            'entrypoints': [],
            'files': [],
            'last_reviewed': __import__('datetime').date.today().isoformat()
        }
        fm_text = '---\n' + '\n'.join(f"{k}: {v}" for k,v in fm.items()) + '\n---\n\n'
        existing = path.read_text() if path.exists() else ''
        path.write_text(fm_text + existing)
    elif rel.parts[0] == 'files':
        # For file docs, set path to repo-relative path
        repo_path = '/'.join(rel.parts[1:])
        fm = {
            'kind': 'file',
            'path': repo_path,
            'role': 'Unknown',
            'workflows': [],
            'inputs': [],
            'outputs': [],
            'interfaces': [],
            'stability': 'experimental',
            'owner': 'Unknown',
            'safe_to_delete_when': 'Unknown',
            'superseded_by': 'null',
            'last_reviewed': __import__('datetime').date.today().isoformat()
        }
        fm_text = '---\n' + '\n'.join(f"{k}: {v}" for k,v in fm.items()) + '\n---\n\n'
        existing = path.read_text() if path.exists() else ''
        path.write_text(fm_text + existing)
    else:
        raise ValueError('Unknown doc location for scaffolding')


def validate_workflow_doc(path: Path) -> List[str]:
    errors = []
    fm, _ = load_front_matter(path)
    if fm is None:
        errors.append(f"Missing front matter: {path}")
        return errors
    for key in WORKFLOW_REQUIRED:
        if key not in fm:
            errors.append(f"Missing '{key}' in front matter of {path}")
    if fm.get("kind") != "workflow":
        errors.append(f"Invalid kind in {path}: expected 'workflow' got '{fm.get('kind')}'")
    if "id" in fm:
        stem = path.stem
        if fm["id"] != stem and fm["id"] != f"WF-{stem}":
            errors.append(f"Workflow id '{fm['id']}' does not match filename stem '{stem}' in {path}")
    if "last_reviewed" in fm and not check_date_format(str(fm["last_reviewed"])):
        errors.append(f"Invalid last_reviewed format in {path}: {fm.get('last_reviewed')}")
    # files should be a list
    if "files" in fm and not isinstance(fm["files"], list):
        errors.append(f"'files' must be a list in {path}")
    return errors


def validate_file_doc(path: Path) -> List[str]:
    errors = []
    fm, _ = load_front_matter(path)
    if fm is None:
        errors.append(f"Missing front matter: {path}")
        return errors
    for key in FILE_REQUIRED:
        if key not in fm:
            errors.append(f"Missing '{key}' in front matter of {path}")
    if fm.get("kind") != "file":
        errors.append(f"Invalid kind in {path}: expected 'file' got '{fm.get('kind')}'")
    if "last_reviewed" in fm and not check_date_format(str(fm["last_reviewed"])):
        errors.append(f"Invalid last_reviewed format in {path}: {fm.get('last_reviewed')}")
    return errors


def index_listed_workflows(index_path: Path) -> List[str]:
    text = index_path.read_text()
    # match links like - [WF-name](workflows/WF-name.md)
    matches = re.findall(r"\[([^\]]+)\]\(workflows/([^)]+)\)", text)
    # return list of filename stems (without .md)
    return [m[1].replace('.md','') for m in matches]


def generate_checklist_text(errors: List[str], warnings: List[str]) -> str:
    """Generate an actionable checklist markdown grouped by error type."""
    from collections import defaultdict
    groups = defaultdict(list)
    other_errors = []

    for e in errors:
        # categorize common patterns
        if e.startswith("Missing front matter:"):
            path = e.split(":", 1)[1].strip()
            groups['missing_front_matter'].append(path)
        elif "Missing '" in e and "in front matter" in e:
            # e.g. Missing 'last_reviewed' in front matter of /path
            m = re.match(r"Missing '([^']+)' in front matter of (.+)", e)
            if m:
                key, path = m.groups()
                groups[f"missing_key::{key}"].append(path)
            else:
                other_errors.append(e)
        else:
            other_errors.append(e)

    # Warnings grouped by referenced file
    warn_groups = defaultdict(list)
    for w in warnings:
        # e.g. Referenced repo file missing: /path (from /workflow)
        m = re.match(r"Referenced repo file missing: (.+) \(from (.+)\)", w)
        if m:
            file_path, from_doc = m.groups()
            warn_groups[from_doc].append(file_path)
        else:
            warn_groups['other'].append(w)

    lines = []
    lines.append("# Validation Checklist")
    lines.append("")
    lines.append("Run the validator with: `python .github/skills/llm-documentation-protocol/scripts/validate_docs.py --check-paths`")
    lines.append("")

    # Missing front matter
    mf = groups.get('missing_front_matter', [])
    if mf:
        lines.append("## Files missing front matter 📝")
        lines.append("")
        for p in sorted(mf):
            lines.append(f"- [ ] Add YAML front matter to `{p}`")
        lines.append("")

    # Missing keys
    key_groups = {k: v for k, v in groups.items() if k.startswith('missing_key::')}
    if key_groups:
        lines.append("## Files with missing front-matter keys ⚠️")
        lines.append("")
        for k, paths in sorted(key_groups.items()):
            key = k.split('::', 1)[1]
            for p in sorted(paths):
                lines.append(f"- [ ] Add `{key}: YYYY-MM-DD` to `{p}`" if key == 'last_reviewed' else f"- [ ] Add `{key}` to `{p}`")
        lines.append("")

    # Other errors
    if other_errors:
        lines.append("## Other errors")
        lines.append("")
        for e in other_errors:
            lines.append(f"- [ ] Review: {e}")
        lines.append("")

    # Warnings
    if warn_groups:
        lines.append("## Warnings (check referenced repo files)")
        lines.append("")
        for doc, files in sorted(warn_groups.items()):
            if doc == 'other':
                for w in files:
                    lines.append(f"- [ ] Check: {w}")
            else:
                lines.append(f"### From `{doc}`")
                for f in sorted(files):
                    lines.append(f"- [ ] Verify or add repo file `{f}` referenced from `{doc}`")
                lines.append("")

    # Summary
    lines.append("---")
    lines.append(f"Errors: {len(errors)}, Warnings: {len(warnings)}")
    lines.append("")
    lines.append("_Generated automatically by `validate_docs.py`._")

    return "\n".join(lines)


def main(argv=None) -> int:
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--check-paths", action="store_true", help="Fail if workflow 'files' entries point to missing repo files")
    parser.add_argument("--fix", action="store_true", help="Automatically fix trivial issues (e.g., add missing last_reviewed)")
    parser.add_argument("--scaffold", action="store_true", help="Create minimal front matter for files missing front matter (use with care)")
    args = parser.parse_args(argv)

    errors = []
    warnings = []

    # Track items found for optional fixes
    missing_last_reviewed = []
    missing_front_matter = []

    # Workflows
    if not WORKFLOWS_DIR.exists():
        errors.append(f"Missing workflows dir: {WORKFLOWS_DIR}")
    else:
        for p in WORKFLOWS_DIR.glob("*.md"):
            errors.extend(validate_workflow_doc(p))

    # File docs
    if not FILES_DIR.exists():
        errors.append(f"Missing files dir: {FILES_DIR}")
    else:
        for p in FILES_DIR.rglob("*.md"):
            errors.extend(validate_file_doc(p))

    # INDEX workflows
    if not INDEX_FILE.exists():
        errors.append(f"Missing docs index: {INDEX_FILE}")
    else:
        listed = index_listed_workflows(INDEX_FILE)
        for wf in listed:
            wf_path = WORKFLOWS_DIR / (wf + ".md")
            if not wf_path.exists():
                errors.append(f"Workflow listed in INDEX.md not found: {wf_path}")

    # Collect front-matter issues for optional fixes
    for p in WORKFLOWS_DIR.glob("*.md") if WORKFLOWS_DIR.exists() else []:
        fm, _ = load_front_matter(p)
        if fm is None:
            missing_front_matter.append(p)
        else:
            if "last_reviewed" not in fm:
                missing_last_reviewed.append(p)
    for p in FILES_DIR.rglob("*.md") if FILES_DIR.exists() else []:
        fm, _ = load_front_matter(p)
        if fm is None:
            missing_front_matter.append(p)
        else:
            if "last_reviewed" not in fm:
                missing_last_reviewed.append(p)

    # Optional: check workflow files exist
    # Only check code-like files for existence (skip data files such as CSVs in analyses/*/data/)
    CODE_EXTS = {'.py', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.md', '.sh'}

    if args.check_paths and WORKFLOWS_DIR.exists():
        for p in WORKFLOWS_DIR.glob("*.md"):
            fm, _ = load_front_matter(p)
            if fm and isinstance(fm.get("files"), list):
                for repo_path in fm.get("files"):
                    # Skip obvious data files/paths
                    repo_path_str = str(repo_path)
                    if "/data/" in repo_path_str or repo_path_str.lower().endswith(('.csv', '.parquet', '.xlsx')):
                        # intentionally skip non-code data files
                        continue
                    repo_file = REPO_ROOT / repo_path
                    # Only verify for code-like extensions or docs
                    if repo_file.suffix and repo_file.suffix.lower() not in CODE_EXTS:
                        continue
                    if not repo_file.exists():
                        warnings.append(f"Referenced repo file missing: {repo_file} (from {p})")

    # If --fix or --scaffold provided, perform minimal automatic fixes
    if args.fix or args.scaffold:
        today = __import__('datetime').date.today().isoformat()
        fixed = []
        scaffolded = []
        if args.fix:
            for p in missing_last_reviewed:
                try:
                    add_last_reviewed(p, today)
                    fixed.append(p)
                except Exception as exc:
                    print(f"Failed to fix last_reviewed for {p}: {exc}")
        if args.scaffold:
            for p in missing_front_matter:
                try:
                    scaffold_front_matter(p)
                    scaffolded.append(p)
                except Exception as exc:
                    print(f"Failed to scaffold front matter for {p}: {exc}")

        if fixed or scaffolded:
            print(f"Applied fixes: {len(fixed)} last_reviewed, {len(scaffolded)} scaffolds")
            # Re-run validator as a subprocess (clean re-evaluation)
            proc = __import__('subprocess').run([sys.executable, str(Path(__file__).resolve()), "--check-paths"], cwd=str(REPO_ROOT))
            return proc.returncode

    # Output
    # Build report text
    report_lines = []
    if errors:
        report_lines.append("Errors found in documentation validation:")
        for e in errors:
            report_lines.append(f" -  {e}")
    if warnings:
        report_lines.append("Warnings:")
        for w in warnings:
            report_lines.append(f" -  {w}")

    report_text = "\n".join(report_lines) if report_lines else "All documentation checks passed."

    # Ensure docs directory exists and write raw report for easy viewing
    try:
        DOCS_ROOT.mkdir(parents=True, exist_ok=True)
        (DOCS_ROOT / "VALIDATION_REPORT.md").write_text(report_text + "\n")
        # Also generate an actionable checklist grouped by error type
        checklist_path = DOCS_ROOT / "VALIDATION_CHECKLIST.md"
        checklist_text = generate_checklist_text(errors, warnings)
        checklist_path.write_text(checklist_text + "\n")
        print(f"Wrote: {DOCS_ROOT / 'VALIDATION_REPORT.md'}")
        print(f"Wrote: {checklist_path}")
    except Exception as exc:
        print(f"Failed to write report files: {exc}")

    # Print summary to stdout as before
    if errors:
        print(report_text)
        return 2
    if warnings:
        print(report_text)
        # make warnings non-fatal but informative
        return 1
    print("All documentation checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
