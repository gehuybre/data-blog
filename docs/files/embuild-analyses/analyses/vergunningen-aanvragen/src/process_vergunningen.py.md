path: embuild-analyses/analyses/vergunningen-aanvragen/src/process_vergunningen.py
---
# File: embuild-analyses/analyses/vergunningen-aanvragen/src/process_vergunningen.py

Processes building permit application data for the `vergunningen-aanvragen` analysis.

What it does:
- Parses raw permit application datasets, normalizes dates and permit types
- Aggregates counts by municipality/province and time period, and prepares datasets for maps and charts
- Produces `results/` JSON/CSV outputs used by embed components and the dashboard

Usage
------

```bash
python embuild-analyses/analyses/vergunningen-aanvragen/src/process_vergunningen.py
```

Notes
-----
- Input files may come from different providers with slightly different formats; the script contains mapping logic to handle these.
- Validate results with built-in checks or unit tests when updating parsing rules.
