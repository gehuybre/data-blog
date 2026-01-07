"""
Gemeentelijke investeringen data processor.

Processes municipal investment data from the Flemish Government's BBC-DR data.
The data comes from transposed Excel files downloaded via a BI application.
"""

import json
import re
from pathlib import Path
import pandas as pd
import numpy as np
from nis_mapping import add_nis_codes_to_dataframe

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RESULTS_DIR = BASE_DIR / "results"
CONTENT_FILE = BASE_DIR / "content.mdx"

# Input files
BV_TOTAAL_FILE = DATA_DIR / "meerjarenplan per bv totaal.xlsx"
BV_PER_INW_FILE = DATA_DIR / "meerjarenplan per bv per inw.xlsx"
KOSTENPOST_TOTAAL_FILE = DATA_DIR / "meerjarenplan kostenpost totaal.xlsx"
KOSTENPOST_PER_INW_FILE = DATA_DIR / "meerjarenplan kostenpost per inwoner.xlsx"


def update_mdx_frontmatter_date(path: Path, date_str: str) -> bool:
    """Update the date field in MDX frontmatter."""
    if not path.exists():
        return False

    text = path.read_text(encoding="utf-8")
    if text.startswith("\ufeff"):
        text = text.lstrip("\ufeff")

    if not text.startswith("---"):
        return False

    newline = "\r\n" if "\r\n" in text else "\n"
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        return False

    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break
    if end_idx is None:
        return False

    fm_lines = lines[1:end_idx]
    body_lines = lines[end_idx + 1 :]

    updated = False
    seen_date = False
    new_fm_lines = []
    for line in fm_lines:
        if re.match(r"^date:\s*.*$", line):
            if not seen_date:
                new_fm_lines.append(f"date: {date_str}{newline}")
                updated = True
                seen_date = True
            else:
                updated = True
        else:
            new_fm_lines.append(line)

    if not seen_date:
        inserted = False
        new2 = []
        for line in new_fm_lines:
            new2.append(line)
            if not inserted and re.match(r"^title:\s*.*$", line):
                new2.append(f"date: {date_str}{newline}")
                inserted = True
        if not inserted:
            new2.append(f"date: {date_str}{newline}")
        new_fm_lines = new2
        updated = True

    new_text = "".join([f"---{newline}", *new_fm_lines, f"---{newline}", *body_lines])
    if new_text == text:
        return False
    path.write_text(new_text, encoding="utf-8")
    return updated


def process_bv_data(file_path: Path) -> pd.DataFrame:
    """
    Process the BV (beleidsdomein/subdomein) data files.
    """
    # Read without header to correctly handle metadata rows
    df = pd.read_excel(file_path, header=None)

    # Extract metadata from first rows
    type_rapport = df.iloc[0].tolist()
    rapportjaar = df.iloc[1].tolist()
    boekjaar = df.iloc[2].tolist()
    bv_domein = df.iloc[3].tolist()
    bv_subdomein = df.iloc[4].tolist()

    # Municipality data starts from row 5
    muni_data = df.iloc[5:].copy()
    
    # Get municipality names from first column
    municipalities_raw = muni_data[0].tolist()
    
    # Map original indices to our subset
    muni_indices = muni_data.index
    
    # Build records with filtering
    municipalities = []
    
    for real_idx, muni_name in zip(muni_indices, municipalities_raw):
        # Skip non-municipality entries
        if pd.isna(muni_name):
            continue
        muni_str = str(muni_name).strip()
        # Skip "Total", "Uitgave", and entries containing "OCMW" (duplicates)
        if muni_str in ['Total', 'Uitgave', 'Uitgave per inwoner'] or 'OCMW' in muni_str:
            continue
        municipalities.append((real_idx, muni_str))

    # Build records: each column (except first) is a data point
    records = []
    for col_idx in range(1, len(df.columns)):
        # Skip if no valid year
        year = rapportjaar[col_idx]
        if pd.isna(year) or year == '':
            continue

        # Extract domain and subdomain
        domein = bv_domein[col_idx] if not pd.isna(bv_domein[col_idx]) else None
        subdomein = bv_subdomein[col_idx] if not pd.isna(bv_subdomein[col_idx]) else None

        # Parse domain code and name
        domein_code = None
        domein_name = None
        if domein:
            parts = str(domein).split(' ', 1)
            if len(parts) == 2:
                domein_code = parts[0]
                domein_name = parts[1]
            else:
                domein_name = str(domein)

        # Parse subdomain code and name
        subdomein_code = None
        subdomein_name = None
        if subdomein:
            parts = str(subdomein).split(' ', 1)
            if len(parts) == 2:
                subdomein_code = parts[0]
                subdomein_name = parts[1]
            else:
                subdomein_name = str(subdomein)

        # Iterate over municipalities
        for muni_idx, municipality in municipalities:
            value = df.iloc[muni_idx, col_idx]

            # Skip NaN values
            if pd.isna(value):
                continue

            try:
                value_float = float(value)
            except (ValueError, TypeError):
                continue

            records.append({
                'year': int(year),
                'municipality': municipality,
                'domain_code': domein_code,
                'domain_name': domein_name,
                'subdomain_code': subdomein_code,
                'subdomain_name': subdomein_name,
                'value': value_float
            })

    return pd.DataFrame(records)


