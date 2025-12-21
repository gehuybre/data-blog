"use client"

import { useEffect, useState, useMemo } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { scaleQuantile } from "d3-scale"
import { geoBounds, geoMercator } from "d3-geo"
import { Loader2 } from "lucide-react"
import { getProvinceForMunicipality, getRegionForMunicipality, RegionCode, ProvinceCode, MunicipalityCode } from "@/lib/geo-utils"

type UnknownRecord = Record<string, any>

interface MunicipalityMapProps<TData extends UnknownRecord = UnknownRecord> {
  data: TData[]
  metric: string
  municipalities: any[]
  level?: 'region' | 'province' | 'municipality'
  selectedRegion?: RegionCode
  selectedProvince?: ProvinceCode | null
  selectedMunicipality?: MunicipalityCode | null
  getMunicipalityCode?: (d: TData) => number | string
  getMetricValue?: (d: TData, metric: string) => number
  getPeriodKey?: (d: TData) => string
  getPeriodSortValue?: (d: TData) => number
  getPeriodLabel?: (d: TData) => string
}

// In production this site is exported under `basePath` (see `embuild-analyses/next.config.mjs`),
// so we must prefix public asset URLs accordingly.
const GEO_URL =
  process.env.NODE_ENV === "production"
    ? "/data-blog/maps/belgium_municipalities.json"
    : "/maps/belgium_municipalities.json"

