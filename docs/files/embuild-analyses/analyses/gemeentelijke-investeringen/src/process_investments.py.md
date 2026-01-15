path: embuild-analyses/analyses/gemeentelijke-investeringen/src/process_investments.py
---
# File: embuild-analyses/analyses/gemeentelijke-investeringen/src/process_investments.py

Primary data processing script for the `gemeentelijke-investeringen` analysis.

What it does:
- Ingests raw investment datasets and maps expenditures to municipalities using NIS codes
- Cleans categories, aggregates totals per municipality/region and per year, and computes derived metrics
- Writes processed JSON/CSV files to `results/` that are used by visualization scripts and the frontend

Usage
------

```bash
python embuild-analyses/analyses/gemeentelijke-investeringen/src/process_investments.py
```

Notes
-----
- Ensure supporting reference data in `shared-data/` (e.g., NIS, NACE, provinces) is available.
- The script may include data-specific fixes and heuristics that are documented in inline comments; review these when updating input formats.