def process_kostenpost_data(file_path: Path) -> pd.DataFrame:
    """
    Process the kostenpost (cost category) data files.
    """
    # Read without header
    df = pd.read_excel(file_path, header=None)

    # Find row with "Bestuur" to identify columns
    header_row_idx = None
    for i in range(20):  # Check first 20 rows
        vals = df.iloc[i].astype(str).tolist()
        if "Bestuur" in vals or "Bestuur " in vals:
            header_row_idx = i
            break
            
    if header_row_idx is None:
        # Fallback: check row 0
        header_row_idx = 0
        
    print(f"  Header row found at index {header_row_idx}")
    
    # Identify metadata columns
    # We look for columns that contain "Type rapport", "Rapportjaar", "Boekjaar", "Niveau X"
    # Usually these are in the column headers row if it exists, OR in the data rows themselves
    
    # Let's inspect the first data row (header_row_idx + 1 or +2) to find structure
    # Based on debug output:
    # Row 0: ['Bestuur', nan, nan...]
    # Row 1: ['Type rapport', 'Rapportjaar', 'Boekjaar', 'Niveau 1', 'Niveau 2'...]
    
    # So headers for METADATA are in row 1 (index 1), headers for MUNICIPALITIES are in row 0 (index 0)
    # This is tricky because it's mixed.
    
    # Let's find the row that has "Type rapport", "Niveau 1", etc.
    meta_header_row_idx = None
    for i in range(20):
        row_vals = df.iloc[i].astype(str).tolist()
        if "Niveau 1" in row_vals or "Boekjaar" in row_vals:
            meta_header_row_idx = i
            break
            
    if meta_header_row_idx is None:
        raise ValueError("Could not find metadata header row in kostenpost file")
        
    print(f"  Metadata header row found at index {meta_header_row_idx}")
    
    # Map column indices to metadata fields
    col_map = {}
    meta_row = df.iloc[meta_header_row_idx]
    
    niveau_cols = []
    
    for idx, val in enumerate(meta_row):
        val_str = str(val).strip()
        if val_str == "Type rapport": col_map['type_rapport'] = idx
        elif val_str == "Rapportjaar": col_map['rapportjaar'] = idx
        elif val_str == "Boekjaar": col_map['boekjaar'] = idx
        elif val_str.startswith("Niveau "):
            # Extract level number
            try:
                level = int(val_str.replace("Niveau ", ""))
                col_map[f'niveau{level}'] = idx
                niveau_cols.append((level, idx))
            except ValueError:
                pass
                
    niveau_cols.sort() # Ensure updated order (1, 2, 3...)
    print(f"  Found {len(niveau_cols)} levels: {[c[0] for c in niveau_cols]}")
    
    # Find municipality columns
    # They are usually in the row BEFORE metadata header (e.g. "Bestuur" row) OR same row?
    # Based on debug: Row 0 has "Bestuur" and then NaNs until municipalities start?
    # BUT municipalities start from column 12 usually.
    
    # Valid municipality columns are those that are NOT metadata columns
    metadata_col_indices = set(col_map.values())
    
    # Look for municipality names in the "Bestuur" row (usually row 0)
    # OR if that is empty, look in the row where municipality names appear
    
    # Let's scan columns that are NOT metadata columns
    muni_row = df.iloc[0] # Usually row 0 has muni names
    
    municipalities = []
    for idx in range(len(df.columns)):
        if idx in metadata_col_indices:
            continue
            
        # Check value in row 0
        val = muni_row.iloc[idx]
        if pd.isna(val):
            continue
            
        clean_name = str(val).strip()
        
        # Skip Districts
        if clean_name.startswith('District '):
            continue
            
        # Clean naming
        if clean_name.startswith('Gemeente en OCMW '):
            clean_name = clean_name.replace('Gemeente en OCMW ', '')
            
        municipalities.append((idx, clean_name))
        
    print(f"  Found {len(municipalities)} municipality columns")
    
    # Process data rows
    records = []
    data_start_idx = meta_header_row_idx + 1
    
    for row_idx in range(data_start_idx, len(df)):
        row = df.iloc[row_idx]
        
        # Extract core metadata
        boekjaar = row.iloc[col_map.get('boekjaar')] if 'boekjaar' in col_map else None
        
        # Skip invalid rows
        if pd.isna(boekjaar) or boekjaar == '' or str(boekjaar).strip() == 'Total':
            continue
            
        try:
            year = int(boekjaar)
        except (ValueError, TypeError):
            continue
            
        # Check aggregation logic
        # We want the "most detailed" split (leaf nodes)
        # This means we should exclude rows where ANY level is "Total"
        # AND we should identify the deepest level populated
        
        is_aggregate = False
        deepest_level_val = None
        deepest_level_idx = 0
        
        # Extract all levels
        levels_values = {}
        
        for level, col_idx in niveau_cols:
            val = row.iloc[col_idx]
            if not pd.isna(val):
                val_str = str(val).strip()
                if val_str == 'Total':
                    is_aggregate = True
                    break
                levels_values[level] = val_str
                deepest_level_val = val_str
                deepest_level_idx = level
        
        if is_aggregate:
            continue
            
        if deepest_level_idx == 0:
            # No levels found?
            continue
            
        # This is a valid leaf row
        # Iterate over municipalities
        for col_idx, municipality in municipalities:
            value = row.iloc[col_idx]
            
            if pd.isna(value) or str(value).strip() == 'Total':
                continue
                
            try:
                value_float = float(value)
            except (ValueError, TypeError):
                continue
            
            # Use deepest level as category name
            category = deepest_level_val
            
            # Also keep Level 1 for high level grouping
            category_l1 = levels_values.get(1, "")
            
            records.append({
                'year': year,
                'municipality': municipality,
                'category': category,
                'category_l1': category_l1,
                'level_depth': deepest_level_idx,
                'value': value_float
            })

    return pd.DataFrame(records)


