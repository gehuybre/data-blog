"""
Process bankruptcy data from Statbel.

Data source: https://statbel.fgov.be/nl/themas/ondernemingen/faillissementen/maandelijkse-faillissementen

Downloads the most recent year's data and processes it for the dashboard.
Focuses on construction sector (NACE section F) but includes all sectors for comparison.
"""

import io
import json
import os
import zipfile
from datetime import datetime
from pathlib import Path

import pandas as pd
import requests

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
RESULTS_DIR = SCRIPT_DIR.parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

# Statbel URL pattern
BASE_URL = "https://statbel.fgov.be/sites/default/files/files/opendata/BRI_Nace"

# NACE sector mapping (section code -> Dutch name)
SECTOR_NAMES = {
    "A": "Landbouw, bosbouw en visserij",
    "B": "Winning van delfstoffen",
    "C": "Industrie",
    "D": "Productie en distributie van elektriciteit, gas, stoom",
    "E": "Distributie van water; afval- en afvalwaterbeheer",
    "F": "Bouwnijverheid",
    "G": "Groot- en detailhandel; reparatie van auto's",
    "H": "Vervoer en opslag",
    "I": "Verschaffen van accommodatie en maaltijden",
    "J": "Informatie en communicatie",
    "K": "Financiële activiteiten en verzekeringen",
    "L": "Exploitatie van en handel in onroerend goed",
    "M": "Vrije beroepen en wetenschappelijke activiteiten",
    "N": "Administratieve en ondersteunende diensten",
    "O": "Openbaar bestuur en defensie",
    "P": "Onderwijs",
    "Q": "Menselijke gezondheidszorg en maatschappelijke dienstverlening",
    "R": "Kunst, amusement en recreatie",
    "S": "Overige diensten",
    "T": "Huishoudens als werkgever",
    "U": "Extraterritoriale organisaties",
    "?": "Onbekend",
}

# Flemish province codes
FLEMISH_PROVINCES = {
    10000: "Antwerpen",
    20001: "Vlaams-Brabant",
    30000: "West-Vlaanderen",
    40000: "Oost-Vlaanderen",
    70000: "Limburg",
}


def download_data() -> pd.DataFrame:
    """Download bankruptcy data from Statbel.

    Tries current year first, then falls back to previous year.
    Returns DataFrame with all bankruptcy records.
    """
    input_url = os.environ.get("INPUT_URL")

    if input_url:
        # Use provided URL from environment
        print(f"Using INPUT_URL: {input_url}")
        urls_to_try = [input_url]
    else:
        # Try current year, then previous year
        current_year = datetime.now().year
        urls_to_try = [
            f"{BASE_URL}/TF_BANKRUPTCIES({current_year}).zip",
            f"{BASE_URL}/TF_BANKRUPTCIES({current_year - 1}).zip",
        ]

    for url in urls_to_try:
        print(f"Trying URL: {url}")
        try:
            response = requests.get(url, timeout=120)
            if response.status_code == 200:
                print(f"Successfully downloaded from: {url}")

                # Save zip to data directory for reference
                zip_filename = url.split("/")[-1]
                zip_path = DATA_DIR / zip_filename
                with open(zip_path, "wb") as f:
                    f.write(response.content)

                # Extract and read Excel
                with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
                    excel_name = [n for n in zf.namelist() if n.endswith(".xlsx")][0]
                    with zf.open(excel_name) as excel_file:
                        df = pd.read_excel(excel_file)
                        print(f"Loaded {len(df)} records from {excel_name}")
                        return df
        except Exception as e:
            print(f"Failed to download from {url}: {e}")
            continue

    raise RuntimeError("Could not download data from any URL")


