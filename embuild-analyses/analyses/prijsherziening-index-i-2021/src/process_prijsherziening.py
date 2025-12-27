"""
Process Price Revision Index I 2021 data from FOD Economie.

Data source: https://economie.fgov.be/sites/default/files/Files/Entreprises/prix-construction-Indice-I-2021.xlsx

Downloads the Excel file and processes monthly index data for the dashboard.
"""

import json
import os
from datetime import datetime
from pathlib import Path

import pandas as pd
import requests

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
RESULTS_DIR = SCRIPT_DIR.parent / "results"
DATA_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

# Data URL
DATA_URL = "https://economie.fgov.be/sites/default/files/Files/Entreprises/prix-construction-Indice-I-2021.xlsx"

# Component name simplification mapping
COMPONENT_NAMES = {
    "Diesel": "Diesel",
    "Bitumen": "Bitumen",
    "Staal": "Staal",
    "Cement": "Cement",
    "Hout": "Hout",
    "Lonen": "Lonen",
    "Index I": "Index I",
}


def download_data() -> str:
    """Download price revision index Excel from FOD Economie.

    Returns path to downloaded file.
    """
    input_url = os.environ.get("INPUT_URL", DATA_URL)
    print(f"Downloading from: {input_url}")

    response = requests.get(input_url, timeout=120)
    response.raise_for_status()

    # Save Excel file
    excel_path = DATA_DIR / "prix-construction-Indice-I-2021.xlsx"
    with open(excel_path, "wb") as f:
        f.write(response.content)

    print(f"Downloaded {len(response.content)} bytes to {excel_path}")
    return str(excel_path)


def simplify_component_name(name: str) -> str:
    """Simplify component names for display."""
    if not name or pd.isna(name):
        return name

    # Try exact match first
    if name in COMPONENT_NAMES:
        return COMPONENT_NAMES[name]

    # Try partial matches
    for key, value in COMPONENT_NAMES.items():
        if key.lower() in name.lower():
            return value

    return name


def process_data(excel_path: str) -> None:
    """Process price revision index data and save results."""

    # Read all sheets to find the data
    xl_file = pd.ExcelFile(excel_path)
    print(f"Excel sheets: {xl_file.sheet_names}")

    # Read the first sheet (assuming it contains the data)
    df = pd.read_excel(excel_path, sheet_name=0)
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")
    print(f"Columns: {df.columns.tolist()}")

    # The Excel structure typically has:
    # - First column: dates (month/year)
    # - Subsequent columns: different index components

    # Clean column names
    df.columns = df.columns.str.strip()

    # Find date column (usually first column or named something with 'date', 'maand', 'periode')
    date_col = df.columns[0]

    # Convert date column to datetime
    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=[date_col])

    # Extract year and month
    df['year'] = df[date_col].dt.year
    df['month'] = df[date_col].dt.month

    # Get component columns (all columns except date, year, month)
    component_cols = [col for col in df.columns if col not in [date_col, 'year', 'month']]

    # Process monthly indices
    monthly_data = []
    for _, row in df.iterrows():
        year = int(row['year'])
        month = int(row['month'])

        for component in component_cols:
            value = row[component]
            if pd.notna(value):
                try:
                    monthly_data.append({
                        'year': year,
                        'month': month,
                        'component': simplify_component_name(component),
                        'component_orig': component,
                        'value': float(value)
                    })
                except (ValueError, TypeError):
                    continue

    # Save monthly indices
    with open(RESULTS_DIR / "monthly_indices.json", "w") as f:
        json.dump(monthly_data, f, ensure_ascii=False, indent=2)

    # Create components list (unique components)
    components = sorted(set(item['component'] for item in monthly_data))
    components_data = [
        {
            'code': comp,
            'name': comp,
            'original': next(item['component_orig'] for item in monthly_data if item['component'] == comp)
        }
        for comp in components
    ]

    with open(RESULTS_DIR / "components.json", "w") as f:
        json.dump(components_data, f, ensure_ascii=False, indent=2)

    # Create CSV export
    df_export = pd.DataFrame(monthly_data)
    df_pivot = df_export.pivot_table(
        index=['year', 'month'],
        columns='component',
        values='value',
        aggfunc='first'
    ).reset_index()

    csv_path = RESULTS_DIR / "prijsherziening_data.csv"
    df_pivot.to_csv(csv_path, index=False)

    # Metadata
    latest_date = df[date_col].max()
    metadata = {
        'last_updated': datetime.now().isoformat(),
        'data_source': DATA_URL,
        'latest_data_date': latest_date.isoformat() if pd.notna(latest_date) else None,
        'total_records': len(monthly_data),
        'components': components,
        'date_range': {
            'min_year': int(df['year'].min()),
            'max_year': int(df['year'].max()),
            'min_month': int(df['month'].min()),
            'max_month': int(df['month'].max()),
        }
    }

    with open(RESULTS_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nProcessing complete!")
    print(f"Total monthly records: {len(monthly_data)}")
    print(f"Components: {components}")
    print(f"Latest data: {latest_date}")
    print(f"Output files saved to: {RESULTS_DIR}")


if __name__ == "__main__":
    excel_path = download_data()
    process_data(excel_path)