def validate_cross_consistency(bv_df: pd.DataFrame, kp_df: pd.DataFrame):
    """
    Validate coherence between Beleidsveld and Kostenpost totals.
    """
    print("\n--- Validating Data Consistency ---")
    
    # Filter for total metric only (assuming input dfs are raw extraction, not yet metric labeled)
    # BV data
    bv_sums = bv_df.groupby(['year', 'municipality'])['value'].sum().reset_index()
    bv_sums = bv_sums.rename(columns={'value': 'bv_total'})
    
    # KP data
    kp_sums = kp_df.groupby(['year', 'municipality'])['value'].sum().reset_index()
    kp_sums = kp_sums.rename(columns={'value': 'kp_total'})
    
    # Merge
    comparison = pd.merge(bv_sums, kp_sums, on=['year', 'municipality'], how='inner')
    
    comparison['diff'] = comparison['bv_total'] - comparison['kp_total']
    comparison['diff_pct'] = (comparison['diff'].abs() / comparison['bv_total'].replace(0, 1)) * 100
    
    # Check for significant discrepancies (> 1%)
    issues = comparison[comparison['diff_pct'] > 1.0]
    
    print(f"Compared {len(comparison)} municipality-years.")
    if len(issues) > 0:
        print(f"WARNING: Found {len(issues)} discrepancies > 1%!")
        print(issues.sort_values('diff_pct', ascending=False).head(10))
        
        # Check overall sum
        total_bv = comparison['bv_total'].sum()
        total_kp = comparison['kp_total'].sum()
        total_diff_pct = abs(total_bv - total_kp) / total_bv * 100
        print(f"Overall Total Difference: {total_diff_pct:.2f}%")
    else:
        print("SUCCESS: usage of Beleidsveld and Kostenpost data is consistent (< 1% difference).")


