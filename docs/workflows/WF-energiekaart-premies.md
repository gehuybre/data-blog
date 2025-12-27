---
kind: workflow
id: WF-energiekaart-premies
owner: gehuybre
status: active
trigger: Manual
inputs:
  - name: SOURCE_URL
    type: url
    required: true
    schema: PowerBI dashboard URL (https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen)
outputs:
  - name: premies-res-tijdreeks-algemeen__default__Algemene Totalen__pivottable__Matrix__Aantal.csv
    type: csv
    to: embuild-analyses/analyses/energiekaart-premies/results/
    schema: Aantal toegekende energiepremies per jaar
  - name: premies-res-tijdreeks-algemeen__default__Algemene Totalen__pivottable__Matrix__Totaal bedrag.csv
    type: csv
    to: embuild-analyses/analyses/energiekaart-premies/results/
    schema: Totaal bedrag uitgekeerde premies per jaar
  - name: metadata.json
    type: json
    to: embuild-analyses/analyses/energiekaart-premies/results/
    schema: Source URL, fetch timestamp, PowerBI metadata
entrypoints:
  - embuild-analyses/analyses/energiekaart-premies/src/download-data.mjs
files:
  - embuild-analyses/analyses/energiekaart-premies/src/download-data.mjs
  - embuild-analyses/analyses/energiekaart-premies/results/
  - embuild-analyses/analyses/energiekaart-premies/content.mdx
  - embuild-analyses/src/components/analyses/energiekaart-premies/EnergiepremiesDashboard.tsx
last_reviewed: 2024-12-27
---

# Energiekaart Premies Data Extraction

This workflow extracts data from the Energiekaart Vlaanderen PowerBI dashboard about energy subsidies (premies) for renewable energy systems (RES).

## Overview

The Energiekaart Vlaanderen dashboard provides insights into energy subsidies granted by the Flemish government for renewable energy installations and energy-saving measures. This workflow uses Playwright to scrape the PowerBI dashboard and export the underlying data tables as CSV files.

## Data Source

- **Provider**: Energiesparen Vlaanderen
- **URL**: https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen
- **Type**: PowerBI embedded dashboard
- **Update Frequency**: Regularly updated by provider

## Running the Data Extraction

### Prerequisites

1. Install Node.js dependencies (including Playwright):
   ```bash
   cd embuild-analyses
   npm install
   npx playwright install chromium
   ```

### Execute the Script

```bash
node embuild-analyses/analyses/energiekaart-premies/src/download-data.mjs
```

Or with environment variables:
```bash
DEBUG=1 \
SOURCE_URL="https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen" \
OUT_DIR="embuild-analyses/analyses/energiekaart-premies/results" \
node embuild-analyses/analyses/energiekaart-premies/src/download-data.mjs
```

## What it Does

1. Launches a headless Chromium browser using Playwright
2. Navigates to the PowerBI dashboard URL
3. Waits for the PowerBI embed to load
4. Extracts all available bookmarks and report pages
5. For each visual (table/matrix/pivottable):
   - Exports the data using PowerBI's `exportData()` API
   - Sanitizes the filename based on variant/page/visual metadata
   - Saves as CSV with proper headers
6. Writes a `metadata.json` file with:
   - Source URL
   - Fetch timestamp
   - List of exported files with SHA-256 checksums
   - PowerBI structure (bookmarks, variants, pages)

## Output Files

The script exports CSV files to `embuild-analyses/analyses/energiekaart-premies/results/`:

- **Aantal (Count)**: Number of granted subsidies per year
- **Totaal bedrag (Total Amount)**: Total amount in EUR per year
- **metadata.json**: Export metadata and file checksums

### CSV Format

Each CSV file contains:
- Column headers from the PowerBI visual
- Data rows with year, region, and metric values
- Standardized delimiter (comma)

## Dashboard Component

The extracted data is visualized in the blog post using:

- **Component**: `embuild-analyses/src/components/analyses/energiekaart-premies/EnergiepremiesDashboard.tsx`
- **Features**:
  - Line chart showing evolution of number of subsidies
  - Bar chart showing total amount paid out
  - Data tables for detailed view
  - CSV download buttons
  - Embed code generation

## Blog Post

- **Location**: `embuild-analyses/analyses/energiekaart-premies/content.mdx`
- **URL**: `/analyses/energiekaart-premies`
- **Slug**: `energiekaart-premies`

## Notes

- The PowerBI dashboard structure may change over time, requiring script updates
- Export timeout is set to 180 seconds (configurable via `TIMEOUT_MS` env var)
- The script automatically retries PowerBI API calls with exponential backoff
- Filenames are sanitized to remove special characters and limited to 140 characters
- If no data can be exported, diagnostics are written to help troubleshoot

## Troubleshooting

### No data exported

Check the `diagnostics.json` file in the results directory for details about what went wrong. Common issues:

- PowerBI iframe didn't load (network/timeout)
- Visual types changed (allowlist needs updating)
- Authentication required (not currently supported)

### Timeout errors

Increase the timeout:
```bash
TIMEOUT_MS=300000 node embuild-analyses/analyses/energiekaart-premies/src/download-data.mjs
```

### Debug mode

Enable verbose logging:
```bash
DEBUG=1 node embuild-analyses/analyses/energiekaart-premies/src/download-data.mjs
```
