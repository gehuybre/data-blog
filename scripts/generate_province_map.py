"""
Generate province-level GeoJSON from municipality-level data.
This script aggregates municipality geometries by province.
"""
import json
from pathlib import Path
from collections import defaultdict

# Province mapping (NIS code first 2 digits -> province info)
PROVINCE_MAPPING = {
    "10": {"code": "10000", "name": "Antwerpen", "nuts_id": "BE21"},
    "11": {"code": "10000", "name": "Antwerpen", "nuts_id": "BE21"},
    "12": {"code": "10000", "name": "Antwerpen", "nuts_id": "BE21"},
    "13": {"code": "10000", "name": "Antwerpen", "nuts_id": "BE21"},
    "20": {"code": "20001", "name": "Vlaams-Brabant", "nuts_id": "BE24"},
    "23": {"code": "20001", "name": "Vlaams-Brabant", "nuts_id": "BE24"},
    "24": {"code": "20001", "name": "Vlaams-Brabant", "nuts_id": "BE24"},
    "25": {"code": "25000", "name": "West-Vlaanderen", "nuts_id": "BE25"},
    "30": {"code": "30000", "name": "Oost-Vlaanderen", "nuts_id": "BE23"},
    "31": {"code": "30000", "name": "Oost-Vlaanderen", "nuts_id": "BE23"},
    "33": {"code": "30000", "name": "Oost-Vlaanderen", "nuts_id": "BE23"},
    "34": {"code": "30000", "name": "Oost-Vlaanderen", "nuts_id": "BE23"},
    "35": {"code": "30000", "name": "Oost-Vlaanderen", "nuts_id": "BE23"},
    "36": {"code": "30000", "name": "Oost-Vlaanderen", "nuts_id": "BE23"},
    "37": {"code": "30000", "name": "Oost-Vlaanderen", "nuts_id": "BE23"},
    "38": {"code": "30000", "name": "Oost-Vlaanderen", "nuts_id": "BE23"},
    "40": {"code": "40000", "name": "Limburg", "nuts_id": "BE22"},
    "41": {"code": "40000", "name": "Limburg", "nuts_id": "BE22"},
    "44": {"code": "40000", "name": "Limburg", "nuts_id": "BE22"},
    "45": {"code": "40000", "name": "Limburg", "nuts_id": "BE22"},
    "46": {"code": "40000", "name": "Limburg", "nuts_id": "BE22"},
    "50": {"code": "50000", "name": "Henegouwen", "nuts_id": "BE32"},
    "51": {"code": "50000", "name": "Henegouwen", "nuts_id": "BE32"},
    "52": {"code": "50000", "name": "Henegouwen", "nuts_id": "BE32"},
    "53": {"code": "50000", "name": "Henegouwen", "nuts_id": "BE32"},
    "54": {"code": "50000", "name": "Henegouwen", "nuts_id": "BE32"},
    "55": {"code": "50000", "name": "Henegouwen", "nuts_id": "BE32"},
    "56": {"code": "50000", "name": "Henegouwen", "nuts_id": "BE32"},
    "57": {"code": "50000", "name": "Henegouwen", "nuts_id": "BE32"},
    "60": {"code": "60000", "name": "Luik", "nuts_id": "BE33"},
    "61": {"code": "60000", "name": "Luik", "nuts_id": "BE33"},
    "62": {"code": "60000", "name": "Luik", "nuts_id": "BE33"},
    "63": {"code": "60000", "name": "Luik", "nuts_id": "BE33"},
    "64": {"code": "60000", "name": "Luik", "nuts_id": "BE33"},
    "70": {"code": "70000", "name": "Luxemburg", "nuts_id": "BE34"},
    "71": {"code": "70000", "name": "Luxemburg", "nuts_id": "BE34"},
    "72": {"code": "70000", "name": "Luxemburg", "nuts_id": "BE34"},
    "73": {"code": "70000", "name": "Luxemburg", "nuts_id": "BE34"},
    "80": {"code": "80000", "name": "Namen", "nuts_id": "BE35"},
    "81": {"code": "80000", "name": "Namen", "nuts_id": "BE35"},
    "82": {"code": "80000", "name": "Namen", "nuts_id": "BE35"},
    "83": {"code": "80000", "name": "Namen", "nuts_id": "BE35"},
    "84": {"code": "80000", "name": "Namen", "nuts_id": "BE35"},
    "85": {"code": "80000", "name": "Namen", "nuts_id": "BE35"},
    "90": {"code": "20002", "name": "Waals-Brabant", "nuts_id": "BE31"},
    "91": {"code": "20002", "name": "Waals-Brabant", "nuts_id": "BE31"},
    "92": {"code": "20002", "name": "Waals-Brabant", "nuts_id": "BE31"},
    "93": {"code": "20002", "name": "Waals-Brabant", "nuts_id": "BE31"},
    "21": {"code": "21000", "name": "Brussels Hoofdstedelijk Gewest", "nuts_id": "BE1"},
}