def process_data() -> None:
    """Main data processing function."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    print("Processing BV data files...")

    # Process BV files
    bv_totaal_df = process_bv_data(BV_TOTAAL_FILE)
    bv_totaal_df['metric'] = 'total'
    print(f"  BV totaal: {len(bv_totaal_df)} records")

    bv_per_inw_df = process_bv_data(BV_PER_INW_FILE)
    bv_per_inw_df['metric'] = 'per_capita'
    print(f"  BV per inwoner: {len(bv_per_inw_df)} records")

    print("\nProcessing kostenpost data files...")

    # Process kostenpost files
    kostenpost_totaal_df = process_kostenpost_data(KOSTENPOST_TOTAAL_FILE)
    kostenpost_totaal_df['metric'] = 'total'
    print(f"  Kostenpost totaal: {len(kostenpost_totaal_df)} records")

    kostenpost_per_inw_df = process_kostenpost_data(KOSTENPOST_PER_INW_FILE)
    kostenpost_per_inw_df['metric'] = 'per_capita'
    print(f"  Kostenpost per inwoner: {len(kostenpost_per_inw_df)} records")
    
    # ---------------------------------------------------------
    # VALIDATION
    # ---------------------------------------------------------
    validate_cross_consistency(bv_totaal_df, kostenpost_totaal_df)
    
    # Combine data
    bv_combined = pd.concat([bv_totaal_df, bv_per_inw_df], ignore_index=True)
    kostenpost_combined = pd.concat([kostenpost_totaal_df, kostenpost_per_inw_df], ignore_index=True)

    # Get unique domains for lookup
    domains = bv_combined[['domain_code', 'domain_name']].drop_duplicates().dropna()
    domains_list = domains.to_dict(orient='records')

    # Get unique subdomains for lookup
    subdomains = bv_combined[['subdomain_code', 'subdomain_name', 'domain_code']].drop_duplicates().dropna()
    subdomains_list = subdomains.to_dict(orient='records')
    
    # Get unique categories (Level 1 mostly for high level filters, but we use detailed for lists)
    # Using 'category_l1' for primary filter
    niveau1_list = sorted(kostenpost_combined['category_l1'].dropna().unique().tolist())

    # Find latest year in data
    bv_max_year = bv_combined['year'].max()
    kostenpost_max_year = kostenpost_combined['year'].max()
    max_year = max(bv_max_year, kostenpost_max_year)
    date_str = f"{max_year}-12-31"

    print(f"  BV data: years {bv_combined['year'].min()} - {bv_max_year}")
    print(f"  Kostenpost data: years {kostenpost_combined['year'].min()} - {kostenpost_max_year}")

    # Update MDX frontmatter
    update_mdx_frontmatter_date(CONTENT_FILE, date_str)

    # Write output files (CSV for full data)
    print("\nWriting output files...")

    bv_combined.to_csv(RESULTS_DIR / "investments_by_domain.csv", index=False)
    kostenpost_combined.to_csv(RESULTS_DIR / "investments_by_category.csv", index=False)

    # Aggregations for web
    print("Creating aggregated data for web...")

    # 1. BV Vlaanderen (Total + Per Capita)
    bv_total_vlaanderen = bv_combined[bv_combined['metric'] == 'total'].groupby(
        ['year', 'domain_code', 'domain_name', 'metric']
    ).agg({'value': 'sum'}).reset_index()

    # Recalculate Per Capita for Vlaanderen
    bv_wide = bv_combined.pivot_table(
        index=['year', 'municipality', 'domain_code', 'domain_name'],
        columns='metric',
        values='value'
    ).reset_index()
    
    bv_wide['population'] = 0.0
    mask = (bv_wide.get('per_capita', pd.Series(0)) > 0) & (bv_wide.get('total', pd.Series(0)) > 0)
    if 'total' in bv_wide and 'per_capita' in bv_wide:
        bv_wide.loc[mask, 'population'] = (bv_wide.loc[mask, 'total'] / bv_wide.loc[mask, 'per_capita'])
    
    vlaanderen_totals = bv_wide.groupby(['year', 'domain_code', 'domain_name']).agg({
        'total': 'sum',
        'population': 'sum'
    }).reset_index()
    
    vlaanderen_totals['per_capita'] = 0.0
    mask = vlaanderen_totals['population'] > 0
    vlaanderen_totals.loc[mask, 'per_capita'] = (
        vlaanderen_totals.loc[mask, 'total'] / vlaanderen_totals.loc[mask, 'population']
    )
    
    bv_per_capita_vl = vlaanderen_totals[['year', 'domain_code', 'domain_name', 'per_capita']].copy()
    bv_per_capita_vl = bv_per_capita_vl.rename(columns={'per_capita': 'value'})
    bv_per_capita_vl['metric'] = 'per_capita'
    
    bv_vlaanderen = pd.concat([bv_total_vlaanderen, bv_per_capita_vl], ignore_index=True)
    bv_vlaanderen.to_json(RESULTS_DIR / "investments_by_domain_vlaanderen.json", orient="records", force_ascii=False)

    # 2. Municipality Aggregates (Latest Year)
    bv_latest = bv_combined[bv_combined['year'] == bv_max_year].copy()
    
    bv_muni_domain = bv_latest.groupby(['municipality', 'domain_code', 'domain_name', 'metric']).agg({'value': 'sum'}).reset_index()
    bv_muni_total = bv_latest.groupby(['municipality', 'metric']).agg({'value': 'sum'}).reset_index()
    bv_muni_total['domain_code'] = 'ALL'
    bv_muni_total['domain_name'] = 'Alle domeinen'
    
    print("Adding NIS codes...")
    bv_muni_domain = add_nis_codes_to_dataframe(bv_muni_domain, 'municipality')
    bv_muni_total = add_nis_codes_to_dataframe(bv_muni_total, 'municipality')
    
    bv_muni_domain.to_json(RESULTS_DIR / "investments_by_municipality_domain.json", orient="records", force_ascii=False)
    bv_muni_total.to_json(RESULTS_DIR / "investments_by_municipality_total.json", orient="records", force_ascii=False)

    # 3. Top Domains (manually selected based on strategic importance and investment volume)
    # Domain codes:
    # '02': Mobiliteit en openbare werken (Mobility and Public Works)
    # '074': Onderwijs (Education)
    # '060': Sport, jeugd en recreatie (Sports, Youth, and Recreation)
    # '068': Cultuur (Culture)
    # '041': Groen, ruimtelijke ordening en milieu (Green Space, Spatial Planning, and Environment)
    top_domains = ['02', '074', '060', '068', '041']
    bv_muni_top = bv_combined[bv_combined['domain_code'].isin(top_domains)].copy()
    bv_muni_top.to_json(RESULTS_DIR / "investments_municipality_top_domains.json", orient="records", force_ascii=False)

    # 4. Domain Summary
    domain_summary = bv_combined[bv_combined['metric'] == 'total'].groupby('domain_name').agg({
        'value': ['sum', 'mean', 'count']
    }).reset_index()
    domain_summary.columns = ['domain_name', 'total_value', 'avg_value', 'count']
    domain_summary = domain_summary.sort_values('total_value', ascending=False)
    domain_summary.to_json(RESULTS_DIR / "domain_summary.json", orient="records", force_ascii=False)
    
    # 5. Kostenpost Data
    # Aggregate by Category L1 for basic charts
    kp_total_vl = kostenpost_combined[kostenpost_combined['metric'] == 'total'].groupby(
        ['year', 'category_l1', 'metric']
    ).agg({'value': 'sum'}).reset_index()
    
    # Per Capita Recalculation
    kp_wide = kostenpost_combined.groupby(['year', 'municipality', 'category_l1', 'metric'])['value'].sum().unstack().reset_index()
    
    kp_wide['population'] = 0.0
    mask = (kp_wide.get('per_capita', pd.Series(0)) > 0) & (kp_wide.get('total', pd.Series(0)) > 0)
    if 'total' in kp_wide and 'per_capita' in kp_wide:
        kp_wide.loc[mask, 'population'] = (kp_wide.loc[mask, 'total'] / kp_wide.loc[mask, 'per_capita'])
        
    kp_vl_totals = kp_wide.groupby(['year', 'category_l1']).agg({
        'total': 'sum',
        'population': 'sum'
    }).reset_index()
    
    kp_vl_totals['per_capita'] = 0.0
    mask = kp_vl_totals['population'] > 0
    kp_vl_totals.loc[mask, 'per_capita'] = (
        kp_vl_totals.loc[mask, 'total'] / kp_vl_totals.loc[mask, 'population']
    )
    
    kp_per_capita_vl = kp_vl_totals[['year', 'category_l1', 'per_capita']].copy()
    kp_per_capita_vl = kp_per_capita_vl.rename(columns={'per_capita': 'value'})
    kp_per_capita_vl['metric'] = 'per_capita'
    
    kp_vlaanderen = pd.concat([kp_total_vl, kp_per_capita_vl], ignore_index=True)
    kp_vlaanderen.to_json(RESULTS_DIR / "investments_by_category_vlaanderen.json", orient="records", force_ascii=False)

    # Kostenpost Municipality (Latest)
    kp_latest = kostenpost_combined[kostenpost_combined['year'] == kostenpost_max_year].copy()
    kp_muni = kp_latest.groupby(['municipality', 'category_l1', 'metric']).agg({'value': 'sum'}).reset_index()
    kp_muni = add_nis_codes_to_dataframe(kp_muni, 'municipality')
    kp_muni.to_json(RESULTS_DIR / "investments_by_municipality_category.json", orient="records", force_ascii=False)

    # Detailed Category Summary (using the most detailed categories)
    cat_summary = kostenpost_combined[kostenpost_combined['metric'] == 'total'].groupby('category').agg({
        'value': ['sum', 'mean', 'count']
    }).reset_index()
    cat_summary.columns = ['category', 'total_value', 'avg_value', 'count']
    cat_summary = cat_summary.sort_values('total_value', ascending=False)
    cat_summary.to_json(RESULTS_DIR / "category_summary.json", orient="records", force_ascii=False)

    # Lookups
    lookups = {
        'domains': domains_list,
        'subdomains': subdomains_list,
        'cost_categories_niveau1': niveau1_list,
        'years': sorted(bv_combined['year'].unique().tolist()),
    }
    (RESULTS_DIR / "lookups.json").write_text(json.dumps(lookups, ensure_ascii=False, indent=2), encoding="utf-8")

    # Metadata with explicit truncation detection
    total_municipalities = len(bv_combined['municipality'].unique())
    kostenpost_municipalities = len(kostenpost_combined['municipality'].unique())

    # Detect if kostenpost data is truncated (significantly fewer municipalities than BV data)
    is_kostenpost_truncated = kostenpost_municipalities < (total_municipalities * 0.5)

    metadata = {
        'latest_year': int(max_year),
        'latest_date': date_str,
        'bv_latest_year': int(bv_max_year),
        'kostenpost_latest_year': int(kostenpost_max_year),
        'total_municipalities': total_municipalities,
        'kostenpost_municipalities': kostenpost_municipalities,
        'bv_records': len(bv_combined),
        'kostenpost_records': len(kostenpost_combined),
        'is_kostenpost_truncated': is_kostenpost_truncated,
    }
    (RESULTS_DIR / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nProcessing complete!")
    print(f"  Latest year: {max_year}")
    print(f"  BV records: {len(bv_combined)}")
    print(f"  Kostenpost records: {len(kostenpost_combined)}")
    print(f"  Municipalities: {len(bv_combined['municipality'].unique())}")


if __name__ == "__main__":
    process_data()
