"use client"

import { useEffect, useMemo, useState } from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { scaleQuantile } from "d3-scale"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PROVINCES,
  ProvinceCode,
  RegionCode,
  getProvinceForMunicipality,
  getRegionForMunicipality,
} from "@/lib/geo-utils"

type UnknownRecord = Record<string, any>

interface TooltipState {
  visible: boolean
  x: number
  y: number
  name: string
  label: string
  value: string
}

interface ProvinceMapProps<TData extends UnknownRecord = UnknownRecord> {
  data: TData[]
  metric?: string
  selectedRegion?: RegionCode
  selectedProvince?: ProvinceCode | null
  onSelectProvince?: (code: ProvinceCode) => void
  getProvinceCode?: (d: TData) => ProvinceCode | string | null | undefined
  getMetricValue?: (d: TData, metric?: string) => number | null | undefined
  formatValue?: (value: number) => string
  /** Label for the metric shown in tooltips (e.g., "Aantal starters", "Overlevingskans") */
  tooltipLabel?: string
}

const GEO_URL =
  (process.env.NODE_ENV === "production" ? "/data-blog" : "") + "/maps/belgium_municipalities.json"

export function ProvinceMap<TData extends UnknownRecord = UnknownRecord>({
  data,
  metric,
  selectedRegion = "1000",
  selectedProvince = null,
  onSelectProvince,
  getProvinceCode,
  getMetricValue,
  formatValue,
  tooltipLabel,
}: ProvinceMapProps<TData>) {
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

  const provinceCodeGetter = getProvinceCode ?? ((d: any) => d?.p)
  const metricGetter =
    getMetricValue ??
    ((d: any, m?: string) => {
      if (typeof d?.value === "number") return d.value
      if (m) return typeof d?.[m] === "number" ? d[m] : Number(d?.[m] ?? 0)
      return typeof d?.value === "number" ? d.value : Number(d?.value ?? 0)
    })

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
  }, [data, metric, getProvinceCode, getMetricValue])

  const filteredGeo = useMemo(() => {
    if (!geoData?.features) return null
    if (selectedRegion === "1000") return geoData

    const features = geoData.features.filter((f: any) => {
      const raw = f?.properties?.code
      if (!raw) return false
      const munCode = Number.parseInt(String(raw), 10)
      if (!Number.isFinite(munCode)) return false
      return String(getRegionForMunicipality(munCode)) === String(selectedRegion)
    })

    return { ...geoData, features }
  }, [geoData, selectedRegion])

  const colorScale = useMemo(() => {
    const values = Array.from(valueByProvince.values()).filter((v) => Number.isFinite(v))
    if (!values.length) return null
    return scaleQuantile<string>()
      .domain(values)
      .range(["#e6f2ff", "#b3d9ff", "#66b3ff", "#0077cc", "#004c99"])
  }, [valueByProvince])

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

  return (
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
              const rawCode = geo.properties?.code
              const munCode = Number.parseInt(String(rawCode ?? ""), 10)
              if (!Number.isFinite(munCode)) return null

              const provCode = String(getProvinceForMunicipality(munCode))
              const value = valueByProvince.get(provCode)
              const isActive = selectedProvince && String(selectedProvince) === provCode
              const fill =
                value === undefined || !colorScale
                  ? "#f3f4f6"
                  : colorScale(value) ?? "#f3f4f6"

              const provinceName =
                PROVINCES.find((p) => String(p.code) === provCode)?.name ?? provCode

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
                  onClick={() => onSelectProvince?.(provCode as ProvinceCode)}
                  onMouseMove={(e) =>
                    handleMouseMove(e, provinceName, tooltipLabel ?? "", formattedValue)
                  }
                  onMouseLeave={handleMouseLeave}
                  style={{
                    default: {
                      fill,
                      stroke: "#ffffff",
                      strokeWidth: 0.6,
                      outline: "none",
                      cursor: onSelectProvince ? "pointer" : "default",
                    },
                    hover: {
                      fill: value === undefined || !colorScale ? "#e5e7eb" : fill,
                      stroke: "#ffffff",
                      strokeWidth: 0.6,
                      outline: "none",
                    },
                    pressed: {
                      fill,
                      stroke: "#ffffff",
                      strokeWidth: 0.6,
                      outline: "none",
                    },
                  }}
                  className={cn(isActive ? "drop-shadow-sm" : "")}
                  aria-label={provinceName}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  )
}

