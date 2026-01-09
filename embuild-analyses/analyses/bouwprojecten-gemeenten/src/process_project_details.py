"""
Process municipal investment project details from meerjarenplan projecten.csv.

This script:
1. Parses the CSV file with multi-line text blocks
2. Extracts project details (Beleidsdoelstelling, Actieplan, Actie)
3. Classifies projects into contractor-relevant categories
4. Outputs chunked JSON files for web consumption
"""

import pandas as pd
import json
import re
from pathlib import Path
from category_keywords import classify_project, get_category_label, get_category_emoji, CATEGORY_DEFINITIONS

# Directories
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / 'data'
PUBLIC_DATA_DIR = SCRIPT_DIR.parent.parent.parent / 'public' / 'data' / 'gemeentelijke-investeringen'
PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)

# Input file
INPUT_CSV = DATA_DIR / 'meerjarenplan projecten.csv'

# NIS code lookup for municipality names
SHARED_DATA_DIR = SCRIPT_DIR.parent.parent.parent / 'shared-data'
NIS_FILE = SHARED_DATA_DIR / 'nis' / 'refnis.csv'


def load_nis_lookups():
    """Load NIS municipality lookups."""
    nis_df = pd.read_csv(NIS_FILE, encoding='utf-8')

    # Filter for Flemish municipalities (NIS codes starting with 1, 2, 3, 4, 7)
    municipalities = nis_df[
        (nis_df['LVL_REFNIS'] == 4) &
        (nis_df['CD_REFNIS'].astype(str).str[0].isin(['1', '2', '3', '4', '7']))
    ].copy()

    # Create lookup dictionary
    nis_lookup = {}
    for _, row in municipalities.iterrows():
        nis_code = str(row['CD_REFNIS'])
        name = row['TX_REFNIS_NL'].strip()
        if '(' in name:
            name = name.split('(')[0].strip()
        nis_lookup[name] = nis_code

    return nis_lookup


def extract_code_description(text_block):
    """
    Extract code and descriptions from a multi-line text block.

    Expected format:
    "Code: XXX
    Korte omschrijving: Short text
    Lange omschrijving: Long text
    Commentaar: Optional comment
    Evaluatie: Optional evaluation"

    Returns:
        dict with keys: code, short, long, comment, evaluation
    """
    if pd.isna(text_block) or not text_block.strip():
        return {}

    result = {}

    # Extract code (BD, AP, or AC followed by digits)
    code_match = re.search(r'Code:\s*([A-Z]+\d+)', text_block)
    if code_match:
        result['code'] = code_match.group(1)

    # Extract korte omschrijving
    short_match = re.search(r'Korte omschrijving:\s*(.+?)(?:\n|$)', text_block, re.DOTALL)
    if short_match:
        short_text = short_match.group(1).strip()
        # Extract until next section or newline
        short_text = re.split(r'\n(?=Lange omschrijving:|Commentaar:|Evaluatie:)', short_text)[0].strip()
        result['short'] = short_text

    # Extract lange omschrijving
    long_match = re.search(r'Lange omschrijving:\s*(.+?)(?=\nCommentaar:|\nEvaluatie:|$)', text_block, re.DOTALL)
    if long_match:
        result['long'] = long_match.group(1).strip()

    # Extract commentaar (optional)
    comment_match = re.search(r'Commentaar:\s*(.+?)(?=\nEvaluatie:|$)', text_block, re.DOTALL)
    if comment_match:
        comment_text = comment_match.group(1).strip()
        if comment_text:
            result['comment'] = comment_text

    # Extract evaluatie (optional)
    eval_match = re.search(r'Evaluatie:\s*(.+?)$', text_block, re.DOTALL)
    if eval_match:
        eval_text = eval_match.group(1).strip()
        if eval_text:
            result['evaluation'] = eval_text

    return result


