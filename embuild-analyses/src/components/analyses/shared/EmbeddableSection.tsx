"use client"

import { useMemo } from "react"
import { FilterableChart } from "./FilterableChart"
import { FilterableTable } from "./FilterableTable"
import { MunicipalityMap } from "./MunicipalityMap"
import { getProvinceForMunicipality, Municipality } from "@/lib/geo-utils"

type UnknownRecord = Record<string, unknown>

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

type AggregatedPoint = {
  label: string
  sortValue: number
  value: number
  periodCells: Array<string | number>
}

interface EmbeddableSectionProps<TData extends object = UnknownRecord> {
  title: string
  data: TData[]
  municipalities: Municipality[]
  metric: string
  label?: string
  viewType: "chart" | "table" | "map"
  getMunicipalityCode?: (d: TData) => number
  getMetricValue?: (d: TData, metric: string) => number
  period?: PeriodConfig<TData>
}

export function EmbeddableSection<TData extends object = UnknownRecord>({
  title,
  data,
  municipalities,
  metric,
  label,
  viewType,
  getMunicipalityCode,
  getMetricValue,
  period,
}: EmbeddableSectionProps<TData>) {
  const municipalityCodeGetter =
    getMunicipalityCode ?? ((d: unknown) => Number((d as Record<string, unknown>)?.m))
  const metricGetter =
    getMetricValue ?? ((d: unknown, m: string) => Number((d as Record<string, unknown>)?.[m] ?? 0))

  const periodKeyGetter =
    period?.key ?? ((d: unknown) => `${(d as Record<string, unknown>)?.y}-${(d as Record<string, unknown>)?.q}`)
  const periodSortGetter =
    period?.sortValue ?? ((d: unknown) => (Number((d as Record<string, unknown>)?.y) || 0) * 10 + (Number((d as Record<string, unknown>)?.q) || 0))
  const periodLabelGetter =
    period?.label ?? ((d: unknown) => `${(d as Record<string, unknown>)?.y} Q${(d as Record<string, unknown>)?.q}`)

  const periodTable =
    period?.table ??
    ({
      headers: ["Jaar", "Kwartaal"],
      cells: (d: unknown) => {
        const rec = d as Record<string, unknown>
        return [rec?.y as number, `Q${rec?.q}`]
      },
    } satisfies PeriodTableConfig<unknown>)

  const chartData = useMemo(() => {
    const agg = new Map<string, AggregatedPoint>()
    data.forEach((d) => {
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
  }, [data, metric, periodKeyGetter, periodSortGetter, periodLabelGetter, periodTable, metricGetter])

  const formatInt = useMemo(() => {
    return (n: number) => new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {viewType === "chart" && (
        <FilterableChart data={chartData} />
      )}

      {viewType === "table" && (
        <FilterableTable data={chartData} label={label} periodHeaders={periodTable.headers} />
      )}

      {viewType === "map" && (
        <MunicipalityMap
          data={data}
          metric={metric}
          municipalities={municipalities}
          level="province"
          displayMode="province"
          getMunicipalityCode={municipalityCodeGetter}
          getMetricValue={metricGetter}
          getPeriodKey={periodKeyGetter}
          getPeriodSortValue={periodSortGetter}
          getPeriodLabel={periodLabelGetter}
          tooltipMetricLabel={title}
          formatValue={formatInt}
        />
      )}

      <div className="mt-4 text-xs text-muted-foreground text-center">
        <a
          href={typeof window !== "undefined" ? window.location.origin + (process.env.NODE_ENV === "production" ? "/data-blog" : "") : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          suppressHydrationWarning
        >
          Data Blog
        </a>
      </div>
    </div>
  )
}
