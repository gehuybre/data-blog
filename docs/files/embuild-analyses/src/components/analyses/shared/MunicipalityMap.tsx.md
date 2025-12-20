---
kind: file
path: embuild-analyses/src/components/analyses/shared/MunicipalityMap.tsx
role: UI Component
workflows:
  - WF-vergunningen-goedkeuringen
inputs:
  - name: data
    from: Props
    type: array
    schema: Data points
    required: true
  - name: metric
    from: Props
    type: string
    schema: string (key in data objects)
    required: true
  - name: municipalities
    from: Props
    type: array
    schema: Municipality list
    required: true
  - name: level
    from: Props
    type: string
    schema: 'region' | 'province' | 'municipality'
    required: false
  - name: selectedRegion
    from: Props
    type: string
    schema: Region code
    required: false
  - name: selectedProvince
    from: Props
    type: string
    schema: Province code
    required: false
  - name: selectedMunicipality
    from: Props
    type: string
    schema: Municipality code
    required: false
outputs:
  - name: JSX
    to: React Tree
    type: component
    schema: React Element
interfaces:
  - MunicipalityMap
stability: experimental
owner: Unknown
safe_to_delete_when: Map visualization is no longer needed
superseded_by: null
last_reviewed: 2025-12-14
---

# File: embuild-analyses/src/components/analyses/shared/MunicipalityMap.tsx

## Role
Renders an interactive choropleth map of Belgian municipalities.

## Why it exists
To visualize data distribution across municipalities geographically. It supports zooming and filtering based on the selected geographical scope.

## Used by workflows
- [WF-vergunningen-goedkeuringen](../../../../../workflows/WF-vergunningen-goedkeuringen.md)

## Inputs
Receives data, metric, municipality list, and current geographical filter state (level, region, province, municipality). Fetches GeoJSON map data from `/maps/belgium_municipalities.json`.

## Outputs
Renders a `react-simple-maps` component with zoom and pan capabilities, colored by the metric value.
It dynamically filters the GeoJSON features based on the selected geographical scope (Region, Province, Municipality) and auto-zooms to the bounding box of the filtered features.

## Interfaces
- `MunicipalityMap`: React functional component.

## Ownership and lifecycle
Experimental shared component.
