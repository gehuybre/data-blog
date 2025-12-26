"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { scaleQuantile } from "d3-scale"
import { geoBounds } from "d3-geo"
import { Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  REGIONS,
  PROVINCES,
  RegionCode,
  ProvinceCode,
  getProvinceForMunicipality,
  getRegionForMunicipality,
} from "@/lib/geo-utils"
import { TimeSlider } from "./TimeSlider"
import { MapLegend, NoDataIndicator } from "./MapLegend"
import { MapControls } from "./MapControls"

// Types
type UnknownRecord = Record<string, unknown>

interface TooltipState {
  visible: boolean
  x: number
  y: number
  name: string
  value: number | null
  formattedValue: string
  previousValue: number | null
  changePercent: number | null
  period: string
}

type MapLevel = "region" | "province" | "municipality"
type ColorScheme = "blue" | "orange" | "green"

interface InteractiveMapProps<TData extends UnknownRecord = UnknownRecord> {
  /** Data array containing geographic values across periods */
  data: TData[]

  /** Geographic level to display */
  level: MapLevel

  /** Accessor for geographic code (region/province/municipality code) */
  getGeoCode?: (d: TData) => string | number | null | undefined

  /** Accessor for metric value */
  getValue?: (d: TData) => number | null | undefined

  /** Accessor for period (year, quarter, etc.) */
  getPeriod?: (d: TData) => number | string

  /** Available periods for time slider */
  periods?: (number | string)[]

  /** Initial period to display */
  initialPeriod?: number | string

  /** Show time slider */
  showTimeSlider?: boolean

  /** Selected geographic entity */
  selectedGeo?: string | null

  /** Callback when geographic entity is selected */
  onGeoSelect?: (code: string | null) => void

  /** Format function for values */
  formatValue?: (value: number) => string

  /** Label for tooltips */
  tooltipLabel?: string

  /** Map height in pixels */
  height?: number

  /** Color scheme */
  colorScheme?: ColorScheme

  /** Optional filter for region (when level is province) */
  regionFilter?: RegionCode

  /** Optional class name */
  className?: string
}

// GeoJSON URLs
const REGIONS_GEO_URL =
  (process.env.NODE_ENV === "production" ? "/data-blog" : "") + "/maps/belgium_regions.json"
const MUNICIPALITIES_GEO_URL =
  (process.env.NODE_ENV === "production" ? "/data-blog" : "") + "/maps/belgium_municipalities.json"

// Color schemes
const COLOR_SCHEMES: Record<ColorScheme, string[]> = {
  blue: ["#e6f2ff", "#b3d9ff", "#66b3ff", "#0077cc", "#004c99"],
  orange: ["#fff5eb", "#fed7aa", "#fdba74", "#f97316", "#c2410c"],
  green: ["#ecfdf5", "#a7f3d0", "#6ee7b7", "#10b981", "#065f46"],
}

// Default formatters
const defaultFormatValue = (n: number) =>
  new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)

