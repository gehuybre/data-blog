"""
NIS code mapping utilities for gemeentelijke investeringen.

Maps municipality names from BBC-DR data to NIS codes.
"""

import pandas as pd
from pathlib import Path

# Path to shared NIS data
SHARED_DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "shared-data" / "nis"
REFNIS_FILE = SHARED_DATA_DIR / "refnis.csv"


def load_nis_mapping():
    """
    Load NIS code mapping from refnis.csv.

    Returns mapping of municipality names to NIS codes for currently active municipalities.
    """
    df = pd.read_csv(REFNIS_FILE, encoding='utf-8')

    # Filter for:
    # - Level 4 (municipalities)
    # - Currently active (end date 31/12/9999)
    # - In Flanders (codes starting with 1, 2, 3, 4, 7)
    municipalities = df[
        (df['LVL_REFNIS'] == 4) &
        (df['DT_VLDT_END'] == '31/12/9999') &
        (df['CD_REFNIS'].astype(str).str[0].isin(['1', '2', '3', '4', '7']))
    ].copy()

    # Create mapping: clean name -> NIS code
    # The names in refnis have format like "Aalst (Aalst)" so we extract the first part
    mapping = {}
    for _, row in municipalities.iterrows():
        name_nl = row['TX_REFNIS_NL']
        nis_code = str(row['CD_REFNIS'])

        # Extract clean name (before parentheses)
        clean_name = name_nl.split('(')[0].strip()

        mapping[clean_name] = nis_code

        # Also add full name with parentheses
        mapping[name_nl] = nis_code

    return mapping


def get_nis_code(municipality_name: str, mapping: dict = None) -> str | None:
    """
    Get NIS code for a municipality name.

    Args:
        municipality_name: Name of the municipality
        mapping: Pre-loaded mapping dict (optional, will load if not provided)

    Returns:
        NIS code as string, or None if not found
    """
    if mapping is None:
        mapping = load_nis_mapping()

    # Try exact match first
    if municipality_name in mapping:
        return mapping[municipality_name]

    # Try case-insensitive match
    lower_name = municipality_name.lower()
    for name, code in mapping.items():
        if name.lower() == lower_name:
            return code

    # Try partial match (without diacritics or special chars)
    import unicodedata

    def normalize(s):
        return ''.join(
            c for c in unicodedata.normalize('NFD', s)
            if unicodedata.category(c) != 'Mn'
        ).lower()

    norm_query = normalize(municipality_name)
    for name, code in mapping.items():
        if normalize(name) == norm_query:
            return code

    return None


def add_nis_codes_to_dataframe(df: pd.DataFrame, municipality_column: str = 'municipality') -> pd.DataFrame:
    """
    Add NIS codes to a dataframe with municipality names.

    Args:
        df: DataFrame with municipality names
        municipality_column: Name of the column containing municipality names

    Returns:
        DataFrame with added 'nis_code' column
    """
    mapping = load_nis_mapping()

    df = df.copy()

    # Filter out non-municipality entries BEFORE adding NIS codes
    invalid_names = ['Uitgave', 'Uitgave per inwoner', 'Total', 'Grondgebied']
    valid_mask = ~df[municipality_column].isin(invalid_names)

    # Initialize nis_code column
    df['nis_code'] = None

    # Only map valid municipalities
    df.loc[valid_mask, 'nis_code'] = df.loc[valid_mask, municipality_column].apply(
        lambda x: get_nis_code(x, mapping)
    )

    # Report unmapped municipalities (excluding invalid names)
    unmapped = df[valid_mask & df['nis_code'].isna()][municipality_column].unique()
    if len(unmapped) > 0:
        print(f"Warning: Could not map {len(unmapped)} municipalities to NIS codes:")
        for m in unmapped[:10]:  # Show first 10
            print(f"  - {m}")

    # Remove rows with invalid municipality names
    df = df[valid_mask].copy()

    return df


if __name__ == "__main__":
    # Test the mapping
    mapping = load_nis_mapping()
    print(f"Loaded {len(mapping)} municipality name->NIS mappings")

    # Test some common municipalities
    test_names = ['Aalst', 'Gent', 'Antwerpen', 'Brussel', 'Leuven']
    print("\nTest mappings:")
    for name in test_names:
        code = get_nis_code(name, mapping)
        print(f"  {name} -> {code}")
