"use client"

import { useEffect, useState, useMemo } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { scaleQuantile } from "d3-scale"
import { geoBounds, geoMercator } from "d3-geo"
import { Loader2 } from "lucide-react"
import { getProvinceForMunicipality, getRegionForMunicipality, RegionCode, ProvinceCode, MunicipalityCode } from "@/lib/geo-utils"

interface MunicipalityMapProps {
  data: any[]
  metric: string
  municipalities: any[]
  level?: 'region' | 'province' | 'municipality'
  selectedRegion?: RegionCode
  selectedProvince?: ProvinceCode | null
  selectedMunicipality?: MunicipalityCode | null
}

const GEO_URL = "/maps/belgium_municipalities.json"

export function MunicipalityMap({ 
  data, 
  metric, 
  municipalities,
  level = 'region',
  selectedRegion = '1000',
  selectedProvince = null,
  selectedMunicipality = null
}: MunicipalityMapProps) {
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

  // Find latest quarter
  const latestPeriod = useMemo(() => {
    if (!data || !data.length) return null
    return data.reduce((prev, current) => {
      if (current.y > prev.y) return current
      if (current.y === prev.y && current.q > prev.q) return current
      return prev
    }, data[0])
  }, [data])

  // Prepare data for the map (map municipality code -> value)
  const mapData = useMemo(() => {
    if (!latestPeriod) return {}
    const { y, q } = latestPeriod
    const currentData = data.filter(d => d.y === y && d.q === q)
    
    const dataMap: Record<string, number> = {}
    currentData.forEach(d => {
      dataMap[d.m.toString()] = d[metric]
    })
    return dataMap
  }, [data, latestPeriod, metric])

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
        {/* Debug Info - Temporary */}
        <div className="text-xs bg-yellow-100 p-2 rounded border border-yellow-300">
          DEBUG: Level: {level}, Region: {selectedRegion}, Province: {selectedProvince}, 
          Features: {filteredGeographies.length} / {geoData.features.length}
        </div>

        {latestPeriod && (
            <div className="text-center text-sm text-muted-foreground">
                Data voor {latestPeriod.y} Q{latestPeriod.q}
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
                        fill={value ? colorScale(value) : "#EEE"}
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