def get_province_for_municipality(nis_code: str) -> dict:
    """Get province info for a municipality NIS code."""
    prefix = nis_code[:2]
    return PROVINCE_MAPPING.get(prefix, {"code": "unknown", "name": "Unknown", "nuts_id": ""})


def dissolve_geometries(geometries):
    """
    Simple geometry dissolve - combines multiple polygons.
    For proper topology, you'd use shapely/geopandas, but this works for visualization.
    """
    # Group all coordinates
    all_coords = []
    for geom in geometries:
        if geom["type"] == "Polygon":
            all_coords.append(geom["coordinates"])
        elif geom["type"] == "MultiPolygon":
            all_coords.extend(geom["coordinates"])

    # If we have just one polygon, return Polygon, otherwise MultiPolygon
    if len(all_coords) == 1:
        return {"type": "Polygon", "coordinates": all_coords[0]}
    else:
        return {"type": "MultiPolygon", "coordinates": all_coords}


def main():
    # Paths
    project_root = Path(__file__).parent.parent
    input_file = project_root / "embuild-analyses" / "public" / "maps" / "belgium_municipalities.json"
    output_file = project_root / "embuild-analyses" / "public" / "maps" / "belgium_provinces.json"

    print(f"Reading municipalities from: {input_file}")

    # Read municipality data
    with open(input_file, "r", encoding="utf-8") as f:
        muni_data = json.load(f)

    # Group by province
    province_geoms = defaultdict(list)
    for feature in muni_data["features"]:
        nis_code = str(feature["properties"].get("code", ""))
        if not nis_code:
            continue

        province_info = get_province_for_municipality(nis_code)
        province_code = province_info["code"]

        if province_code != "unknown":
            province_geoms[province_code].append({
                "geometry": feature["geometry"],
                "info": province_info,
            })

    # Create province features
    features = []
    for province_code, geom_list in province_geoms.items():
        # Get province info from first item
        province_info = geom_list[0]["info"]

        # Dissolve all municipality geometries for this province
        geometries = [item["geometry"] for item in geom_list]
        dissolved = dissolve_geometries(geometries)

        feature = {
            "type": "Feature",
            "properties": {
                "code": province_code,
                "name": province_info["name"],
                "nuts_id": province_info["nuts_id"],
            },
            "geometry": dissolved,
        }
        features.append(feature)

    # Create output GeoJSON
    output_data = {
        "type": "FeatureCollection",
        "features": features,
    }

    # Write output
    print(f"Writing {len(features)} provinces to: {output_file}")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False)

    print("✓ Province map generated successfully!")
    print(f"\nProvinces created:")
    for feature in sorted(features, key=lambda x: x["properties"]["name"]):
        print(f"  - {feature['properties']['name']} ({feature['properties']['code']})")


if __name__ == "__main__":
    main()
