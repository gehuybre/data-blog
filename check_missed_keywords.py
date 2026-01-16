#!/usr/bin/env python3
"""Check for missed school-related projects."""

import json
from pathlib import Path

# Load all chunks
data_dir = Path('embuild-analyses/public/data/bouwprojecten-gemeenten')
all_projects = []

print("Loading all chunks...")
for i in range(7):  # 7 chunks according to metadata
    chunk_file = data_dir / f'projects_2026_chunk_{i}.json'
    with open(chunk_file, 'r', encoding='utf-8') as f:
        all_projects.extend(json.load(f))

print(f"Total projects loaded: {len(all_projects)}\n")

# Check for "scholen" keyword
print("="*80)
print("Checking for 'scholen' keyword")
print("="*80)

missed_scholen = []
for p in all_projects:
    text = f"{p['ac_short']} {p.get('ac_long', '')}".lower()
    if 'scholen' in text and 'scholenbouw' not in p['categories']:
        missed_scholen.append(p)

print(f"Projects with 'scholen' NOT in scholenbouw: {len(missed_scholen)}")

if missed_scholen:
    print("\nFirst 5 examples:")
    for p in missed_scholen[:5]:
        print(f"\n- {p['municipality']}: {p['ac_short'][:80]}")
        print(f"  Categories: {p['categories']}")

# Check for "onderwijs" keyword
print("\n" + "="*80)
print("Checking for 'onderwijs' keyword")
print("="*80)

missed_onderwijs = []
for p in all_projects:
    text = f"{p['ac_short']} {p.get('ac_long', '')}".lower()
    if 'onderwijs' in text and 'scholenbouw' not in p['categories']:
        missed_onderwijs.append(p)

print(f"Projects with 'onderwijs' NOT in scholenbouw: {len(missed_onderwijs)}")

if missed_onderwijs:
    print("\nFirst 5 examples:")
    for p in missed_onderwijs[:5]:
        print(f"\n- {p['municipality']}: {p['ac_short'][:80]}")
        print(f"  Categories: {p['categories']}")

# Summary
print("\n" + "="*80)
print("SUMMARY")
print("="*80)
print(f"Total projects: {len(all_projects)}")
print(f"Missed 'scholen': {len(missed_scholen)}")
print(f"Missed 'onderwijs': {len(missed_onderwijs)}")
print(f"Scholenbouw projects in data: {sum(1 for p in all_projects if 'scholenbouw' in p['categories'])}")
