"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilterableChart } from "./FilterableChart"
import { FilterableTable } from "./FilterableTable"
import { InteractiveMap } from "./InteractiveMap"
import { ExportButtons } from "./ExportButtons"
import { GeoFilterInline } from "./GeoFilterInline"
import { useGeo } from "./GeoContext"
import { PROVINCES, getProvinceForMunicipality, Municipality, ProvinceCode, RegionCode } from "@/lib/geo-utils"

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
  /** Analysis slug for embed URLs (e.g., "vergunningen-goedkeuringen") */
  slug?: string
  /** Section ID for embed URLs (e.g., "renovatie") */
  sectionId?: string
  /** Data source description for CSV metadata */
  dataSource?: string
  /** Data source URL for CSV metadata */
  dataSourceUrl?: string
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
  slug,
  sectionId,
  dataSource,
  dataSourceUrl,
  getMunicipalityCode,
  getMetricValue,
  period,
}: AnalysisSectionProps<TData>) {
  const {
    level,
    setLevel,
    selectedRegion,
    setSelectedRegion,
    selectedProvince,
    setSelectedProvince,
    setSelectedMunicipality,
  } = useGeo()

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

  // Aggregate data for Chart/Table
  const chartData = useMemo(() => {
    // Filter based on exact selection
    let filtered = data
    if (level === "province" && selectedProvince) {
      filtered = data.filter((d) => getProvinceForMunicipality(municipalityCodeGetter(d)) === selectedProvince)
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
    metric,
    getMunicipalityCode,
    getMetricValue,
    period,
  ])

  const formatInt = useMemo(() => {
    return (n: number) => new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
  }, [])

  function handleSelectRegion(code: RegionCode) {
    setSelectedRegion(code)
    setSelectedProvince(null)
    setSelectedMunicipality(null)
    setLevel("region")
  }

  function handleSelectProvince(code: ProvinceCode | null) {
    if (code === null) {
      setSelectedProvince(null)
      setSelectedMunicipality(null)
      return
    }
    setSelectedProvince(code)
    setSelectedMunicipality(null)
    const prov = PROVINCES.find((p) => String(p.code) === String(code))
    if (prov) setSelectedRegion(prov.regionCode)
    setLevel("province")
  }

  const latestPeriodLabel = useMemo(() => {
    if (!data?.length) return null
    const latest = data.reduce((prev, cur) => (periodSortGetter(cur) > periodSortGetter(prev) ? cur : prev), data[0])
    return periodLabelGetter(latest)
  }, [data, periodSortGetter, periodLabelGetter])

  // Get all unique periods for time slider
  const periods = useMemo(() => {
    const periodSet = new Set<string>()
    for (const row of data) {
      periodSet.add(periodKeyGetter(row))
    }
    return Array.from(periodSet).sort((a, b) => {
      const aSort = periodSortGetter(data.find(d => periodKeyGetter(d) === a)!)
      const bSort = periodSortGetter(data.find(d => periodKeyGetter(d) === b)!)
      return aSort - bSort
    })
  }, [data, periodKeyGetter, periodSortGetter])

  // Aggregate data by province for all periods (for InteractiveMap with time slider)
  const provinceMapData = useMemo(() => {
    if (!data?.length) return []

    // Group by period + province
    const agg = new Map<string, { p: string; period: string; value: number }>()

    for (const row of data) {
      const mCode = municipalityCodeGetter(row)
      const numericMunCode = typeof mCode === "string" ? Number.parseInt(mCode, 10) : Number(mCode)
      if (!Number.isFinite(numericMunCode)) continue

      const provCode = String(getProvinceForMunicipality(numericMunCode))
      const periodKey = periodKeyGetter(row)
      const key = `${periodKey}-${provCode}`

      const prev = agg.get(key)
      const inc = metricGetter(row, metric)

      if (!prev) {
        agg.set(key, { p: provCode, period: periodKey, value: inc })
      } else {
        prev.value += inc
      }
    }

    return Array.from(agg.values())
  }, [data, metric, municipalityCodeGetter, metricGetter, periodKeyGetter])

  const provinceValueByCode = useMemo(() => {
    if (!data?.length) return {} as Record<string, number>
    const latest = data.reduce((prev, cur) => (periodSortGetter(cur) > periodSortGetter(prev) ? cur : prev), data[0])
    const latestKey = periodKeyGetter(latest)
    const out: Record<string, number> = {}
    for (const row of data) {
      if (periodKeyGetter(row) !== latestKey) continue
      const mCode = municipalityCodeGetter(row)
      const numericMunCode = typeof mCode === "string" ? Number.parseInt(mCode, 10) : Number(mCode)
      if (!Number.isFinite(numericMunCode)) continue
      const provCode = String(getProvinceForMunicipality(numericMunCode))
      out[provCode] = (out[provCode] ?? 0) + metricGetter(row, metric)
    }
    return out
  }, [data, metric, municipalityCodeGetter, metricGetter, periodKeyGetter, periodSortGetter])

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [popupProvince, setPopupProvince] = useState<ProvinceCode | null>(null)
  const [currentView, setCurrentView] = useState<"chart" | "table" | "map">("chart")

  const popupProvinceName = useMemo(() => {
    if (!popupProvince) return null
    return PROVINCES.find((p) => String(p.code) === String(popupProvince))?.name ?? String(popupProvince)
  }, [popupProvince])

  const popupValue = useMemo(() => {
    if (!popupProvince) return null
    const v = provinceValueByCode[String(popupProvince)]
    return typeof v === "number" && Number.isFinite(v) ? v : null
  }, [popupProvince, provinceValueByCode])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {slug && sectionId && (
          <ExportButtons
            data={chartData}
            title={title}
            slug={slug}
            sectionId={sectionId}
            viewType={currentView}
            periodHeaders={periodTable.headers}
            valueLabel={label}
            dataSource={dataSource}
            dataSourceUrl={dataSourceUrl}
          />
        )}
      </div>

      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table" | "map")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
            <TabsTrigger value="map">Kaart</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <GeoFilterInline
              selectedRegion={selectedRegion}
              selectedProvince={selectedProvince}
              onSelectRegion={handleSelectRegion}
              onSelectProvince={handleSelectProvince}
              showRegions={false}
            />
          </div>
        </div>
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
              <InteractiveMap
                data={provinceMapData}
                level="province"
                getGeoCode={(d) => d.p}
                getValue={(d) => d.value}
                getPeriod={(d) => d.period}
                periods={periods}
                showTimeSlider={true}
                selectedGeo={selectedProvince}
                onGeoSelect={(code) => {
                  if (code) {
                    setSelectedProvince(code as ProvinceCode)
                    setSelectedMunicipality(null)
                    const prov = PROVINCES.find((p) => String(p.code) === String(code))
                    if (prov) setSelectedRegion(prov.regionCode)
                    setLevel("province")
                    setPopupProvince(code as ProvinceCode)
                    setIsPopupOpen(true)
                  } else {
                    setSelectedProvince(null)
                  }
                }}
                formatValue={formatInt}
                tooltipLabel={title}
                regionFilter="2000"
                height={500}
              />
            </CardContent>
          </Card>
          <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{popupProvinceName ? popupProvinceName : "Provincie"}</DialogTitle>
                <DialogDescription>
                  {latestPeriodLabel ? `Laatste periode: ${latestPeriodLabel}` : "Laatste periode"}
                </DialogDescription>
              </DialogHeader>
              <div className="text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="text-muted-foreground">{title}</div>
                  <div className="font-semibold">{popupValue === null ? "Geen data" : formatInt(popupValue)}</div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
