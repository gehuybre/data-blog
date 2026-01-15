path: embuild-analyses/analyses/huishoudensgroei/src/process_data.py
---
# File: embuild-analyses/analyses/huishoudensgroei/src/process_data.py

Processing household growth (`huishoudensgroei`) data and producing results for the analysis.

What it does:
- Loads population and household datasets (statistical sources) and computes household growth metrics per municipality and region
- Produces time series used by the frontend and CSV extracts for downstream validation

Usage
------

```bash
python embuild-analyses/analyses/huishoudensgroei/src/process_data.py
```

Notes
-----
- Ensure required raw data files are present in `analyses/huishoudensgroei/data/` before running.
- The script performs data cleaning and may include domain-specific corrections documented in comments.