def parse_csv():
    """Parse the CSV file with multi-line text blocks."""
    print("\n" + "="*60)
    print("PARSING MEERJARENPLAN PROJECTEN CSV")
    print("="*60)

    # Read CSV with proper handling of quoted multi-line fields
    df = pd.read_csv(INPUT_CSV, sep=';', quotechar='"', encoding='utf-8')

    print(f"Loaded {len(df)} records from CSV")
    print(f"Columns: {list(df.columns)}")

    return df


def process_projects(df, nis_lookup):
    """Process raw CSV data into structured project records."""
    print("\n" + "="*60)
    print("PROCESSING PROJECTS")
    print("="*60)

    projects = []
    skipped_no_municipality = 0
    skipped_no_nis = 0
    skipped_no_amounts = 0

    for idx, row in df.iterrows():
        if idx % 500 == 0:
            print(f"Processing record {idx}/{len(df)}...")

        municipality_name = row['Bestuur']
        if pd.isna(municipality_name) or not municipality_name.strip():
            skipped_no_municipality += 1
            continue

        # Get NIS code
        nis_code = nis_lookup.get(municipality_name.strip())
        if not nis_code:
            # Try without accents/special chars
            skipped_no_nis += 1
            continue

        # Extract Beleidsdoelstelling
        bd_data = extract_code_description(row['Beleidsdoelst. totaaloverzicht'])

        # Extract Actieplan
        ap_data = extract_code_description(row['Actieplan totaaloverzicht'])

        # Extract Actie (the actual project)
        ac_data = extract_code_description(row['Actie totaaloverzicht'])

        if not ac_data.get('code') or not ac_data.get('short'):
            continue  # Skip if no valid action

        # Parse yearly amounts
        year_columns = [
            ('2026,Uitgave', '2026,Uitgave per inwoner'),
            ('2027,Uitgave', '2027,Uitgave per inwoner'),
            ('2028,Uitgave', '2028,Uitgave per inwoner'),
            ('2029,Uitgave', '2029,Uitgave per inwoner'),
            ('2030,Uitgave', '2030,Uitgave per inwoner'),
            ('2031,Uitgave', '2031,Uitgave per inwoner')
        ]

        yearly_amounts = {}
        yearly_per_capita = {}
        total_amount = 0
        has_any_amount = False

        for year, (total_col, per_capita_col) in zip(range(2026, 2032), year_columns):
            year_str = str(year)

            # Parse total amount
            amount_val = row.get(total_col)
            if pd.notna(amount_val):
                # Handle both int/float and string formats
                if isinstance(amount_val, (int, float)):
                    amount = amount_val
                else:
                    # Remove dots (thousand separators) and replace comma with dot
                    amount_str = str(amount_val).replace('.', '').replace(',', '.')
                    try:
                        amount = float(amount_str)
                    except:
                        amount = 0
                yearly_amounts[year_str] = amount
                total_amount += amount
                if amount > 0:
                    has_any_amount = True
            else:
                yearly_amounts[year_str] = 0

            # Parse per capita amount
            per_capita_val = row.get(per_capita_col)
            if pd.notna(per_capita_val):
                if isinstance(per_capita_val, (int, float)):
                    per_capita = per_capita_val
                else:
                    per_capita_str = str(per_capita_val).replace('.', '').replace(',', '.')
                    try:
                        per_capita = float(per_capita_str)
                    except:
                        per_capita = 0
                yearly_per_capita[year_str] = per_capita
            else:
                yearly_per_capita[year_str] = 0

        # Skip projects with no budget
        if not has_any_amount:
            skipped_no_amounts += 1
            continue

        # Calculate average per capita
        avg_per_capita = sum(yearly_per_capita.values()) / 6 if yearly_per_capita else 0

        # Classify project into categories
        ac_short = ac_data.get('short', '')
        ac_long = ac_data.get('long', '')
        categories = classify_project(ac_short, ac_long)

        # Build project record
        project = {
            "municipality": municipality_name.strip(),
            "nis_code": nis_code,
            "bd_code": bd_data.get('code', ''),
            "bd_short": bd_data.get('short', ''),
            "bd_long": bd_data.get('long', ''),
            "ap_code": ap_data.get('code', ''),
            "ap_short": ap_data.get('short', ''),
            "ap_long": ap_data.get('long', ''),
            "ac_code": ac_data.get('code', ''),
            "ac_short": ac_short,
            "ac_long": ac_long,
            "total_amount": round(total_amount, 2),
            "amount_per_capita": round(avg_per_capita, 2),
            "yearly_amounts": {k: round(v, 2) for k, v in yearly_amounts.items()},
            "yearly_per_capita": {k: round(v, 2) for k, v in yearly_per_capita.items()},
            "categories": categories
        }

        projects.append(project)

    print(f"\nProcessed {len(projects)} valid projects")
    print(f"Skipped: {skipped_no_municipality} (no municipality), {skipped_no_nis} (no NIS code), {skipped_no_amounts} (no amounts)")

    return projects


