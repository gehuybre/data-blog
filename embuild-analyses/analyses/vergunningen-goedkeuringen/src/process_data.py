import pandas as pd
import json
from pathlib import Path
import math

# Configuration
import os
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RESULTS_DIR = BASE_DIR / "results"
# Default input filename (kept for backwards compatibility)
DEFAULT_INPUT_FILE = DATA_DIR / "BV_opendata_251125_082807.txt"
# Allow override via environment variable INPUT_FILE_PATH or download via INPUT_URL/BV_DATA_URL
INPUT_FILE = Path(os.environ.get('INPUT_FILE_PATH', DEFAULT_INPUT_FILE))
INPUT_URL = os.environ.get('INPUT_URL') or os.environ.get('BV_DATA_URL')
OUTPUT_DATA_FILE = RESULTS_DIR / "data_quarterly.json"
OUTPUT_MUNICIPALITIES_FILE = RESULTS_DIR / "municipalities.json"

def process_data():
    # Choose input file: prioritize explicit environment override, then downloaded file, then default
    input_file = Path(os.environ.get('INPUT_FILE_PATH')) if os.environ.get('INPUT_FILE_PATH') else DEFAULT_INPUT_FILE

    # If INPUT_URL is provided, download into DATA_DIR and set input_file accordingly
    if INPUT_URL:
        try:
            import requests
            import zipfile
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            fname = os.environ.get('INPUT_FILENAME') or Path(INPUT_URL).name or 'BV_opendata_latest.txt'
            download_path = DATA_DIR / fname
            print(f"Downloading {INPUT_URL} -> {download_path}...")
            with requests.get(INPUT_URL, stream=True, timeout=120) as r:
                r.raise_for_status()
                with open(download_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)

            # If ZIP, try to extract the relevant file
            if str(download_path).lower().endswith('.zip'):
                print(f"Downloaded ZIP file {download_path}, extracting...")
                with zipfile.ZipFile(download_path, 'r') as z:
                    z.extractall(DATA_DIR)
                    # Prefer a file that contains 'BUILDING' or 'TF_BUILDING' and ends with .txt or .csv
                    candidates = [p for p in z.namelist() if p.lower().endswith(('.txt', '.csv'))]
                    preferred = None
                    for c in candidates:
                        if 'building' in c.lower() or 'tf_building' in c.lower():
                            preferred = c
                            break
                    if not preferred and candidates:
                        preferred = candidates[0]
                    if preferred:
                        extracted_path = DATA_DIR / Path(preferred).name
                        print(f"Using extracted file: {extracted_path}")
                        input_file = extracted_path
                    else:
                        print('No text/csv file found inside ZIP; falling back to downloaded ZIP file path')
                        input_file = download_path
            else:
                input_file = download_path
        except Exception as e:
            print('Download failed:', e)
            # fall back to environment-specified INPUT_FILE_PATH or default
    else:
        print('No INPUT_URL provided, using local file or INPUT_FILE_PATH override.')

    print(f"Reading {input_file}...")
    # Read the text file (assuming comma separated based on previous CSV check, or check delimiter)
    # The previous read_file of csv showed comma. Let's assume the txt is also comma or tab.
    # Usually these exports are CSVs.
    try:
        df = pd.read_csv(input_file, encoding='utf-8', sep='|', low_memory=False)
    except Exception:
        df = pd.read_csv(input_file, encoding='latin1', sep='|', low_memory=False)

    print("Filtering for municipalities (Level 5)...")
    # Filter for municipalities
    df_mun = df[df['CD_REFNIS_LEVEL'] == 5].copy()

    # Filter out yearly totals (Period 0)
    df_mun = df_mun[df_mun['CD_PERIOD'] != 0]

    # Calculate Quarter
    df_mun['Quarter'] = (df_mun['CD_PERIOD'] - 1) // 3 + 1

    # Select relevant columns
    # MS_BUILDING_RES_RENOVATION: Renovation
    # MS_BUILDING_RES_NEW: New Construction
    cols = ['CD_YEAR', 'Quarter', 'CD_REFNIS_MUNICIPALITY', 'REFNIS_NL', 'MS_BUILDING_RES_RENOVATION', 'MS_BUILDING_RES_NEW']
    df_subset = df_mun[cols]

    print("Aggregating by Quarter...")
    # Group by Year, Quarter, Municipality
    df_agg = df_subset.groupby(['CD_YEAR', 'Quarter', 'CD_REFNIS_MUNICIPALITY', 'REFNIS_NL']).sum().reset_index()

    # Prepare data for JSON export
    # We want a list of objects, but to save space, maybe a compact format?
    # Or just standard JSON.
    
    # Create municipalities list
    municipalities = df_agg[['CD_REFNIS_MUNICIPALITY', 'REFNIS_NL']].drop_duplicates().sort_values('REFNIS_NL')
    municipalities_list = municipalities.rename(columns={'CD_REFNIS_MUNICIPALITY': 'code', 'REFNIS_NL': 'name'}).to_dict(orient='records')

    # Create data list
    # Rename columns for compactness
    df_agg = df_agg.rename(columns={
        'CD_YEAR': 'y',
        'Quarter': 'q',
        'CD_REFNIS_MUNICIPALITY': 'm',
        'MS_BUILDING_RES_RENOVATION': 'ren',
        'MS_BUILDING_RES_NEW': 'new'
    })
    
    # Drop name from data to save space (lookup via municipalities list)
    df_export = df_agg[['y', 'q', 'm', 'ren', 'new']]
    
    data_list = df_export.to_dict(orient='records')

    print(f"Exporting to {OUTPUT_DATA_FILE}...")
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(OUTPUT_DATA_FILE, 'w') as f:
        json.dump(data_list, f)
        
    with open(OUTPUT_MUNICIPALITIES_FILE, 'w') as f:
        json.dump(municipalities_list, f)

    print("Done.")

if __name__ == "__main__":
    process_data()


