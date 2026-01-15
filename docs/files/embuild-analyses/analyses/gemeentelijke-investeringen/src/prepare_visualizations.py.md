path: embuild-analyses/analyses/gemeentelijke-investeringen/src/prepare_visualizations.py
---
# File: embuild-analyses/analyses/gemeentelijke-investeringen/src/prepare_visualizations.py

Prepare visualization-ready datasets and summary stats for the Gemeentelijke Investeringen analysis.

What it does:
- Transforms processed investment data into the structures expected by the frontend components (time series, per-domain aggregates, municipality-level values)
- Computes derived metrics such as per-capita investments, year-over-year changes, and rolling averages
- Writes `results/` JSON files and optional CSV exports for external analysis

Usage
------

```bash
python embuild-analyses/analyses/gemeentelijke-investeringen/src/prepare_visualizations.py
```

Notes
-----
- Run after the main `process_investments.py` step. The script centralises final transformations for charts and tables.
- Verify the output structure against `src/components/analyses/gemeentelijke-investeringen` when updating column names or metrics.