export function InteractiveMap<TData extends UnknownRecord = UnknownRecord>({
  data,
  level,
  getGeoCode,
  getValue,
  getPeriod,
  periods = [],
  initialPeriod,
  showTimeSlider = false,
  selectedGeo = null,
  onGeoSelect,
  formatValue = defaultFormatValue,
  tooltipLabel = "Waarde",
  height = 450,
  colorScheme = "blue",
  regionFilter,
  className,
}: InteractiveMapProps<TData>) {
  // GeoJSON state
  const [geoData, setGeoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Zoom/pan state
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([4.4, 50.5])

  // Time state
  const [currentPeriod, setCurrentPeriod] = useState<number | string>(
    initialPeriod ?? periods[periods.length - 1] ?? ""
  )
  const [isPlaying, setIsPlaying] = useState(false)

  // Tooltip state
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    name: "",
    value: null,
    formattedValue: "",
    previousValue: null,
    changePercent: null,
    period: "",
  })

  // Determine which GeoJSON to load
  const geoUrl = level === "region" ? REGIONS_GEO_URL : MUNICIPALITIES_GEO_URL

  // Load GeoJSON
  useEffect(() => {
    setLoading(true)
    fetch(geoUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch map data")
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
  }, [geoUrl])

  // Accessors with defaults
  const geoCodeGetter = useCallback(
    (d: TData) => {
      if (getGeoCode) return getGeoCode(d)
      // Default accessors based on level
      if (level === "region") return (d as any)?.r
      if (level === "province") return (d as any)?.p
      return (d as any)?.m
    },
    [getGeoCode, level]
  )

  const valueGetter = useCallback(
    (d: TData) => {
      if (getValue) return getValue(d)
      return (d as any)?.value ?? (d as any)?.n
    },
    [getValue]
  )

  const periodGetter = useCallback(
    (d: TData) => {
      if (getPeriod) return getPeriod(d)
      return (d as any)?.y ?? (d as any)?.period
    },
    [getPeriod]
  )

  // Get previous period for trend calculation
  const previousPeriod = useMemo(() => {
    if (!periods.length || !currentPeriod) return null
    const idx = periods.indexOf(currentPeriod)
    if (idx <= 0) return null
    return periods[idx - 1]
  }, [periods, currentPeriod])

  // Current period data
  const currentPeriodData = useMemo(() => {
    if (!currentPeriod) return data
    return data.filter((d) => periodGetter(d) === currentPeriod)
  }, [data, currentPeriod, periodGetter])

  // Previous period data for trend
  const previousPeriodData = useMemo(() => {
    if (!previousPeriod) return []
    return data.filter((d) => periodGetter(d) === previousPeriod)
  }, [data, previousPeriod, periodGetter])

  // Value maps
  const valueByGeoCode = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of currentPeriodData) {
      const code = geoCodeGetter(row)
      if (code === null || code === undefined) continue
      const v = valueGetter(row)
      if (typeof v !== "number" || !Number.isFinite(v)) continue
      m.set(String(code), v)
    }
    return m
  }, [currentPeriodData, geoCodeGetter, valueGetter])

  const previousValueByGeoCode = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of previousPeriodData) {
      const code = geoCodeGetter(row)
      if (code === null || code === undefined) continue
      const v = valueGetter(row)
      if (typeof v !== "number" || !Number.isFinite(v)) continue
      m.set(String(code), v)
    }
    return m
  }, [previousPeriodData, geoCodeGetter, valueGetter])

  // Province aggregation (when level is province but data is municipality-based)
  const provinceValueByCode = useMemo(() => {
    if (level !== "province") return new Map<string, number>()

    // Check if data already has province codes
    const firstRow = currentPeriodData[0]
    if (firstRow && (firstRow as any)?.p !== undefined) {
      // Data is already at province level
      return valueByGeoCode
    }

    // Aggregate from municipalities
    const m = new Map<string, number>()
    for (const row of currentPeriodData) {
      const code = geoCodeGetter(row)
      if (code === null || code === undefined) continue
      const mCode = typeof code === "string" ? parseInt(code, 10) : Number(code)
      if (!Number.isFinite(mCode)) continue
      const pCode = String(getProvinceForMunicipality(mCode))
      const v = valueGetter(row)
      if (typeof v !== "number" || !Number.isFinite(v)) continue
      m.set(pCode, (m.get(pCode) ?? 0) + v)
    }
    return m
  }, [level, currentPeriodData, geoCodeGetter, valueGetter, valueByGeoCode])

  // Effective value map based on level
  const effectiveValueMap = useMemo(() => {
    if (level === "province" && provinceValueByCode.size > 0) {
      return provinceValueByCode
    }
    return valueByGeoCode
  }, [level, provinceValueByCode, valueByGeoCode])

  // Color scale
  const colorScale = useMemo(() => {
    const values = Array.from(effectiveValueMap.values()).filter(
      (v) => Number.isFinite(v) && v > 0
    )
    if (!values.length) return null
    return scaleQuantile<string>().domain(values).range(COLOR_SCHEMES[colorScheme])
  }, [effectiveValueMap, colorScheme])

  // Filter geographies based on region filter
  const filteredGeoData = useMemo(() => {
    if (!geoData?.features) return null
    if (level === "region") return geoData
    if (!regionFilter || regionFilter === "1000") return geoData

    const features = geoData.features.filter((f: any) => {
      const rawCode = f?.properties?.code
      if (!rawCode) return false
      const munCode = parseInt(String(rawCode), 10)
      if (!Number.isFinite(munCode)) return false
      return String(getRegionForMunicipality(munCode)) === String(regionFilter)
    })

    return { ...geoData, features }
  }, [geoData, level, regionFilter])

  // Calculate bounds for zoom
  const calculatedBounds = useMemo(() => {
    if (!filteredGeoData?.features?.length) {
      return { center: [4.4, 50.5] as [number, number], zoom: 1 }
    }

    if (level === "region" || (!regionFilter || regionFilter === "1000")) {
      return { center: [4.4, 50.5] as [number, number], zoom: 1 }
    }

    const featureCollection = {
      type: "FeatureCollection",
      features: filteredGeoData.features,
    }

    const bounds = geoBounds(featureCollection as any)
    const [[x0, y0], [x1, y1]] = bounds
    const newCenter: [number, number] = [(x0 + x1) / 2, (y0 + y1) / 2]

    const defaultWidth = 3.9
    const defaultHeight = 2.0
    const width = Math.abs(x1 - x0) || 0.1
    const height = Math.abs(y1 - y0) || 0.1

    const zoomX = (defaultWidth / width) * 0.8
    const zoomY = (defaultHeight / height) * 0.8
    const newZoom = Math.min(zoomX, zoomY, 15)

    if (width > 3.0 && height > 1.5) {
      return { center: [4.4, 50.5] as [number, number], zoom: 1 }
    }

    return { center: newCenter, zoom: newZoom }
  }, [filteredGeoData, level, regionFilter])

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.5, 8))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.5, 0.5))
  }, [])

  const handleReset = useCallback(() => {
    setZoom(1)
    setCenter([4.4, 50.5])
  }, [])

  // Tooltip handlers
  const handleMouseMove = useCallback(
    (e: React.MouseEvent, geoCode: string, name: string) => {
      const rect = (e.currentTarget as HTMLElement)
        .closest(".interactive-map-container")
        ?.getBoundingClientRect()
      if (!rect) return

      const value = effectiveValueMap.get(geoCode) ?? null
      const prevValue = previousValueByGeoCode.get(geoCode) ?? null
      const changePercent =
        value !== null && prevValue !== null && prevValue > 0
          ? ((value - prevValue) / prevValue) * 100
          : null

      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        name,
        value,
        formattedValue: value !== null ? formatValue(value) : "Geen data",
        previousValue: prevValue,
        changePercent,
        period: String(currentPeriod),
      })
    },
    [effectiveValueMap, previousValueByGeoCode, currentPeriod, formatValue]
  )

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }, [])

  // Period slider data
  const periodItems = useMemo(
    () => periods.map((p) => ({ value: p, label: String(p) })),
    [periods]
  )

  // Get name for geographic entity
  const getGeoName = useCallback(
    (code: string, geo?: any) => {
      if (level === "region") {
        return REGIONS.find((r) => String(r.code) === code)?.name ?? code
      }
      if (level === "province") {
        return PROVINCES.find((p) => String(p.code) === code)?.name ?? code
      }
      return geo?.properties?.LAU_NAME ?? code
    },
    [level]
  )

  // Loading state
  if (loading) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height }}
      >
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  // Error state
  if (!filteredGeoData) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-sm text-muted-foreground",
          className
        )}
        style={{ height }}
      >
        Kaartdata kon niet geladen worden.
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className="interactive-map-container relative w-full rounded-lg border bg-slate-50 overflow-hidden"
        style={{ height }}
      >
        {/* Tooltip */}
        {tooltip.visible && (
          <div
            className="absolute z-20 pointer-events-none px-3 py-2 bg-popover text-popover-foreground border rounded-lg shadow-lg"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-medium text-sm">{tooltip.name}</div>
            {showTimeSlider && tooltip.period && (
              <div className="text-xs text-muted-foreground">{tooltip.period}</div>
            )}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold">{tooltip.formattedValue}</span>
              {tooltip.changePercent !== null && (
                <span
                  className={cn(
                    "text-xs flex items-center gap-0.5",
                    tooltip.changePercent >= 0 ? "text-red-600" : "text-green-600"
                  )}
                >
                  {tooltip.changePercent >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {tooltip.changePercent >= 0 ? "+" : ""}
                  {tooltip.changePercent.toFixed(1)}%
                </span>
              )}
            </div>
            {tooltipLabel && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {tooltipLabel}
              </div>
            )}
          </div>
        )}

        {/* Zoom Controls */}
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          zoom={zoom}
          className="absolute top-3 right-3 z-10"
        />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-2 border">
          <MapLegend
            scale={colorScale}
            formatValue={formatValue}
            label={tooltipLabel}
          />
          <NoDataIndicator className="mt-2" />
        </div>

        {/* Map */}
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [4.4, 50.5],
            scale: level === "region" ? 6500 : 12000,
          }}
          className="w-full h-full"
        >
          <ZoomableGroup
            center={calculatedBounds.center}
            zoom={zoom}
            minZoom={0.5}
            maxZoom={8}
            onMoveEnd={({ coordinates, zoom: newZoom }) => {
              setCenter(coordinates as [number, number])
              setZoom(newZoom)
            }}
          >
            <Geographies geography={filteredGeoData}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const rawCode = String(geo.properties?.code ?? "")

                  // Determine the code to use for value lookup
                  let lookupCode = rawCode
                  if (level === "province") {
                    const munCode = parseInt(rawCode, 10)
                    if (Number.isFinite(munCode)) {
                      lookupCode = String(getProvinceForMunicipality(munCode))
                    }
                  }

                  const value = effectiveValueMap.get(lookupCode)
                  const isActive = selectedGeo && String(selectedGeo) === lookupCode
                  const fill =
                    value === undefined || !colorScale
                      ? "#f3f4f6"
                      : colorScale(value) ?? "#f3f4f6"

                  const name = getGeoName(lookupCode, geo)

                  // For province level, only draw province boundaries
                  const isProvinceLevel = level === "province"
                  const strokeWidth = isProvinceLevel ? 0.3 : 0.8

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => onGeoSelect?.(lookupCode)}
                      onMouseMove={(e) => handleMouseMove(e, lookupCode, name)}
                      onMouseLeave={handleMouseLeave}
                      style={{
                        default: {
                          fill,
                          stroke: "#ffffff",
                          strokeWidth: strokeWidth / zoom,
                          outline: "none",
                          cursor: onGeoSelect ? "pointer" : "default",
                          transition: "fill 300ms ease-in-out",
                        },
                        hover: {
                          fill: value === undefined || !colorScale ? "#e5e7eb" : fill,
                          stroke: "#374151",
                          strokeWidth: 1 / zoom,
                          outline: "none",
                        },
                        pressed: {
                          fill,
                          stroke: "#374151",
                          strokeWidth: 1 / zoom,
                          outline: "none",
                        },
                      }}
                      className={cn(isActive ? "drop-shadow-md" : "")}
                      aria-label={name}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Time Slider */}
      {showTimeSlider && periods.length > 1 && (
        <TimeSlider
          periods={periodItems}
          currentPeriod={currentPeriod}
          onPeriodChange={setCurrentPeriod}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying((p) => !p)}
        />
      )}
    </div>
  )
}
