"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterableChart } from "./FilterableChart"
import { FilterableTable } from "./FilterableTable"
import { MunicipalityMap } from "./MunicipalityMap"
import { useGeo } from "./GeoContext"
import { getProvinceForMunicipality, getRegionForMunicipality, Municipality } from "@/lib/geo-utils"

interface DataPoint {
  y: number
  q: number
  m: number
  [key: string]: any
}

interface AnalysisSectionProps {
  title: string
  data: DataPoint[]
  municipalities: Municipality[]
  metric: string
  label?: string
}

export function AnalysisSection({ title, data, municipalities, metric, label }: AnalysisSectionProps) {
  const { level, selectedRegion, selectedProvince, selectedMunicipality } = useGeo()

  // 1. Filter raw data based on scope (for Map)
  // If municipality is selected, show province context. Otherwise show selected level context.
  const mapScopeData = useMemo(() => {
    if (level === 'municipality' && selectedMunicipality) {
       // Show province context
       const provCode = getProvinceForMunicipality(parseInt(selectedMunicipality))
       return data.filter(d => getProvinceForMunicipality(d.m) === provCode)
    }
    if (level === 'province' && selectedProvince) {
       return data.filter(d => getProvinceForMunicipality(d.m) === selectedProvince)
    }
    if (level === 'region' && selectedRegion !== '1000') {
       return data.filter(d => getRegionForMunicipality(d.m) === selectedRegion)
    }
    return data // Show all
  }, [data, level, selectedRegion, selectedProvince, selectedMunicipality])

  // 2. Aggregate data for Chart/Table
  const chartData = useMemo(() => {
     // Filter based on exact selection
     let filtered = data;
     if (level === 'municipality' && selectedMunicipality) {
        const mCode = parseInt(selectedMunicipality)
        return data.filter(d => d.m === mCode).sort((a, b) => (a.y === b.y ? a.q - b.q : a.y - b.y))
     }
     
     if (level === 'province' && selectedProvince) {
        filtered = data.filter(d => getProvinceForMunicipality(d.m) === selectedProvince)
     } else if (level === 'region' && selectedRegion !== '1000') {
        filtered = data.filter(d => getRegionForMunicipality(d.m) === selectedRegion)
     }
     
     // Aggregate
     const agg = new Map<string, DataPoint>()
     filtered.forEach(d => {
        const key = `${d.y}-${d.q}`
        if (!agg.has(key)) {
          agg.set(key, { y: d.y, q: d.q, m: 0, [metric]: 0 })
        }
        const entry = agg.get(key)!
        entry[metric] = (entry[metric] || 0) + (d[metric] || 0)
      })
      return Array.from(agg.values()).sort((a, b) => (a.y === b.y ? a.q - b.q : a.y - b.y))

  }, [data, level, selectedRegion, selectedProvince, selectedMunicipality, metric])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Grafiek</TabsTrigger>
          <TabsTrigger value="table">Tabel</TabsTrigger>
          <TabsTrigger value="map">Kaart</TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Evolutie {title}</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableChart data={chartData} metric={metric} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data {title}</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableTable data={chartData} metric={metric} label={label} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Kaart {title}</CardTitle>
            </CardHeader>
            <CardContent>
              <MunicipalityMap 
                data={mapScopeData} 
                metric={metric} 
                municipalities={municipalities}
                level={level}
                selectedRegion={selectedRegion}
                selectedProvince={selectedProvince}
                selectedMunicipality={selectedMunicipality}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

