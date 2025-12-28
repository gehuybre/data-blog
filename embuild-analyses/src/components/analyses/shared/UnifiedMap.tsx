"use client"

import { useEffect, useMemo, useState } from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { scaleQuantile } from "d3-scale"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  REGIONS,
  PROVINCES,
  RegionCode,
  ProvinceCode,
  MunicipalityCode,
  getProvinceForMunicipality,
  getRegionForMunicipality,
} from "@/lib/geo-utils"
import { MapLevelToggle, MapDisplayLevel } from "./MapLevelToggle"

type UnknownRecord = Record<string, any>

interface TooltipState {
  visible: boolean
  x: number
  y: number
  name: string
  label: string
  value: string
}

interface UnifiedMapProps<TData extends UnknownRecord = UnknownRecord> {
  data: TData[]
  metric?: string
  selectedRegion?: RegionCode
  selectedProvince?: ProvinceCode | null
  selectedMunicipality?: MunicipalityCode | null
  onSelectRegion?: (code: RegionCode) => void
  onSelectProvince?: (code: ProvinceCode) => void
  onSelectMunicipality?: (code: MunicipalityCode) => void
  getRegionCode?: (d: TData) => RegionCode | string | null | undefined
  getProvinceCode?: (d: TData) => ProvinceCode | string | null | undefined
  getMunicipalityCode?: (d: TData) => MunicipalityCode | string | number | null | undefined
  getMetricValue?: (d: TData, metric?: string) => number | null | undefined
  formatValue?: (value: number) => string
  tooltipLabel?: string
  /** Override automatic level detection */
  displayLevel?: MapDisplayLevel
  /** Allow user to toggle between levels */
  showLevelToggle?: boolean
}

const BASE_PATH = process.env.NODE_ENV === "production" ? "/data-blog" : ""

const MAP_URLS = {
  region: `${BASE_PATH}/maps/belgium_regions.json`,
  province: `${BASE_PATH}/maps/belgium_provinces.json`,
  municipality: `${BASE_PATH}/maps/belgium_municipalities.json`,
}

