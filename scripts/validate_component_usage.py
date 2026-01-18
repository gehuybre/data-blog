#!/usr/bin/env python3
"""Simple check for AnalysisSection/TimeSeriesSection usage.
Looks for JSX tags and ensures slug and sectionId attributes are present in the tag.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'embuild-analyses' / 'src'
errors = []

jsxs = list(SRC.rglob('**/*.{tsx,ts,jsx,js}'))
pattern = re.compile(r'<\s*(AnalysisSection|TimeSeriesSection)\b', re.M)

for path in jsxs:
    text = path.read_text(encoding='utf-8')
    for m in pattern.finditer(text):
        start = m.start()
        # find tag end '>' but careful with multiline
        rest = text[start: start + 500]
        tag_end = rest.find('>')
        if tag_end == -1:
            # fallback: look further
            tag_end = text.find('>', start)
            if tag_end == -1:
                errors.append(f"{path.relative_to(ROOT)}: can't find end of tag for {m.group(1)}")
                continue
            tag_text = text[start:tag_end]
        else:
            tag_text = rest[:tag_end]

        if 'slug=' not in tag_text or 'sectionId=' not in tag_text:
            errors.append(f"{path.relative_to(ROOT)}: {m.group(1)} used without slug and/or sectionId: {tag_text.strip()}")

if errors:
    print("Component usage validation errors:")
    for e in errors:
        print(" - ", e)
    sys.exit(2)

print("Component usage validation: OK")
sys.exit(0)
