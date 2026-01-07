---
kind: workflow
id: WF-gemeentelijke-investeringen
owner: Unknown
status: active
trigger: Manual
inputs:
  - name: BBC-DR Excel Files
    from: embuild-analyses/analyses/gemeentelijke-investeringen/data/
    type: file
    schema: Four Excel files with municipal investment data from Flemish Government BBC-DR system
    required: true
outputs:
  - name: Investment Results
    to: embuild-analyses/analyses/gemeentelijke-investeringen/results/
    type: json
    schema: Processed investment data aggregated by domain, category, municipality, and time
  - name: Metadata
    to: embuild-analyses/analyses/gemeentelijke-investeringen/results/metadata.json
    type: json
    schema: Data quality metrics and truncation flags
entrypoints:
  - embuild-analyses/analyses/gemeentelijke-investeringen/src/process_data.py
files:
  - embuild-analyses/analyses/gemeentelijke-investeringen/src/process_data.py
  - embuild-analyses/analyses/gemeentelijke-investeringen/src/nis_mapping.py
  - embuild-analyses/analyses/gemeentelijke-investeringen/data/meerjarenplan per bv totaal.xlsx
  - embuild-analyses/analyses/gemeentelijke-investeringen/data/meerjarenplan per bv per inw.xlsx
  - embuild-analyses/analyses/gemeentelijke-investeringen/data/meerjarenplan kostenpost totaal.xlsx
  - embuild-analyses/analyses/gemeentelijke-investeringen/data/meerjarenplan kostenpost per inwoner.xlsx
  - embuild-analyses/analyses/gemeentelijke-investeringen/results/
  - embuild-analyses/analyses/gemeentelijke-investeringen/content.mdx
last_reviewed: 2026-01-07
---

# WF: Gemeentelijke Investeringen Data Processing

## Purpose

Processes municipal investment data from the Flemish Government's BBC-DR (Beleids- en Beheerscyclus - Digitale Rapportering) system to generate interactive visualizations showing investment patterns across municipalities, policy domains (beleidsdomeinen), and cost categories (kostenposten).

The workflow transforms complex Excel exports into clean JSON datasets suitable for web visualization, enabling analysis of municipal investment priorities across Flanders.

## Trigger

Manual execution. The data is sourced from BI application exports from the BBC-DR system and must be manually downloaded and placed in the data directory before running the processor.

## Inputs

### Source Data Files
Four Excel files downloaded from the Agentschap Binnenlands Bestuur BI application:

1. **meerjarenplan per bv totaal.xlsx**: Total investments by policy domain (beleidsdomein/subdomein)
2. **meerjarenplan per bv per inw.xlsx**: Per capita investments by policy domain
3. **meerjarenplan kostenpost totaal.xlsx**: Total investments by cost category (kostenpost)
4. **meerjarenplan kostenpost per inwoner.xlsx**: Per capita investments by cost category

Each file contains multi-year planning data (meerjarenplan) spanning 2014-2033.

### Reference Data
- **shared-data/refnis.csv**: NIS code mappings for Belgian municipalities (used by nis_mapping.py)

## Outputs

### Aggregated Data Files (JSON)

**Time Series (Vlaanderen-level aggregates):**
- `investments_by_domain_vlaanderen.json`: Yearly totals by domain for all Flanders
- `investments_by_category_vlaanderen.json`: Yearly totals by cost category for all Flanders

**Municipality-level (Latest Year):**
- `investments_by_municipality_domain.json`: Investments per municipality per domain (with NIS codes)
- `investments_by_municipality_total.json`: Total investments per municipality (with NIS codes)
- `investments_by_municipality_category.json`: Investments per municipality per cost category (with NIS codes)

**Summary Statistics:**
- `domain_summary.json`: Aggregate statistics per domain (total, average, count)
- `category_summary.json`: Aggregate statistics per cost category
- `investments_municipality_top_domains.json`: Time series for top 5 strategic domains

**Lookup Tables:**
- `lookups.json`: Domain/subdomain codes and names, cost categories, available years

**Metadata:**
- `metadata.json`: Data quality metrics including:
  - Latest year available
  - Total municipalities covered
  - Record counts for BV and kostenpost data
  - **is_kostenpost_truncated**: Explicit flag indicating if kostenpost data is incomplete
  - **kostenpost_municipalities**: Count of municipalities with kostenpost data

### Full Data (CSV)
- `investments_by_domain.csv`: Complete raw domain data
- `investments_by_category.csv`: Complete raw category data

### Content Update
- `content.mdx`: Frontmatter date field automatically updated to match latest data year

## Steps (high level)

1. **Extract and Parse**: Read Excel files, identify metadata rows (years, domains, categories) and municipality columns
2. **Filter and Clean**: Remove aggregates ("Total"), OCMW duplicates, and invalid entries; parse domain/category codes
3. **NIS Code Mapping**: Match municipality names to NIS codes using fuzzy matching and normalization (handles diacritics, case variations)
4. **Validation**: Cross-check consistency between Beleidsveld and Kostenpost totals (warns if >1% discrepancy)
5. **Truncation Detection**: Calculate `is_kostenpost_truncated` flag based on municipality coverage ratio
6. **Aggregate**: Generate Vlaanderen-level time series by summing municipality data and recalculating per capita metrics
7. **Filter Latest**: Extract latest year data for map visualizations
8. **Write Outputs**: Serialize to JSON with proper formatting and update metadata

## Data Quality Notes

**Known Limitations:**
- Kostenpost data is frequently truncated to ~50 municipalities due to BI export limits
- The dashboard displays a warning alert when `is_kostenpost_truncated` is true
- BV (beleidsdomein) data is consistently complete for all 285+ municipalities

**Validation:**
- Cross-consistency check ensures Beleidsveld and Kostenpost totals align within 1% margin
- NIS mapping logs unmatched municipalities for manual review

## Files involved

- `embuild-analyses/analyses/gemeentelijke-investeringen/src/process_data.py`: Main processing script
- `embuild-analyses/analyses/gemeentelijke-investeringen/src/nis_mapping.py`: Municipality name → NIS code mapper with normalization
- Input Excel files (see Inputs section)
- Output JSON/CSV files (see Outputs section)
