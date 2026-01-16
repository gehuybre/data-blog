"use client"

import { MunicipalityMap } from "./MunicipalityMap"

export function MapWithCustomGeo<TData>({ data, getGeoCode, getValue, periods, municipalitiesGeo }: any) {
  // Example wrapper that accepts a GeoJSON object and passes it to MunicipalityMap
  // Usage: import historicalGeo from "/maps/belgium_municipalities_2000.json" as any
  // <MapWithCustomGeo data={data} getGeoCode={...} getValue={...} municipalitiesGeo={historicalGeo} />
  return (
    <MunicipalityMap
      data={data}
      getGeoCode={getGeoCode}
      getValue={getValue}
      periods={periods}
      showTimeSlider={!!periods?.length}
      municipalitiesGeoOverride={municipalitiesGeo}
      height={560}
    />
  )
}