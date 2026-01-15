path: embuild-analyses/analyses/vastgoed-verkopen/src/process_data.py
---
# File: embuild-analyses/analyses/vastgoed-verkopen/src/process_data.py

Processes property sales and transaction data used in the Vastgoed Verkopen analysis.

What it does:
- Parses raw property sales datasets, performs currency/price normalisation and cleans address/geo fields
- Joins transactions with municipality/province lookups and aggregates totals and median prices by area and period
- Writes `results/` JSON and CSV files consumed by charts and tables

Usage
------

```bash
python embuild-analyses/analyses/vastgoed-verkopen/src/process_data.py
```

Notes
-----
- Input data may be large; ensure sufficient disk/memory when processing full datasets.
- Check `shared-data/geo` for the expected municipality/province reference files.