export function UnifiedMap<TData extends UnknownRecord = UnknownRecord>({
  data,
  metric,
  selectedRegion = "1000",
  selectedProvince = null,
  selectedMunicipality = null,
  onSelectRegion,
  onSelectProvince,
  onSelectMunicipality,
  getRegionCode,
  getProvinceCode,
  getMunicipalityCode,
  getMetricValue,
  formatValue,
  tooltipLabel,
  displayLevel: controlledLevel,
  showLevelToggle = true,
}: UnifiedMapProps<TData>) {
  // Auto-detect level based on selection
  const autoLevel: MapDisplayLevel = selectedMunicipality
    ? "municipality"
    : selectedProvince
      ? "province"
      : "region"

  const [userLevel, setUserLevel] = useState<MapDisplayLevel>(controlledLevel ?? autoLevel)
  const displayLevel = controlledLevel ?? userLevel

  const [geoData, setGeoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    name: "",
    label: "",
    value: "",
  })

  // Load appropriate map data based on display level
  useEffect(() => {
    setLoading(true)
    const url = MAP_URLS[displayLevel]

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch map data from ${url}`)
        return res.json()
      })
      .then((data) => {
        setGeoData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load map data", err)
        setLoading(false)
      })
  }, [displayLevel])

  // Data getters with defaults
  const regionCodeGetter = getRegionCode ?? ((d: any) => d?.r)
  const provinceCodeGetter = getProvinceCode ?? ((d: any) => d?.p)
  const municipalityCodeGetter = getMunicipalityCode ?? ((d: any) => d?.m)

  const metricGetter =
    getMetricValue ??
    ((d: any, m?: string) => {
      if (typeof d?.value === "number") return d.value
      if (m) return typeof d?.[m] === "number" ? d[m] : Number(d?.[m] ?? 0)
      return typeof d?.value === "number" ? d.value : Number(d?.value ?? 0)
    })

  // Build value maps for each level
  const valueByRegion = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of data ?? []) {
      const code = regionCodeGetter(row)
      if (!code) continue
      const v = metricGetter(row, metric)
      if (typeof v !== "number" || !Number.isFinite(v)) continue
      m.set(String(code), v)
    }
    return m
  }, [data, metric, regionCodeGetter, metricGetter])

  const valueByProvince = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of data ?? []) {
      const code = provinceCodeGetter(row)
      if (!code) continue
      const v = metricGetter(row, metric)
      if (typeof v !== "number" || !Number.isFinite(v)) continue
      m.set(String(code), v)
    }
    return m
  }, [data, metric, provinceCodeGetter, metricGetter])

  const valueByMunicipality = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of data ?? []) {
      const code = municipalityCodeGetter(row)
      if (!code) continue
      const v = metricGetter(row, metric)
      if (typeof v !== "number" || !Number.isFinite(v)) continue
      m.set(String(code), v)
    }
    return m
  }, [data, metric, municipalityCodeGetter, metricGetter])

  // Filter geographies based on selection
  const filteredGeo = useMemo(() => {
    if (!geoData?.features) return null

    // For region level, filter by selected region (or show all if Belgium selected)
    if (displayLevel === "region") {
      if (selectedRegion === "1000") return geoData
      return {
        ...geoData,
        features: geoData.features.filter(
          (f: any) => String(f?.properties?.code) === String(selectedRegion)
        ),
      }
    }

    // For province level, filter by selected region
    if (displayLevel === "province") {
      if (selectedRegion === "1000") return geoData
      return {
        ...geoData,
        features: geoData.features.filter((f: any) => {
          const provCode = String(f?.properties?.code)
          const prov = PROVINCES.find((p) => String(p.code) === provCode)
          return prov && String(prov.regionCode) === String(selectedRegion)
        }),
      }
    }

    // For municipality level, filter by selected province or region
    if (displayLevel === "municipality") {
      if (selectedRegion === "1000") return geoData

      return {
        ...geoData,
        features: geoData.features.filter((f: any) => {
          const raw = f?.properties?.code
          if (!raw) return false
          const munCode = Number.parseInt(String(raw), 10)
          if (!Number.isFinite(munCode)) return false

          if (selectedProvince) {
            const provCode = getProvinceForMunicipality(munCode)
            return String(provCode) === String(selectedProvince)
          }

          const regCode = getRegionForMunicipality(munCode)
          return String(regCode) === String(selectedRegion)
        }),
      }
    }

    return geoData
  }, [geoData, displayLevel, selectedRegion, selectedProvince])

  // Color scale based on current level values
  const colorScale = useMemo(() => {
    let values: number[] = []

    if (displayLevel === "region") {
      values = Array.from(valueByRegion.values())
    } else if (displayLevel === "province") {
      values = Array.from(valueByProvince.values())
    } else {
      values = Array.from(valueByMunicipality.values())
    }

    values = values.filter((v) => Number.isFinite(v))
    if (!values.length) return null

    return scaleQuantile<string>()
      .domain(values)
      .range(["#e6f2ff", "#b3d9ff", "#66b3ff", "#0077cc", "#004c99"])
  }, [displayLevel, valueByRegion, valueByProvince, valueByMunicipality])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[420px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!filteredGeo) {
    return (
      <div className="flex items-center justify-center h-[420px] text-sm text-muted-foreground">
        Kaartdata kon niet geladen worden.
      </div>
    )
  }

  const handleMouseMove = (
    e: React.MouseEvent,
    name: string,
    label: string,
    value: string
  ) => {
    const rect = (e.currentTarget as HTMLElement).closest(".relative")?.getBoundingClientRect()
    if (rect) {
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        name,
        label,
        value,
      })
    }
  }

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  const handleClick = (
    e: React.MouseEvent,
    name: string,
    label: string,
    value: string
  ) => {
    // Toggle tooltip on click (mobile support)
    const rect = (e.currentTarget as HTMLElement).closest(".relative")?.getBoundingClientRect()
    if (rect) {
      setTooltip((prev) => ({
        visible: !prev.visible || prev.name !== name,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        name,
        label,
        value,
      }))
    }
  }

  return (
    <div className="space-y-3">
      {showLevelToggle && (
        <div className="flex justify-center">
          <MapLevelToggle level={displayLevel} onLevelChange={setUserLevel} />
        </div>
      )}

      <div className="relative w-full h-[420px]">
        {tooltip.visible && (
          <div
            className="absolute z-10 pointer-events-none px-2 py-1 text-xs bg-popover text-popover-foreground border rounded shadow-md whitespace-nowrap"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-medium">{tooltip.name}</div>
            {tooltip.label && (
              <div className="text-muted-foreground">
                {tooltip.label}: {tooltip.value}
              </div>
            )}
          </div>
        )}

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [4.4, 50.6], scale: 6500 }}
          width={800}
          height={420}
          className="w-full h-full"
        >
          <Geographies geography={filteredGeo}>
            {({ geographies }) =>
              geographies.map((geo) => {
                let code: string
                let value: number | undefined
                let placeName: string
                let isActive = false
                let onClick: (() => void) | undefined

                if (displayLevel === "region") {
                  code = String(geo.properties?.code ?? "")
                  value = valueByRegion.get(code)
                  placeName =
                    REGIONS.find((r) => String(r.code) === code)?.name ??
                    geo.properties?.name ??
                    code
                  isActive = selectedRegion !== "1000" && String(selectedRegion) === code
                  onClick = onSelectRegion ? () => onSelectRegion(code as RegionCode) : undefined
                } else if (displayLevel === "province") {
                  code = String(geo.properties?.code ?? "")
                  value = valueByProvince.get(code)
                  placeName =
                    PROVINCES.find((p) => String(p.code) === code)?.name ??
                    geo.properties?.name ??
                    code
                  isActive = selectedProvince !== null && String(selectedProvince) === code
                  onClick = onSelectProvince
                    ? () => onSelectProvince(code as ProvinceCode)
                    : undefined
                } else {
                  // municipality
                  const rawCode = geo.properties?.code
                  const munCode = Number.parseInt(String(rawCode ?? ""), 10)
                  if (!Number.isFinite(munCode)) return null

                  code = String(munCode)
                  value = valueByMunicipality.get(code)
                  placeName = geo.properties?.LAU_NAME ?? code
                  isActive =
                    selectedMunicipality !== null && String(selectedMunicipality) === code
                  onClick = onSelectMunicipality
                    ? () => onSelectMunicipality(code as MunicipalityCode)
                    : undefined
                }

                const fill =
                  value === undefined || !colorScale ? "#f3f4f6" : colorScale(value) ?? "#f3f4f6"

                const formattedValue =
                  value === undefined || !Number.isFinite(value)
                    ? "Geen data"
                    : formatValue
                      ? formatValue(value)
                      : String(value)

                // Stroke width varies by level
                const strokeWidth = displayLevel === "municipality" ? 0.5 : 1

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={(e) => {
                      onClick?.()
                      handleClick(e, placeName, tooltipLabel ?? "", formattedValue)
                    }}
                    onMouseMove={(e) =>
                      handleMouseMove(e, placeName, tooltipLabel ?? "", formattedValue)
                    }
                    onMouseLeave={handleMouseLeave}
                    style={{
                      default: {
                        fill,
                        stroke: "#ffffff",
                        strokeWidth,
                        outline: "none",
                        cursor: onClick ? "pointer" : "default",
                      },
                      hover: {
                        fill: value === undefined || !colorScale ? "#e5e7eb" : fill,
                        stroke: "#ffffff",
                        strokeWidth,
                        outline: "none",
                      },
                      pressed: {
                        fill: fill,
                        stroke: "#ffffff",
                        strokeWidth,
                        outline: "none",
                      },
                    }}
                    className={cn(isActive ? "drop-shadow-sm" : "")}
                    aria-label={placeName}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
    </div>
  )
}
