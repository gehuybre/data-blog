path: embuild-analyses/analyses/bouwprojecten-gemeenten/src/category_keywords.py
---
# File: embuild-analyses/analyses/bouwprojecten-gemeenten/src/category_keywords.py

Defines `CATEGORY_DEFINITIONS` used to classify projects into categories such as `wegenbouw`, `groen`, `zorg`, `riolering`, `cultuur`, `sport`, `scholenbouw`, `verlichting`, `ruimtelijke-ordening`, `gebouwen` and the fallback `overige`.

Key functions:
- `classify_project(ac_short, ac_long)` — returns a list of category IDs that matched the project text (keyword search, case-insensitive)
- `get_category_label(category_id)`, `get_category_emoji(category_id)` — helpers for display.

Notes:
- The classification is simple keyword-matching and may yield multiple categories per project; review the keywords list in `CATEGORY_DEFINITIONS` to tune precision/recall.
