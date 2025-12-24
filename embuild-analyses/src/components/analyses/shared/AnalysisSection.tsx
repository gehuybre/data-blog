"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilterableChart } from "./FilterableChart"
import { FilterableTable } from "./FilterableTable"
import { MunicipalityMap } from "./MunicipalityMap"
import { ExportButtons } from "./ExportButtons"
import { useGeo } from "./GeoContext"
import { PROVINCES, getProvinceForMunicipality, Municipality, ProvinceCode } from "@/lib/geo-utils"

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

  // 1. Filter raw data based on scope (for Map)
  // Province-only map: always show all provinces (color scale stays comparable).
  const mapScopeData = useMemo(() => {
    return data
  }, [data])

  // 2. Aggregate data for Chart/Table
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

  const latestPeriodLabel = useMemo(() => {
    if (!data?.length) return null
    const latest = data.reduce((prev, cur) => (periodSortGetter(cur) > periodSortGetter(prev) ? cur : prev), data[0])
    return periodLabelGetter(latest)
  }, [data, periodSortGetter, periodLabelGetter])

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
          />
        )}
      </div>

      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table" | "map")}>
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
                level="province"
                displayMode="province"
                selectedRegion={selectedRegion}
                selectedProvince={selectedProvince}
                getMunicipalityCode={municipalityCodeGetter}
                getMetricValue={metricGetter}
                getPeriodKey={periodKeyGetter}
                getPeriodSortValue={periodSortGetter}
                getPeriodLabel={periodLabelGetter}
                tooltipMetricLabel={title}
                formatValue={formatInt}
                onSelectProvince={(code: ProvinceCode) => {
                  setSelectedProvince(code)
                  setSelectedMunicipality(null)
                  const prov = PROVINCES.find((p) => String(p.code) === String(code))
                  if (prov) setSelectedRegion(prov.regionCode)
                  setLevel("province")
                  setPopupProvince(code)
                  setIsPopupOpen(true)
                }}
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
