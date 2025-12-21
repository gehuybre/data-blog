"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterableChart } from "./FilterableChart"
import { FilterableTable } from "./FilterableTable"
import { MunicipalityMap } from "./MunicipalityMap"
import { useGeo } from "./GeoContext"
import { getProvinceForMunicipality, getRegionForMunicipality, Municipality } from "@/lib/geo-utils"

type UnknownRecord = Record<string, any>

type PeriodTableConfig<TData> = {
  headers: string[]
  cells: (d: TData) => Array<string | number>
}

type PeriodConfig<TData> = {
  key?: (d: TData) => string
  sortValue?: (d: TData) => number
  label?: (d: TData) => string
  table?: PeriodTableConfig<TData>
}

interface AnalysisSectionProps<TData extends UnknownRecord = UnknownRecord> {
  title: string
  data: TData[]
  municipalities: Municipality[]
  metric: string
  label?: string
  getMunicipalityCode?: (d: TData) => number
  getMetricValue?: (d: TData, metric: string) => number
  period?: PeriodConfig<TData>
}

type AggregatedPoint = {
  label: string
  sortValue: number
  value: number
  periodCells: Array<string | number>
}

export function AnalysisSection<TData extends UnknownRecord = UnknownRecord>({
  title,
  data,
  municipalities,
  metric,
  label,
  getMunicipalityCode,
  getMetricValue,
  period,
}: AnalysisSectionProps<TData>) {
  const { level, selectedRegion, selectedProvince, selectedMunicipality } = useGeo()

  const municipalityCodeGetter =
    getMunicipalityCode ?? ((d: any) => Number(d?.m))
  const metricGetter =
    getMetricValue ?? ((d: any, m: string) => Number(d?.[m] ?? 0))

  const periodKeyGetter =
    period?.key ?? ((d: any) => `${d?.y}-${d?.q}`)
  const periodSortGetter =
    period?.sortValue ?? ((d: any) => (Number(d?.y) || 0) * 10 + (Number(d?.q) || 0))
  const periodLabelGetter =
    period?.label ?? ((d: any) => `${d?.y} Q${d?.q}`)

  const periodTable =
    period?.table ??
    ({
      headers: ["Jaar", "Kwartaal"],
      cells: (d: any) => [d?.y, `Q${d?.q}`],
    } satisfies PeriodTableConfig<any>)

  // 1. Filter raw data based on scope (for Map)
  // If municipality is selected, show province context. Otherwise show selected level context.
  const mapScopeData = useMemo(() => {
    if (level === 'municipality' && selectedMunicipality) {
       // Show province context
       const provCode = getProvinceForMunicipality(parseInt(selectedMunicipality))
       return data.filter(d => getProvinceForMunicipality(municipalityCodeGetter(d)) === provCode)
    }
    if (level === 'province' && selectedProvince) {
       return data.filter(d => getProvinceForMunicipality(municipalityCodeGetter(d)) === selectedProvince)
    }
    if (level === 'region' && selectedRegion !== '1000') {
       return data.filter(d => getRegionForMunicipality(municipalityCodeGetter(d)) === selectedRegion)
    }
    return data // Show all
  }, [data, level, selectedRegion, selectedProvince, selectedMunicipality, getMunicipalityCode])

  // 2. Aggregate data for Chart/Table
  const chartData = useMemo(() => {
    // Filter based on exact selection
    let filtered = data
    if (level === "municipality" && selectedMunicipality) {
      const mCode = parseInt(selectedMunicipality)
      filtered = data.filter((d) => municipalityCodeGetter(d) === mCode)
    } else if (level === "province" && selectedProvince) {
      filtered = data.filter((d) => getProvinceForMunicipality(municipalityCodeGetter(d)) === selectedProvince)
    } else if (level === "region" && selectedRegion !== "1000") {
      filtered = data.filter((d) => getRegionForMunicipality(municipalityCodeGetter(d)) === selectedRegion)
    }

    const agg = new Map<string, AggregatedPoint>()
    filtered.forEach((d) => {
      const key = periodKeyGetter(d)
      const prev = agg.get(key)
      const inc = metricGetter(d, metric)
      if (!prev) {
        agg.set(key, {
          label: periodLabelGetter(d),
          sortValue: periodSortGetter(d),
          value: inc,
          periodCells: periodTable.cells(d),
        })
        return
      }
      prev.value += inc
    })

    return Array.from(agg.values()).sort((a, b) => a.sortValue - b.sortValue)
  }, [
    data,
    level,
    selectedRegion,
    selectedProvince,
    selectedMunicipality,
    metric,
    getMunicipalityCode,
    getMetricValue,
    period,
  ])

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
              <FilterableChart data={chartData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data {title}</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableTable data={chartData} label={label} periodHeaders={periodTable.headers} />
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
                getMunicipalityCode={municipalityCodeGetter}
                getMetricValue={metricGetter}
                getPeriodKey={periodKeyGetter}
                getPeriodSortValue={periodSortGetter}
                getPeriodLabel={periodLabelGetter}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