def process_data(df: pd.DataFrame) -> None:
    """Process bankruptcy data and save aggregated results."""

    # Filter for Flanders only
    df_vl = df[df["TX_RGN_DESCR_NL"] == "Vlaams Gewest"].copy()
    print(f"Filtered to {len(df_vl)} Flemish records")

    # Clean up sector code
    df_vl["sector"] = df_vl["TX_NACE_REV2_SECTION"].fillna("?")

    # Get year range
    min_year = int(df_vl["CD_YEAR"].min())
    max_year = int(df_vl["CD_YEAR"].max())
    max_month = int(df_vl[df_vl["CD_YEAR"] == max_year]["CD_MONTH"].max())
    print(f"Data range: {min_year} - {max_year}/{max_month}")

    # =========================================================================
    # AGGREGATE 1: Monthly totals for ALL sectors
    # =========================================================================
    monthly_all = df_vl.groupby(["CD_YEAR", "CD_MONTH"]).agg({
        "MS_COUNTOF_BANKRUPTCIES": "sum",
        "MS_COUNTOF_WORKERS": "sum",
    }).reset_index()

    monthly_all_json = [
        {
            "y": int(row["CD_YEAR"]),
            "m": int(row["CD_MONTH"]),
            "n": int(row["MS_COUNTOF_BANKRUPTCIES"]),
            "w": int(row["MS_COUNTOF_WORKERS"]),
        }
        for _, row in monthly_all.iterrows()
    ]
    monthly_all_json.sort(key=lambda x: (x["y"], x["m"]))

    with open(RESULTS_DIR / "monthly_totals.json", "w") as f:
        json.dump(monthly_all_json, f)

    # =========================================================================
    # AGGREGATE 2: Monthly totals for CONSTRUCTION sector only
    # =========================================================================
    df_bouw = df_vl[df_vl["sector"] == "F"]

    monthly_bouw = df_bouw.groupby(["CD_YEAR", "CD_MONTH"]).agg({
        "MS_COUNTOF_BANKRUPTCIES": "sum",
        "MS_COUNTOF_WORKERS": "sum",
    }).reset_index()

    monthly_bouw_json = [
        {
            "y": int(row["CD_YEAR"]),
            "m": int(row["CD_MONTH"]),
            "n": int(row["MS_COUNTOF_BANKRUPTCIES"]),
            "w": int(row["MS_COUNTOF_WORKERS"]),
        }
        for _, row in monthly_bouw.iterrows()
    ]
    monthly_bouw_json.sort(key=lambda x: (x["y"], x["m"]))

    with open(RESULTS_DIR / "monthly_construction.json", "w") as f:
        json.dump(monthly_bouw_json, f)

    # =========================================================================
    # AGGREGATE 3: Yearly totals for ALL sectors
    # =========================================================================
    yearly_all = df_vl.groupby(["CD_YEAR"]).agg({
        "MS_COUNTOF_BANKRUPTCIES": "sum",
        "MS_COUNTOF_WORKERS": "sum",
    }).reset_index()

    yearly_all_json = [
        {
            "y": int(row["CD_YEAR"]),
            "n": int(row["MS_COUNTOF_BANKRUPTCIES"]),
            "w": int(row["MS_COUNTOF_WORKERS"]),
        }
        for _, row in yearly_all.iterrows()
    ]
    yearly_all_json.sort(key=lambda x: x["y"])

    with open(RESULTS_DIR / "yearly_totals.json", "w") as f:
        json.dump(yearly_all_json, f)

    # =========================================================================
    # AGGREGATE 4: Yearly totals for CONSTRUCTION sector only
    # =========================================================================
    yearly_bouw = df_bouw.groupby(["CD_YEAR"]).agg({
        "MS_COUNTOF_BANKRUPTCIES": "sum",
        "MS_COUNTOF_WORKERS": "sum",
    }).reset_index()

    yearly_bouw_json = [
        {
            "y": int(row["CD_YEAR"]),
            "n": int(row["MS_COUNTOF_BANKRUPTCIES"]),
            "w": int(row["MS_COUNTOF_WORKERS"]),
        }
        for _, row in yearly_bouw.iterrows()
    ]
    yearly_bouw_json.sort(key=lambda x: x["y"])

    with open(RESULTS_DIR / "yearly_construction.json", "w") as f:
        json.dump(yearly_bouw_json, f)

    # =========================================================================
    # AGGREGATE 5: Yearly by sector (for sector comparison)
    # =========================================================================
    yearly_by_sector = df_vl.groupby(["CD_YEAR", "sector"]).agg({
        "MS_COUNTOF_BANKRUPTCIES": "sum",
        "MS_COUNTOF_WORKERS": "sum",
    }).reset_index()

    yearly_sector_json = [
        {
            "y": int(row["CD_YEAR"]),
            "s": row["sector"],
            "n": int(row["MS_COUNTOF_BANKRUPTCIES"]),
            "w": int(row["MS_COUNTOF_WORKERS"]),
        }
        for _, row in yearly_by_sector.iterrows()
    ]
    yearly_sector_json.sort(key=lambda x: (x["y"], x["s"]))

    with open(RESULTS_DIR / "yearly_by_sector.json", "w") as f:
        json.dump(yearly_sector_json, f)

    # =========================================================================
    # AGGREGATE 6: Monthly by sector (for sector comparison charts)
    # =========================================================================
    monthly_by_sector = df_vl.groupby(["CD_YEAR", "CD_MONTH", "sector"]).agg({
        "MS_COUNTOF_BANKRUPTCIES": "sum",
        "MS_COUNTOF_WORKERS": "sum",
    }).reset_index()

    monthly_sector_json = [
        {
            "y": int(row["CD_YEAR"]),
            "m": int(row["CD_MONTH"]),
            "s": row["sector"],
            "n": int(row["MS_COUNTOF_BANKRUPTCIES"]),
            "w": int(row["MS_COUNTOF_WORKERS"]),
        }
        for _, row in monthly_by_sector.iterrows()
    ]
    monthly_sector_json.sort(key=lambda x: (x["y"], x["m"], x["s"]))

    with open(RESULTS_DIR / "monthly_by_sector.json", "w") as f:
        json.dump(monthly_sector_json, f)

    # =========================================================================
    # AGGREGATE 7: By province (Flemish provinces only, construction sector)
    # =========================================================================
    df_bouw_prov = df_bouw[df_bouw["CD_PROV_REFNIS"].notna()].copy()
    df_bouw_prov["CD_PROV_REFNIS"] = df_bouw_prov["CD_PROV_REFNIS"].astype(int)

    provinces_yearly = df_bouw_prov.groupby(["CD_YEAR", "CD_PROV_REFNIS"]).agg({
        "MS_COUNTOF_BANKRUPTCIES": "sum",
        "MS_COUNTOF_WORKERS": "sum",
    }).reset_index()

    provinces_json = [
        {
            "y": int(row["CD_YEAR"]),
            "p": str(int(row["CD_PROV_REFNIS"])),
            "n": int(row["MS_COUNTOF_BANKRUPTCIES"]),
            "w": int(row["MS_COUNTOF_WORKERS"]),
        }
        for _, row in provinces_yearly.iterrows()
        if int(row["CD_PROV_REFNIS"]) in FLEMISH_PROVINCES
    ]
    provinces_json.sort(key=lambda x: (x["y"], x["p"]))

    with open(RESULTS_DIR / "provinces_construction.json", "w") as f:
        json.dump(provinces_json, f)

    # =========================================================================
    # AGGREGATE 8: By province (all sectors)
    # =========================================================================
    df_vl_prov = df_vl[df_vl["CD_PROV_REFNIS"].notna()].copy()
    df_vl_prov["CD_PROV_REFNIS"] = df_vl_prov["CD_PROV_REFNIS"].astype(int)

    provinces_all_yearly = df_vl_prov.groupby(["CD_YEAR", "CD_PROV_REFNIS"]).agg({
        "MS_COUNTOF_BANKRUPTCIES": "sum",
        "MS_COUNTOF_WORKERS": "sum",
    }).reset_index()

    provinces_all_json = [
        {
            "y": int(row["CD_YEAR"]),
            "p": str(int(row["CD_PROV_REFNIS"])),
            "n": int(row["MS_COUNTOF_BANKRUPTCIES"]),
            "w": int(row["MS_COUNTOF_WORKERS"]),
        }
        for _, row in provinces_all_yearly.iterrows()
        if int(row["CD_PROV_REFNIS"]) in FLEMISH_PROVINCES
    ]
    provinces_all_json.sort(key=lambda x: (x["y"], x["p"]))

    with open(RESULTS_DIR / "provinces.json", "w") as f:
        json.dump(provinces_all_json, f)

    # =========================================================================
    # AGGREGATE 9: Monthly by province (construction sector)
    # =========================================================================
    monthly_prov_bouw = df_bouw_prov.groupby(["CD_YEAR", "CD_MONTH", "CD_PROV_REFNIS"]).agg({
        "MS_COUNTOF_BANKRUPTCIES": "sum",
        "MS_COUNTOF_WORKERS": "sum",
    }).reset_index()

    monthly_prov_bouw_json = [
        {
            "y": int(row["CD_YEAR"]),
            "m": int(row["CD_MONTH"]),
            "p": str(int(row["CD_PROV_REFNIS"])),
            "n": int(row["MS_COUNTOF_BANKRUPTCIES"]),
            "w": int(row["MS_COUNTOF_WORKERS"]),
        }
        for _, row in monthly_prov_bouw.iterrows()
        if int(row["CD_PROV_REFNIS"]) in FLEMISH_PROVINCES
    ]
    monthly_prov_bouw_json.sort(key=lambda x: (x["y"], x["m"], x["p"]))

    with open(RESULTS_DIR / "monthly_provinces_construction.json", "w") as f:
        json.dump(monthly_prov_bouw_json, f)

    # =========================================================================
    # AGGREGATE 10: Monthly by province (all sectors)
    # =========================================================================
    monthly_prov_all = df_vl_prov.groupby(["CD_YEAR", "CD_MONTH", "CD_PROV_REFNIS"]).agg({
        "MS_COUNTOF_BANKRUPTCIES": "sum",
        "MS_COUNTOF_WORKERS": "sum",
    }).reset_index()

    monthly_prov_all_json = [
        {
            "y": int(row["CD_YEAR"]),
            "m": int(row["CD_MONTH"]),
            "p": str(int(row["CD_PROV_REFNIS"])),
            "n": int(row["MS_COUNTOF_BANKRUPTCIES"]),
            "w": int(row["MS_COUNTOF_WORKERS"]),
        }
        for _, row in monthly_prov_all.iterrows()
        if int(row["CD_PROV_REFNIS"]) in FLEMISH_PROVINCES
    ]
    monthly_prov_all_json.sort(key=lambda x: (x["y"], x["m"], x["p"]))

    with open(RESULTS_DIR / "monthly_provinces.json", "w") as f:
        json.dump(monthly_prov_all_json, f)

    # =========================================================================
    # LOOKUPS for UI
    # =========================================================================
    # Get all sectors that appear in the data
    sectors_in_data = sorted(df_vl["sector"].unique())
    sectors_lookup = [
        {"code": s, "nl": SECTOR_NAMES.get(s, s)}
        for s in sectors_in_data
        if s in SECTOR_NAMES
    ]

    provinces_lookup = [
        {"code": str(code), "name": name}
        for code, name in sorted(FLEMISH_PROVINCES.items(), key=lambda x: x[1])
    ]

    lookups = {
        "sectors": sectors_lookup,
        "provinces": provinces_lookup,
        "years": list(range(min_year, max_year + 1)),
        "construction_sector": "F",
    }

    with open(RESULTS_DIR / "lookups.json", "w") as f:
        json.dump(lookups, f, ensure_ascii=False, indent=2)

    # =========================================================================
    # METADATA
    # =========================================================================
    metadata = {
        "min_year": min_year,
        "max_year": max_year,
        "max_month": max_month,
        "last_updated": datetime.now().isoformat(),
        "total_records": len(df_vl),
        "construction_records": len(df_bouw),
        "source_url": "https://statbel.fgov.be/nl/themas/ondernemingen/faillissementen",
    }

    with open(RESULTS_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nProcessing complete!")
    print(f"Data range: {min_year} - {max_year}/{max_month}")
    print(f"Total Flemish records: {len(df_vl)}")
    print(f"Construction sector records: {len(df_bouw)}")
    print(f"Output files saved to: {RESULTS_DIR}")


if __name__ == "__main__":
    df = download_data()
    process_data(df)
