#!/usr/bin/env python3
import re
import sys
from pathlib import Path

# Find repository root by walking up until 'embuild-analyses' exists
here = Path(__file__).resolve()
root = here
for _ in range(10):
    if (root / 'embuild-analyses').exists():
        break
    root = root.parent
else:
    print('Could not find repo root (no embuild-analyses folder)')
    sys.exit(2)

ANALYSES = root / 'embuild-analyses' / 'analyses'

errors = []

for mdx in ANALYSES.rglob('content.mdx'):
    rel = mdx.relative_to(root)
    text = mdx.read_text(encoding='utf-8')

    # Split frontmatter
    if text.startswith('---'):
        parts = text.split('---', 2)
        if len(parts) >= 3:
            body = parts[2]
        else:
            body = text
    else:
        body = text

    # 1) No top-level H1 in body
    for i, line in enumerate(body.splitlines(), start=1):
        if re.match(r'^#\s', line):
            errors.append(f"{rel}: contains top-level H1 on line {i}: {line.strip()}")
            break

    # 2) Import from analysis components must exist
    slug = mdx.parent.name
    import_pattern = re.compile(r'import\s+\{([^}]+)\}\s+from\s+["\']@/components/analyses/' + re.escape(slug) + r'/([^"\']+)["\']')
    imports = import_pattern.findall(text)
    if not imports:
        errors.append(f"{rel}: no import from '@/components/analyses/{slug}/...' found")
        continue

    # Collect imported identifiers and check usage
    imported_ids = []
    for group in imports:
        ids = group[0]
        for ident in ids.split(','):
            imported_ids.append(ident.strip())

    mounted = False
    for ident in imported_ids:
        # look for JSX usage
        if re.search(rf'<\s*{re.escape(ident)}(\s|>|/)', body):
            mounted = True
            break
    if not mounted:
        errors.append(f"{rel}: imported component(s) {imported_ids} not mounted in body")

if errors:
    print("MDX validation errors:")
    for e in errors:
        print(" - ", e)
    sys.exit(2)

print("MDX validation: OK")
sys.exit(0)
