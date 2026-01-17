#!/usr/bin/env python3
"""Check that for each source file in specified directories a corresponding docs/files entry exists.

Default checks:
 - embuild-analyses/src
 - embuild-analyses/analyses

Docs are expected at: docs/files/<repo-path>.md

Usage:
  check_docs_coverage.py [--root <repo-root>] [--dirs <d1,d2>] [--exts <.py,.ts,...>] [--ignore <ignore-file>] [--fix]

Options:
  --root        Repo root (default: repository root)
  --dirs        Comma-separated list of directories to check (default: embuild-analyses/src,embuild-analyses/analyses)
  --exts        Comma-separated extensions to check (default: .py,.ts,.tsx,.js,.jsx,.md)
  --ignore      Optional ignore file with one glob pattern per line (relative to repo root)
  --print-only  Print missing docs and exit (default action)
  --fix         Create missing docs using `generate_file_doc.py --force` (requires Python available)

Exit codes:
 - 0: no missing docs
 - 1: warnings (e.g., missing docs but not using --fix)
 - 2: errors (invalid args or failure while fixing)
"""
from pathlib import Path
import argparse
import fnmatch
import subprocess
import sys

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DIRS = ["embuild-analyses/src", "embuild-analyses/analyses"]
DEFAULT_EXTS = [".py", ".ts", ".tsx", ".js", ".jsx", ".md"]


def load_ignore_patterns(ignore_file: Path):
    # If no ignore file was specified, look for the default asset path
    default = Path(__file__).resolve().parents[1] / "assets" / "docs-coverage-ignore.txt"
    target = Path(ignore_file) if ignore_file else default
    if not target.exists():
        return []
    return [line.strip() for line in target.read_text().splitlines() if line.strip() and not line.strip().startswith("#")]


def is_ignored(path: Path, ignore_patterns):
    rel = str(path)
    for pat in ignore_patterns:
        if fnmatch.fnmatch(rel, pat) or fnmatch.fnmatch(Path(rel).as_posix(), pat):
            return True
    return False


def collect_source_files(root: Path, dirs, exts, ignore_patterns):
    files = []
    for d in dirs:
        base = root / d
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.is_file() and p.suffix in exts:
                rel = p.relative_to(root)
                if is_ignored(rel, ignore_patterns):
                    continue
                files.append(rel)
    return sorted(files)


def expected_doc_path(repo_rel_path: Path) -> Path:
    return Path("docs/files") / (str(repo_rel_path) + ".md")


def make_file_doc(repo_rel_path: Path, repo_root: Path, force: bool=False):
    # call existing script
    script = repo_root / ".github/skills/llm-documentation-protocol/scripts/generate_file_doc.py"
    if not script.exists():
        print(f"❌ generate_file_doc.py not found at {script}")
        return False
    args = [sys.executable, str(script), str(repo_rel_path)]
    if force:
        args.append("--force")
    proc = subprocess.run(args, cwd=str(repo_root))
    return proc.returncode == 0


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=str(REPO_ROOT))
    parser.add_argument("--dirs", default=','.join(DEFAULT_DIRS))
    parser.add_argument("--exts", default=','.join(DEFAULT_EXTS))
    parser.add_argument("--ignore")
    parser.add_argument("--print-only", action="store_true")
    parser.add_argument("--fix", action="store_true")
    args = parser.parse_args(argv)

    repo_root = Path(args.root)
    dirs = [d.strip() for d in args.dirs.split(',') if d.strip()]
    exts = [e.strip() for e in args.exts.split(',') if e.strip()]
    ignore_patterns = load_ignore_patterns(Path(args.ignore)) if args.ignore else []

    files = collect_source_files(repo_root, dirs, exts, ignore_patterns)

    missing = []
    for f in files:
        doc = repo_root / expected_doc_path(f)
        if not doc.exists():
            missing.append((f, doc))

    if not missing:
        print("No missing docs — all checked files have corresponding docs/files entries.")
        return 0

    print(f"Missing docs for {len(missing)} files:")
    for repo_path, doc_path in missing:
        print(f" - {repo_path} -> expected {doc_path}")

    if args.fix:
        print("Attempting to create missing docs using generate_file_doc.py...")
        failed = []
        for repo_path, doc_path in missing:
            ok = make_file_doc(repo_path, repo_root, force=True)
            if not ok:
                failed.append(repo_path)
        if failed:
            print(f"Failed to create docs for {len(failed)} files. Exiting with error.")
            return 2
        print("Successfully created missing docs.")
        return 0

    # default: print-only
    return 1


if __name__ == '__main__':
    rc = main()
    sys.exit(rc)
