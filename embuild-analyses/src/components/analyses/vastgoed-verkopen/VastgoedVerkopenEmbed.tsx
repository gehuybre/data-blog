"use client"

import { useMemo } from "react"
import { FilterableChart } from "../shared/FilterableChart"
import { FilterableTable } from "../shared/FilterableTable"

import yearlyRaw from "../../../../analyses/vastgoed-verkopen/results/yearly.json"
import quarterlyRaw from "../../../../analyses/vastgoed-verkopen/results/quarterly.json"

type YearlyRow = {
  y: number
  lvl: number
  nis: string
  type: string
  n: number
  p50: number
  name: string
}

type QuarterlyRow = {
  y: number
  q: number
  lvl: number
  nis: string
  type: string
  n: number
  p50: number
  p25: number
  p75: number
  name: string
}

type YearPoint = {
  sortValue: number
  periodCells: Array<string | number>
  value: number
}

type SectionType = "transacties" | "prijzen" | "transacties-kwartaal" | "prijzen-kwartaal"
type ViewType = "chart" | "table"

function formatInt(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n)
}

function aggregateTransactionsByYear(rows: YearlyRow[]): YearPoint[] {
  const agg = new Map<number, number>()
  for (const r of rows) {
    if (typeof r.y !== "number" || typeof r.n !== "number") continue
    agg.set(r.y, (agg.get(r.y) ?? 0) + r.n)
  }
  return Array.from(agg.entries())
    .map(([y, v]) => ({ sortValue: y, periodCells: [y], value: v }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function aggregateMedianPriceByYear(rows: YearlyRow[]): YearPoint[] {
  const agg = new Map<number, number>()
  for (const r of rows) {
    if (typeof r.y !== "number" || typeof r.p50 !== "number") continue
    agg.set(r.y, r.p50)
  }
  return Array.from(agg.entries())
    .map(([y, v]) => ({ sortValue: y, periodCells: [y], value: v }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function aggregateByQuarter(rows: QuarterlyRow[], metric: "n" | "p50"): YearPoint[] {
  return rows
    .filter((r) => typeof r.y === "number" && typeof r.q === "number" && typeof r[metric] === "number")
    .map((r) => ({
      sortValue: r.y * 10 + r.q,
      periodCells: [r.y, `Q${r.q}`],
      value: r[metric],
    }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

interface VastgoedVerkopenEmbedProps {
  section: SectionType
  viewType: ViewType
  geo?: string | null
  type?: string | null
}

export function VastgoedVerkopenEmbed({
  section,
  viewType,
  geo = null,
  type = "alle_huizen",
}: VastgoedVerkopenEmbedProps) {
  const yearlyRows = useMemo(() => yearlyRaw as YearlyRow[], [])
  const quarterlyRows = useMemo(() => quarterlyRaw as QuarterlyRow[], [])

  // Filter by geo level (Belgium = lvl 1)
  const filteredYearly = useMemo(() => {
    let filtered = yearlyRows.filter((r) => r.lvl === 1 && r.type === type)
    return filtered
  }, [yearlyRows, type])

  const filteredQuarterly = useMemo(() => {
    let filtered = quarterlyRows.filter((r) => r.lvl === 1 && r.type === type)
    return filtered
  }, [quarterlyRows, type])

  // Compute the appropriate data series based on section
  const yearSeries = useMemo(() => {
    switch (section) {
      case "transacties":
        return aggregateTransactionsByYear(filteredYearly)
      case "prijzen":
        return aggregateMedianPriceByYear(filteredYearly)
      case "transacties-kwartaal":
        return aggregateByQuarter(filteredQuarterly, "n")
      case "prijzen-kwartaal":
        return aggregateByQuarter(filteredQuarterly, "p50")
    }
  }, [section, filteredYearly, filteredQuarterly])

  // Build title
  const title = useMemo(() => {
    switch (section) {
      case "transacties":
        return "Aantal transacties"
      case "prijzen":
        return "Mediaanprijs"
      case "transacties-kwartaal":
        return "Transacties per kwartaal"
      case "prijzen-kwartaal":
        return "Mediaanprijs per kwartaal"
    }
  }, [section])

  const isQuarterly = section.includes("kwartaal")
  const isPriceMetric = section.includes("prijzen")
  const label = isPriceMetric ? "Prijs (€)" : "Transacties"
  const formatValue = isPriceMetric ? formatPrice : formatInt
  const periodHeaders = isQuarterly ? ["Jaar", "Kwartaal"] : ["Jaar"]

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {viewType === "chart" && (
        <FilterableChart
          data={yearSeries}
          getLabel={(d) =>
            isQuarterly
              ? `${(d as YearPoint).periodCells[0]} ${(d as YearPoint).periodCells[1]}`
              : String((d as YearPoint).periodCells[0])
          }
          getValue={(d) => (d as YearPoint).value}
          getSortValue={(d) => (d as YearPoint).sortValue}
        />
      )}

      {viewType === "table" && (
        <FilterableTable data={yearSeries} label={label} periodHeaders={periodHeaders} />
      )}

      <div className="mt-4 text-xs text-muted-foreground text-center">
        <a
          href={typeof window !== "undefined" ? window.location.origin + (process.env.NODE_ENV === "production" ? "/data-blog" : "") : ""}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Data Blog
        </a>
        {" · "}
        <span>Bron: Statbel</span>
      </div>
    </div>
  )
}