export function MunicipalityMap<TData extends UnknownRecord = UnknownRecord>({
  data, 
  metric, 
  municipalities,
  level = 'region',
  selectedRegion = '1000',
  selectedProvince = null,
  selectedMunicipality = null,
  getMunicipalityCode,
  getMetricValue,
  getPeriodKey,
  getPeriodSortValue,
  getPeriodLabel,
}: MunicipalityMapProps<TData>) {
  const [geoData, setGeoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  // Filter geographies based on selection
  const filteredGeographies = useMemo(() => {
    if (!geoData) return []
    
    return geoData.features.filter((feature: any) => {
      const rawCode = feature.properties.code
      if (!rawCode) return false
      
      const code = parseInt(rawCode)
      if (isNaN(code)) return false
      
      if (level === 'municipality' && selectedMunicipality) {
        // Show province context for municipality
        const provCode = getProvinceForMunicipality(parseInt(selectedMunicipality))
        return getProvinceForMunicipality(code) === provCode
      }
      
      if (level === 'province' && selectedProvince) {
        const provCode = getProvinceForMunicipality(code)
        return String(provCode) === String(selectedProvince)
      }
      
      if (level === 'region' && selectedRegion !== '1000') {
        const regCode = getRegionForMunicipality(code)
        return String(regCode) === String(selectedRegion)
      }
      
      return true // Show all for Belgium
    })
  }, [geoData, level, selectedRegion, selectedProvince, selectedMunicipality])

  // Calculate center and zoom based on filtered geographies
  const { center, zoom } = useMemo(() => {
    if (!filteredGeographies.length) return { center: [4.4, 50.5] as [number, number], zoom: 1 }

    // If showing all of Belgium, use default
    if (level === 'region' && selectedRegion === '1000') {
      return { center: [4.4, 50.5] as [number, number], zoom: 1 }
    }

    // Create a FeatureCollection for bounds calculation
    const featureCollection = {
      type: "FeatureCollection",
      features: filteredGeographies
    }

    // Calculate bounds using d3-geo
    // Note: We use standard geoBounds which returns [[minLon, minLat], [maxLon, maxLat]]
    const bounds = geoBounds(featureCollection as any)
    const [[x0, y0], [x1, y1]] = bounds

    const center: [number, number] = [(x0 + x1) / 2, (y0 + y1) / 2]

    // Calculate zoom
    // Heuristic: Belgium bounds are approx width 3.9, height 2.0
    // Default zoom 1 fits Belgium.
    // New zoom = min(defaultWidth / selectionWidth, defaultHeight / selectionHeight)
    const defaultWidth = 3.9
    const defaultHeight = 2.0
    
    const width = Math.abs(x1 - x0) || 0.1
    const height = Math.abs(y1 - y0) || 0.1
    
    // Add some padding (0.8 factor)
    const zoomX = (defaultWidth / width) * 0.8
    const zoomY = (defaultHeight / height) * 0.8
    const zoom = Math.min(zoomX, zoomY, 15) // Cap max zoom

    // If showing all of Belgium (or close to it), force zoom 1
    if (width > 3.0 && height > 1.5) return { center: [4.4, 50.5] as [number, number], zoom: 1 }

    return { center, zoom }
  }, [filteredGeographies, level, selectedRegion])

  // Create a filtered GeoJSON object to pass to Geographies
  const filteredGeoJson = useMemo(() => {
    if (!geoData) return null
    
    // If showing all of Belgium, return original data
    if (level === 'region' && selectedRegion === '1000') {
      return geoData
    }

    return {
      type: "FeatureCollection",
      features: filteredGeographies
    }
  }, [geoData, filteredGeographies, level, selectedRegion])

  const municipalityCodeGetter =
    getMunicipalityCode ?? ((d: any) => d?.m)
  const metricGetter =
    getMetricValue ?? ((d: any, m: string) => Number(d?.[m] ?? 0))
  const periodKeyGetter =
    getPeriodKey ?? ((d: any) => `${d?.y}-${d?.q}`)
  const periodSortGetter =
    getPeriodSortValue ?? ((d: any) => (Number(d?.y) || 0) * 10 + (Number(d?.q) || 0))
  const periodLabelGetter =
    getPeriodLabel ?? ((d: any) => `${d?.y} Q${d?.q}`)

  // Find latest period
  const latestPeriod = useMemo(() => {
    if (!data || !data.length) return null
    return data.reduce((prev, current) => {
      return periodSortGetter(current) > periodSortGetter(prev) ? current : prev
    }, data[0])
  }, [data, getPeriodSortValue])

  // Prepare data for the map (map municipality code -> value)
  const mapData = useMemo(() => {
    if (!latestPeriod) return {}
    const latestKey = periodKeyGetter(latestPeriod)
    const currentData = data.filter(d => periodKeyGetter(d) === latestKey)
    
    const dataMap: Record<string, number> = {}
    currentData.forEach(d => {
      const code = municipalityCodeGetter(d)
      if (code === null || code === undefined) return
      dataMap[String(code)] = metricGetter(d, metric)
    })
    return dataMap
  }, [data, latestPeriod, metric, getMunicipalityCode, getMetricValue, getPeriodKey])

  const colorScale = useMemo(() => {
    const values = Object.values(mapData)
    if (!values.length) return () => "#EEE"
    
    return scaleQuantile<string>()
      .domain(values)
      .range([
        "#ffedea",
        "#ffcec5",
        "#ffad9f",
        "#ff8a75",
        "#ff5533",
        "#e2492d",
        "#be3d26",
        "#9a311f",
        "#782618"
      ])
  }, [mapData])

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!geoData) {
    return <div className="flex h-[400px] items-center justify-center text-muted-foreground">Kon kaart niet laden.</div>
  }

  return (
    <div className="flex flex-col space-y-4">
        {latestPeriod && (
            <div className="text-center text-sm text-muted-foreground">
                Data voor {periodLabelGetter(latestPeriod)}
            </div>
        )}
        <div className="h-[500px] w-full border rounded-lg overflow-hidden bg-slate-50 relative">
        <ComposableMap 
            projection="geoMercator" 
            projectionConfig={{ 
                scale: 12000, 
                center: [4.4, 50.5] 
            }}
            className="w-full h-full"
        >
            <ZoomableGroup 
              key={`${level}-${selectedRegion}-${selectedProvince}-${selectedMunicipality}`}
              center={center} 
              zoom={zoom} 
              minZoom={0.5} 
              maxZoom={20}
              filterZoomEvent={() => true} // Allow zooming
            >
            <Geographies geography={filteredGeoJson} key={JSON.stringify(filteredGeoJson?.features?.length)}>
            {({ geographies }) =>
                geographies.map((geo) => {
                    const code = geo.properties.code
                    const value = mapData[code]
                    return (
                        <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={value !== undefined ? colorScale(value) : "#EEE"}
                        stroke="#D6D6DA"
                        strokeWidth={0.5 / zoom} // Adjust stroke width based on zoom
                        style={{
                            default: { outline: "none" },
                            hover: { fill: "#F53", outline: "none", cursor: "pointer" },
                            pressed: { outline: "none" },
                        }}
                        // title={`${geo.properties.LAU_NAME}: ${value || 0}`}
                        />
                    )
                })
            }
            </Geographies>
            </ZoomableGroup>
        </ComposableMap>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Laag</span>
            <div className="flex h-2 w-32 rounded-full bg-gradient-to-r from-[#ffedea] to-[#782618]" />
            <span>Hoog</span>
        </div>
    </div>
  )
}