def chunk_and_save(projects, chunk_size=2000):
    """Split projects into chunks and save as JSON files."""
    print("\n" + "="*60)
    print("CHUNKING AND SAVING DATA")
    print("="*60)

    # Sort projects by total amount (descending)
    projects_sorted = sorted(projects, key=lambda x: x['total_amount'], reverse=True)

    # Split into chunks
    chunks = [projects_sorted[i:i + chunk_size] for i in range(0, len(projects_sorted), chunk_size)]

    print(f"Creating {len(chunks)} chunks of ~{chunk_size} projects each")

    for i, chunk in enumerate(chunks):
        filename = f"projects_2026_chunk_{i}.json"
        filepath = PUBLIC_DATA_DIR / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(chunk, f, ensure_ascii=False, indent=2)
        size_mb = filepath.stat().st_size / 1024 / 1024
        print(f"  → {filename} ({len(chunk)} projects, {size_mb:.2f} MB)")

    # Create metadata file
    total_amount = sum(p['total_amount'] for p in projects)
    municipalities = len(set(p['nis_code'] for p in projects))

    # Count projects per category
    category_counts = {}
    for project in projects:
        for cat in project['categories']:
            category_counts[cat] = category_counts.get(cat, 0) + 1

    metadata = {
        "total_projects": len(projects),
        "total_amount": round(total_amount, 2),
        "municipalities": municipalities,
        "chunks": len(chunks),
        "chunk_size": chunk_size,
        "categories": {
            cat_id: {
                "id": cat_id,
                "label": get_category_label(cat_id),
                "emoji": get_category_emoji(cat_id),
                "project_count": category_counts.get(cat_id, 0)
            }
            for cat_id in list(CATEGORY_DEFINITIONS.keys()) + ["overige"]
        }
    }

    metadata_file = PUBLIC_DATA_DIR / "projects_metadata.json"
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"\n  → projects_metadata.json")
    print(f"\nMetadata:")
    print(f"  Total projects: {metadata['total_projects']}")
    print(f"  Total amount: €{metadata['total_amount']:,.0f}")
    print(f"  Municipalities: {metadata['municipalities']}")
    print(f"  Chunks: {metadata['chunks']}")
    print(f"\nCategory breakdown:")
    for cat_id, cat_data in sorted(metadata['categories'].items(), key=lambda x: x[1]['project_count'], reverse=True):
        print(f"  {cat_data['emoji']} {cat_data['label']}: {cat_data['project_count']} projects")


def main():
    """Main processing pipeline."""
    print("\n" + "="*60)
    print("MUNICIPAL INVESTMENT PROJECT DETAILS PROCESSOR")
    print("="*60)

    # Load NIS lookups
    print("\nLoading NIS municipality lookups...")
    nis_lookup = load_nis_lookups()
    print(f"Loaded {len(nis_lookup)} municipalities")

    # Parse CSV
    df = parse_csv()

    # Process projects
    projects = process_projects(df, nis_lookup)

    # Chunk and save
    chunk_and_save(projects)

    print("\n" + "="*60)
    print("KLAAR!")
    print("="*60)


if __name__ == "__main__":
    main()
