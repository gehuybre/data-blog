"""
Process building permit application data from Omgevingsloket Vlaanderen.

Data source: https://omgevingsloketrapportering.omgeving.vlaanderen.be/wonen
"""

import pandas as pd
import json
from pathlib import Path

# Paths
DATA_DIR = Path(__file__).parent.parent / "data"
RESULTS_DIR = Path(__file__).parent.parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

# Read CSV
df = pd.read_csv(
    DATA_DIR / "bouwen_of_verbouwen_van_woningen.csv",
    encoding="utf-8",
    decimal=",",
    thousands="."
)

# Rename columns for easier handling
df.columns = [
    "jaar",
    "besluit_type",
    "gebouw_functie",
    "handeling",
    "kwartaal",
    "aantal_projecten",
    "aantal_gebouwen",
    "aantal_gebouwen_info",
    "aantal_wooneenheden",
    "aantal_kamers",
    "woonoppervlakte_m2",
    "oppervlakte_kamerwoning_m2",
    "bovengronds_nuttig_m2",
    "bovengronds_grond_m2",
    "gesloopt_m2",
    "gesloopt_m3"
]

# Clean data
df["kwartaal_nr"] = df["kwartaal"].str.extract(r"Q(\d)").astype(int)
df["jaar"] = df["jaar"].astype(int)

# Replace "-" with meaningful labels
df["besluit_type"] = df["besluit_type"].replace("-", "Onbekend")
df["gebouw_functie"] = df["gebouw_functie"].replace("-", "Onbekend")
df["handeling"] = df["handeling"].replace("-", "Onbekend")

# Filter for residential building types only (exclude rows without gebouw functie info)
woningen_functies = [
    "eengezinswoning",
    "meergezinswoning",
    "kamerwoning",
    "eengezins- en kamerwoning",
    "meergezins- en kamerwoning",
    "eengezins- en meergezinswoning"
]
df_woningen = df[df["gebouw_functie"].isin(woningen_functies)].copy()

# ============================================================================
# AGGREGATE 1: Per kwartaal - totalen Vlaanderen
# ============================================================================

