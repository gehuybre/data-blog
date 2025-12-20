---
kind: file
path: requirements.txt
role: Configuration
workflows:
  - WF-project-setup
inputs: []
---

# requirements.txt

Lists Python dependencies for the project.

## Dependencies
- `pandas`: Data manipulation.
- `openpyxl`: Excel file reading (for NACE codes).
- `requests`: HTTP requests.
- `geopandas`: Geospatial data processing (for maps).

