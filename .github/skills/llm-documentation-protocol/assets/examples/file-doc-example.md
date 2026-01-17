---
kind: file
path: src/example/component.py
role: Example component
workflows: [WF-example]
inputs:
  - name: raw-input
    from: data/source.csv
    type: csv
    schema: docs/schemas/example.csv
    required: true
outputs:
  - name: processed
    to: results/example.json
    type: json
    schema: docs/schemas/example.json
interfaces: [create_component, update_component]
stability: experimental
owner: Unknown
safe_to_delete_when: "No longer used by WF-example and CI tests removed"
superseded_by: null
last_reviewed: YYYY-MM-DD
---

# File: src/example/component.py

## Role

Example component for demonstration purposes.

## Inputs
- `raw-input`: CSV input described by `docs/schemas/example.csv`.

## Outputs
- `processed`: JSON file written to `results/example.json`.