quarterly_totals = df_woningen.groupby(["jaar", "kwartaal_nr"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index()

quarterly_totals = quarterly_totals.sort_values(["jaar", "kwartaal_nr"])

# Convert to compact JSON format
quarterly_json = [
    {
        "y": int(row["jaar"]),
        "q": int(row["kwartaal_nr"]),
        "p": int(row["aantal_projecten"]),
        "g": int(row["aantal_gebouwen"]),
        "w": int(row["aantal_wooneenheden"]),
        "m2": round(row["woonoppervlakte_m2"], 0)
    }
    for _, row in quarterly_totals.iterrows()
]

with open(RESULTS_DIR / "quarterly_totals.json", "w") as f:
    json.dump(quarterly_json, f)

# ============================================================================
# AGGREGATE 2: Per handeling (Nieuwbouw/Verbouw) per kwartaal
# ============================================================================

handelingen = ["Nieuwbouw", "Verbouwen of hergebruik"]
df_handel = df_woningen[df_woningen["handeling"].isin(handelingen)].copy()

quarterly_by_handeling = df_handel.groupby(["jaar", "kwartaal_nr", "handeling"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index()

quarterly_by_handeling = quarterly_by_handeling.sort_values(["jaar", "kwartaal_nr", "handeling"])

handeling_json = [
    {
        "y": int(row["jaar"]),
        "q": int(row["kwartaal_nr"]),
        "h": "nieuwbouw" if row["handeling"] == "Nieuwbouw" else "verbouw",
        "p": int(row["aantal_projecten"]),
        "g": int(row["aantal_gebouwen"]),
        "w": int(row["aantal_wooneenheden"]),
        "m2": round(row["woonoppervlakte_m2"], 0)
    }
    for _, row in quarterly_by_handeling.iterrows()
]

with open(RESULTS_DIR / "quarterly_by_handeling.json", "w") as f:
    json.dump(handeling_json, f)

# ============================================================================
# AGGREGATE 3: Per gebouw type per kwartaal
# ============================================================================

# Simplify gebouw functie to eengezins/meergezins
def simplify_functie(f):
    if "meergezins" in f:
        return "meergezins"
    elif "eengezins" in f:
        return "eengezins"
    elif "kamerwoning" in f:
        return "kamer"
    return "overig"

df_woningen["functie_kort"] = df_woningen["gebouw_functie"].apply(simplify_functie)

quarterly_by_type = df_woningen.groupby(["jaar", "kwartaal_nr", "functie_kort"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index()

quarterly_by_type = quarterly_by_type.sort_values(["jaar", "kwartaal_nr", "functie_kort"])

type_json = [
    {
        "y": int(row["jaar"]),
        "q": int(row["kwartaal_nr"]),
        "t": row["functie_kort"],
        "p": int(row["aantal_projecten"]),
        "g": int(row["aantal_gebouwen"]),
        "w": int(row["aantal_wooneenheden"]),
        "m2": round(row["woonoppervlakte_m2"], 0)
    }
    for _, row in quarterly_by_type.iterrows()
]

with open(RESULTS_DIR / "quarterly_by_type.json", "w") as f:
    json.dump(type_json, f)

# ============================================================================
# AGGREGATE 4: Jaarlijkse totalen
# ============================================================================

yearly_totals = df_woningen.groupby(["jaar"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index()

yearly_totals = yearly_totals.sort_values("jaar")

yearly_json = [
    {
        "y": int(row["jaar"]),
        "p": int(row["aantal_projecten"]),
        "g": int(row["aantal_gebouwen"]),
        "w": int(row["aantal_wooneenheden"]),
        "m2": round(row["woonoppervlakte_m2"], 0)
    }
    for _, row in yearly_totals.iterrows()
]

with open(RESULTS_DIR / "yearly_totals.json", "w") as f:
    json.dump(yearly_json, f)

# ============================================================================
# AGGREGATE 5: Jaarlijks per handeling
# ============================================================================

yearly_by_handeling = df_handel.groupby(["jaar", "handeling"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index()

yearly_handeling_json = [
    {
        "y": int(row["jaar"]),
        "h": "nieuwbouw" if row["handeling"] == "Nieuwbouw" else "verbouw",
        "p": int(row["aantal_projecten"]),
        "g": int(row["aantal_gebouwen"]),
        "w": int(row["aantal_wooneenheden"]),
        "m2": round(row["woonoppervlakte_m2"], 0)
    }
    for _, row in yearly_by_handeling.iterrows()
]

with open(RESULTS_DIR / "yearly_by_handeling.json", "w") as f:
    json.dump(yearly_handeling_json, f)

# ============================================================================
# AGGREGATE 6: Jaarlijks per type
# ============================================================================

yearly_by_type = df_woningen.groupby(["jaar", "functie_kort"]).agg({
    "aantal_projecten": "sum",
    "aantal_gebouwen": "sum",
    "aantal_wooneenheden": "sum",
    "woonoppervlakte_m2": "sum"
}).reset_index()

yearly_type_json = [
    {
        "y": int(row["jaar"]),
        "t": row["functie_kort"],
        "p": int(row["aantal_projecten"]),
        "g": int(row["aantal_gebouwen"]),
        "w": int(row["aantal_wooneenheden"]),
        "m2": round(row["woonoppervlakte_m2"], 0)
    }
    for _, row in yearly_by_type.iterrows()
]

with open(RESULTS_DIR / "yearly_by_type.json", "w") as f:
    json.dump(yearly_type_json, f)

# ============================================================================
# LOOKUPS for UI
# ============================================================================

lookups = {
    "handelingen": [
        {"code": "nieuwbouw", "nl": "Nieuwbouw"},
        {"code": "verbouw", "nl": "Verbouwen of hergebruik"}
    ],
    "types": [
        {"code": "eengezins", "nl": "Eengezinswoning"},
        {"code": "meergezins", "nl": "Meergezinswoning"},
        {"code": "kamer", "nl": "Kamerwoning"}
    ],
    "metrics": [
        {"code": "p", "nl": "Aantal projecten"},
        {"code": "g", "nl": "Aantal gebouwen"},
        {"code": "w", "nl": "Aantal wooneenheden"},
        {"code": "m2", "nl": "Woonoppervlakte (m²)"}
    ]
}

with open(RESULTS_DIR / "lookups.json", "w") as f:
    json.dump(lookups, f, ensure_ascii=False, indent=2)

print("Processing complete!")
print(f"Data range: {df['jaar'].min()} Q1 - {df['jaar'].max()} Q{df['kwartaal_nr'].max()}")
print(f"Total rows: {len(df)}")
print(f"Residential rows: {len(df_woningen)}")
print(f"Output files saved to: {RESULTS_DIR}")
