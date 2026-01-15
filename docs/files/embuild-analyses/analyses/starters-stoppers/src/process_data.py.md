path: embuild-analyses/analyses/starters-stoppers/src/process_data.py
---
# File: embuild-analyses/analyses/starters-stoppers/src/process_data.py

Processes start/stop business data (company openings and closures) used in the Starters & Stoppers analysis.

What it does:
- Loads raw register datasets and aggregates counts of company starts and stops by sector and geography
- Produces time series and summary tables consumed by the dashboard

Usage
------

```bash
python embuild-analyses/analyses/starters-stoppers/src/process_data.py
```

Notes
-----
- Ensure input data files for the relevant years are placed in `analyses/starters-stoppers/data/`.
- Consider running validation checks after processing to ensure counts align with source publications.
