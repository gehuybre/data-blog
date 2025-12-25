"use client"

import { useEffect, useMemo, useState } from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { scaleQuantile } from "d3-scale"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { REGIONS, RegionCode } from "@/lib/geo-utils"

type UnknownRecord = Record<string, any>

interface TooltipState {
  visible: boolean
  x: number
  y: number
  name: string
  label: string
  value: string
}

interface RegionMapProps<TData extends UnknownRecord = UnknownRecord> {
  data: TData[]
  metric?: string
  selectedRegion?: RegionCode
  onSelectRegion?: (code: RegionCode) => void
  getRegionCode?: (d: TData) => RegionCode | string | null | undefined
  getMetricValue?: (d: TData, metric?: string) => number | null | undefined
  formatValue?: (value: number) => string
  /** Label for the metric shown in tooltips (e.g., "Aantal starters", "Overlevingskans") */
  tooltipLabel?: string
}

const GEO_URL =
  (process.env.NODE_ENV === "production" ? "/data-blog" : "") + "/maps/belgium_regions.json"

export function RegionMap<TData extends UnknownRecord = UnknownRecord>({
  data,
  metric,
  selectedRegion = "1000",
  onSelectRegion,
  getRegionCode,
  getMetricValue,
  formatValue,
  tooltipLabel,
}: RegionMapProps<TData>) {
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

  useEffect(() => {
    fetch(GEO_URL)
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
  }, [])

  const regionCodeGetter = getRegionCode ?? ((d: any) => d?.r)
  const metricGetter =
    getMetricValue ??
    ((d: any, m?: string) => {
      if (typeof d?.value === "number") return d.value
      if (m) return typeof d?.[m] === "number" ? d[m] : Number(d?.[m] ?? 0)
      return typeof d?.value === "number" ? d.value : Number(d?.value ?? 0)
    })

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
  }, [data, metric, getRegionCode, getMetricValue])

  const colorScale = useMemo(() => {
    const values = Array.from(valueByRegion.values()).filter((v) => Number.isFinite(v))
    if (!values.length) return null
    return scaleQuantile<string>()
      .domain(values)
      .range(["#e6f2ff", "#b3d9ff", "#66b3ff", "#0077cc", "#004c99"])
  }, [valueByRegion])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[360px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!geoData) {
    return (
      <div className="flex items-center justify-center h-[360px] text-sm text-muted-foreground">
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

  return (
    <div className="relative w-full h-[360px]">
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
        height={360}
        className="w-full h-full"
      >
        <Geographies geography={geoData}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const code = String(geo.properties?.code ?? "")
              const value = valueByRegion.get(code)
              const isActive = selectedRegion !== "1000" && String(selectedRegion) === code
              const fill =
                value === undefined || !colorScale
                  ? "#f3f4f6"
                  : colorScale(value) ?? "#f3f4f6"

              const regionName =
                REGIONS.find((r) => String(r.code) === code)?.name ?? geo.properties?.name ?? code

              const formattedValue =
                value === undefined || !Number.isFinite(value)
                  ? "Geen data"
                  : formatValue
                    ? formatValue(value)
                    : String(value)

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onSelectRegion?.(code as RegionCode)}
                  onMouseMove={(e) =>
                    handleMouseMove(e, regionName, tooltipLabel ?? "", formattedValue)
                  }
                  onMouseLeave={handleMouseLeave}
                  style={{
                    default: {
                      fill,
                      stroke: "#ffffff",
                      strokeWidth: 1,
                      outline: "none",
                      cursor: onSelectRegion ? "pointer" : "default",
                    },
                    hover: {
                      fill: value === undefined || !colorScale ? "#e5e7eb" : fill,
                      stroke: "#ffffff",
                      strokeWidth: 1,
                      outline: "none",
                    },
                    pressed: {
                      fill: fill,
                      stroke: "#ffffff",
                      strokeWidth: 1,
                      outline: "none",
                    },
                  }}
                  className={cn(isActive ? "drop-shadow-sm" : "")}
                  aria-label={regionName}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  )
}
