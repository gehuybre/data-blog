
import csv
import json
import os
from collections import defaultdict

# Configuration
INPUT_FILE = "embuild-analyses/analyses/gebouwenpark/data/building_stock_open_data.txt"
OUTPUT_FILE = "embuild-analyses/analyses/gebouwenpark/results/stats_2025.json"

def process_data():
    print(f"Reading {INPUT_FILE}...")
    
    # Structure for results
    results = {
        "metadata": {
            "year_snapshot": 2025,
            "source": "Statbel Building Stock 2025"
        },
        "snapshot_2025": {
            "national": {"total": 0, "by_type": defaultdict(int)},
            "regions": {} # Key: Region Code, Value: {name, total, by_type}
        },
        "time_series": {
            "years": [],
            "national": {
                "total_buildings": [],
                "residential_buildings": [] 
            },
            "regions": {} # Key: Region Code -> {name, total_buildings: [], residential_buildings: []}
        },
        "available_stat_types": set()
    }

    # Residential codes or names to sum for "Woongebouwen" (proxy for homes if units not available)
    # CD_BUILDING_TYPE_NL: 
    # 'Huizen in gesloten bebouwing'
    # 'Huizen in halfopen bebouwing'
    # 'Huizen in open bebouwing, hoeven en kastelen'
    # 'Buildings en flatgebouwen met appartementen'
    # 'Handelshuizen' ? Maybe include trade houses as they are often mixed.
    # Let's inspect codes. Usually R1, R2, R3, R4.
    
    residential_codes = {'R1', 'R2', 'R3', 'R4', 'R5'} # Add R5 if Handelshuizen is R5? We will check.

    # Time series temporary storage: year -> level -> region -> {total, residential}
    ts_data = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: {"total": 0, "residential": 0})))
    region_names = {}

    try:
        with open(INPUT_FILE, 'r', encoding='latin-1') as f:
            # Detect delimiter
            line = f.readline()
            delimiter = '|' if '|' in line else ','
            f.seek(0)
            
            reader = csv.DictReader(f, delimiter=delimiter)
            
            for row in reader:
                results["available_stat_types"].add(row['CD_STAT_TYPE'] + ": " + row['CD_STAT_TYPE_NL'])
                
                # Only interested in "Aantal gebouwen" (T1) for now if that's all there is
                # If there are others, we might capture them.
                if row['CD_STAT_TYPE'] != 'T1':
                    continue

                year = int(row['CD_YEAR'])
                lvl = row['CD_REFNIS_LVL']
                value = int(row['MS_VALUE'])
                b_type_code = row['CD_BUILDING_TYPE']
                b_type_name = row['CD_BUILDING_TYPE_NL']
                
                is_residential = b_type_code in ['R1', 'R2', 'R3', 'R4'] # Exclude Handelshuizen? Or include? "Woongelegenheden" implies places to live.
                # Let's assume R1-R4 for "Residential Buildings".
                
                # Snapshot 2025
                if year == 2025:
                    if lvl == '1': # National
                        results['snapshot_2025']['national']['total'] += value
                        results['snapshot_2025']['national']['by_type'][b_type_name] += value
                    elif lvl == '2': # Region
                        reg_code = row['CD_REFNIS']
                        reg_name = row['CD_REFNIS_NL']
                        region_names[reg_code] = reg_name
                        
                        if reg_code not in results['snapshot_2025']['regions']:
                            results['snapshot_2025']['regions'][reg_code] = {
                                "name": reg_name,
                                "total": 0,
                                "by_type": defaultdict(int)
                            }
                        results['snapshot_2025']['regions'][reg_code]['total'] += value
                        results['snapshot_2025']['regions'][reg_code]['by_type'][b_type_name] += value

                # Time Series Data (All years)
                # Store by Year -> Level -> Code
                if lvl == '1': # National
                    ts_data[year]['national']['00000']['total'] += value
                    if is_residential:
                        ts_data[year]['national']['00000']['residential'] += value
                elif lvl == '2': # Regions
                    reg_code = row['CD_REFNIS']
                    reg_name = row['CD_REFNIS_NL']
                    region_names[reg_code] = reg_name
                    
                    ts_data[year]['regions'][reg_code]['total'] += value
                    if is_residential:
                        ts_data[year]['regions'][reg_code]['residential'] += value

    except Exception as e:
        print(f"Error processing data: {e}")
        return

    # Convert Snapshot defaultdicts
    results['snapshot_2025']['national']['by_type'] = dict(results['snapshot_2025']['national']['by_type'])
    for reg in results['snapshot_2025']['regions'].values():
        reg['by_type'] = dict(reg['by_type'])

    # Process Time Series structure
    sorted_years = sorted(ts_data.keys())
    results['time_series']['years'] = sorted_years
    
    # National TS
    for y in sorted_years:
        data = ts_data[y]['national']['00000']
        results['time_series']['national']['total_buildings'].append(data['total'])
        results['time_series']['national']['residential_buildings'].append(data['residential'])
    
    # Regional TS
    for reg_code, reg_name in region_names.items():
        results['time_series']['regions'][reg_code] = {
            "name": reg_name,
            "total_buildings": [],
            "residential_buildings": []
        }
        for y in sorted_years:
            val = ts_data[y]['regions'][reg_code] # defaultdict, returns 0s if missing
            results['time_series']['regions'][reg_code]['total_buildings'].append(val['total'])
            results['time_series']['regions'][reg_code]['residential_buildings'].append(val['residential'])

    results['available_stat_types'] = list(results['available_stat_types'])
    print("Stat Types Found:", results['available_stat_types'])

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"Done. Processed {len(sorted_years)} years. Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    process_data()
