"use client"

import { useMemo } from "react"
import { FilterableChart } from "../shared/FilterableChart"
import { FilterableTable } from "../shared/FilterableTable"
import { ProvinceMap } from "../shared/ProvinceMap"
import { RegionMap } from "../shared/RegionMap"
import { PROVINCES, ProvinceCode, REGIONS, RegionCode } from "@/lib/geo-utils"

import raw from "../../../../analyses/starters-stoppers/results/vat_survivals.json"

type VatSurvivalRow = {
  y: number | null
  r: string | null
  p: string | null
  n1: string | null
  fr: number | null
  s1: number | null
  s2: number | null
  s3: number | null
  s4: number | null
  s5: number | null
}

type YearPoint = {
  sortValue: number
  periodCells: Array<string | number>
  value: number
  label?: string
}

type RegionPoint = {
  r: RegionCode
  value: number
}

type ProvincePoint = {
  p: ProvinceCode
  value: number
}

type StopHorizon = 1 | 2 | 3 | 4 | 5
type SurvivalKey = "s1" | "s2" | "s3" | "s4" | "s5"
type SectionType = "starters" | "stoppers" | "survival"
type ViewType = "chart" | "table" | "map"

function survivalKeyForHorizon(h: StopHorizon): SurvivalKey {
  return `s${h}` as SurvivalKey
}

function filterRowsByGeo(
  rows: VatSurvivalRow[],
  region: RegionCode | null,
  province: ProvinceCode | null
): VatSurvivalRow[] {
  if (province) {
    return rows.filter((r) => r.p && String(r.p) === String(province))
  }
  if (region && region !== "1000") {
    return rows.filter((r) => r.r && String(r.r) === String(region))
  }
  return rows
}

function filterRowsBySector(rows: VatSurvivalRow[], nace1: string | null): VatSurvivalRow[] {
  if (!nace1) return rows
  return rows.filter((r) => r.n1 === nace1)
}

function aggregateStartersByYear(rows: VatSurvivalRow[]): YearPoint[] {
  const agg = new Map<number, number>()
  for (const r of rows) {
    if (typeof r.y !== "number" || typeof r.fr !== "number") continue
    agg.set(r.y, (agg.get(r.y) ?? 0) + r.fr)
  }
  return Array.from(agg.entries())
    .map(([y, v]) => ({ sortValue: y, periodCells: [y], value: v, label: String(y) }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function aggregateStoppersByYear(rows: VatSurvivalRow[], horizon: StopHorizon): YearPoint[] {
  const key = survivalKeyForHorizon(horizon)
  const agg = new Map<number, { fr: number; surv: number }>()
  for (const r of rows) {
    const surv = (r as Record<string, unknown>)[key] as number | null
    if (typeof r.y !== "number" || typeof r.fr !== "number" || typeof surv !== "number") continue
    const prev = agg.get(r.y) ?? { fr: 0, surv: 0 }
    prev.fr += r.fr
    prev.surv += surv
    agg.set(r.y, prev)
  }
  return Array.from(agg.entries())
    .map(([y, v]) => ({ sortValue: y, periodCells: [y], value: Math.max(0, v.fr - v.surv), label: String(y) }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function aggregateSurvivalRateByYear(rows: VatSurvivalRow[], horizon: StopHorizon): YearPoint[] {
  const key = survivalKeyForHorizon(horizon)
  const agg = new Map<number, { fr: number; surv: number }>()
  for (const r of rows) {
    const surv = (r as Record<string, unknown>)[key] as number | null
    if (typeof r.y !== "number" || typeof r.fr !== "number" || typeof surv !== "number") continue
    const prev = agg.get(r.y) ?? { fr: 0, surv: 0 }
    prev.fr += r.fr
    prev.surv += surv
    agg.set(r.y, prev)
  }
  return Array.from(agg.entries())
    .map(([y, v]) => ({
      sortValue: y,
      periodCells: [y],
      value: v.fr > 0 ? Math.round(((v.surv / v.fr) * 100) * 10) / 10 : 0,
      label: String(y),
    }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function aggregateByRegionForYear(
  rows: VatSurvivalRow[],
  year: number,
  valueFn: (r: VatSurvivalRow) => number | null
): RegionPoint[] {
  const agg = new Map<RegionCode, number>()
  for (const r of rows) {
    if (r.y !== year) continue
    if (!r.r) continue
    const code = String(r.r) as RegionCode
    const v = valueFn(r)
    if (typeof v !== "number" || !Number.isFinite(v)) continue
    agg.set(code, (agg.get(code) ?? 0) + v)
  }
  return Array.from(agg.entries())
    .map(([r, value]) => ({ r, value }))
    .sort((a, b) => a.r.localeCompare(b.r))
}

function aggregateByProvinceForYear(
  rows: VatSurvivalRow[],
  year: number,
  valueFn: (r: VatSurvivalRow) => number | null
): ProvincePoint[] {
  const agg = new Map<string, number>()
  for (const r of rows) {
    if (r.y !== year) continue
    if (!r.p) continue
    const code = String(r.p)
    const v = valueFn(r)
    if (typeof v !== "number" || !Number.isFinite(v)) continue
    agg.set(code, (agg.get(code) ?? 0) + v)
  }
  return Array.from(agg.entries())
    .map(([p, value]) => ({ p, value }))
    .sort((a, b) => a.p.localeCompare(b.p))
}

function formatInt(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

function formatPct(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 1 }).format(n) + "%"
}

interface StartersStoppersEmbedProps {
  section: SectionType
  viewType: ViewType
  horizon?: StopHorizon
  region?: RegionCode | null
  province?: ProvinceCode | null
  sector?: string | null
}

export function StartersStoppersEmbed({
  section,
  viewType,
  horizon = 1,
  region = null,
  province = null,
  sector = null,
}: StartersStoppersEmbedProps) {
  const allRows = useMemo(() => raw as VatSurvivalRow[], [])

  const filteredRows = useMemo(() => {
    const bySector = filterRowsBySector(allRows, sector)
    return filterRowsByGeo(bySector, region, province)
  }, [allRows, sector, region, province])

  // Compute the appropriate data series based on section
  const yearSeries = useMemo(() => {
    switch (section) {
      case "starters":
        return aggregateStartersByYear(filteredRows)
      case "stoppers":
        return aggregateStoppersByYear(filteredRows, horizon)
      case "survival":
        return aggregateSurvivalRateByYear(filteredRows, horizon)
    }
  }, [section, filteredRows, horizon])

  // Get the latest year for map data
  const latestYear = useMemo(() => {
    if (!yearSeries.length) return null
    return yearSeries[yearSeries.length - 1]?.sortValue ?? null
  }, [yearSeries])

  // Determine map level based on selection
  const mapLevel = province ? "province" : "region"

  // Compute map data
  const mapData = useMemo(() => {
    if (!latestYear) return []

    const mapRows = filterRowsBySector(allRows, sector)

    if (section === "starters") {
      const valueFn = (r: VatSurvivalRow) => (typeof r.fr === "number" ? r.fr : null)
      return mapLevel === "province"
        ? aggregateByProvinceForYear(mapRows, latestYear, valueFn)
        : aggregateByRegionForYear(mapRows, latestYear, valueFn)
    }

    if (section === "stoppers") {
      const key = survivalKeyForHorizon(horizon)
      const valueFn = (r: VatSurvivalRow) => {
        const surv = (r as Record<string, unknown>)[key] as number | null
        return typeof r.fr === "number" && typeof surv === "number" ? Math.max(0, r.fr - surv) : null
      }
      return mapLevel === "province"
        ? aggregateByProvinceForYear(mapRows, latestYear, valueFn)
        : aggregateByRegionForYear(mapRows, latestYear, valueFn)
    }

    // survival
    const key = survivalKeyForHorizon(horizon)
    if (mapLevel === "province") {
      const byProvince = new Map<string, { fr: number; surv: number }>()
      for (const r of mapRows) {
        if (r.y !== latestYear) continue
        if (!r.p) continue
        const surv = (r as Record<string, unknown>)[key] as number | null
        if (typeof r.fr !== "number" || typeof surv !== "number") continue
        const code = String(r.p)
        const prev = byProvince.get(code) ?? { fr: 0, surv: 0 }
        prev.fr += r.fr
        prev.surv += surv
        byProvince.set(code, prev)
      }
      return Array.from(byProvince.entries()).map(([p, v]) => ({
        p,
        value: v.fr > 0 ? Math.round(((v.surv / v.fr) * 100) * 10) / 10 : 0,
      }))
    } else {
      const byRegion = new Map<RegionCode, { fr: number; surv: number }>()
      for (const r of mapRows) {
        if (r.y !== latestYear) continue
        if (!r.r) continue
        const surv = (r as Record<string, unknown>)[key] as number | null
        if (typeof r.fr !== "number" || typeof surv !== "number") continue
        const code = String(r.r) as RegionCode
        const prev = byRegion.get(code) ?? { fr: 0, surv: 0 }
        prev.fr += r.fr
        prev.surv += surv
        byRegion.set(code, prev)
      }
      return Array.from(byRegion.entries()).map(([r, v]) => ({
        r,
        value: v.fr > 0 ? Math.round(((v.surv / v.fr) * 100) * 10) / 10 : 0,
      }))
    }
  }, [section, allRows, sector, latestYear, horizon, mapLevel])

  // Build title
  const title = useMemo(() => {
    const sectionTitle = section === "starters"
      ? "Aantal starters"
      : section === "stoppers"
        ? `Aantal stoppers (na ${horizon} jaar)`
        : `Overlevingskans na ${horizon} jaar`

    const locationParts: string[] = []
    if (province) {
      const prov = PROVINCES.find((p) => String(p.code) === String(province))
      if (prov) locationParts.push(prov.name)
    } else if (region && region !== "1000") {
      const reg = REGIONS.find((r) => String(r.code) === String(region))
      if (reg) locationParts.push(reg.name)
    }

    if (locationParts.length > 0) {
      return `${sectionTitle} - ${locationParts.join(", ")}`
    }
    return sectionTitle
  }, [section, horizon, province, region])

  const label = section === "survival" ? "Overlevingskans" : "Aantal"
  const formatValue = section === "survival" ? formatPct : formatInt

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {viewType === "chart" && (
        <FilterableChart
          data={yearSeries}
          getLabel={(d) => String((d as YearPoint).sortValue)}
          getValue={(d) => (d as YearPoint).value}
          getSortValue={(d) => (d as YearPoint).sortValue}
        />
      )}

      {viewType === "table" && (
        <FilterableTable data={yearSeries} label={label} periodHeaders={["Jaar"]} />
      )}

      {viewType === "map" && (
        <>
          {mapLevel === "province" ? (
            <ProvinceMap
              data={mapData as ProvincePoint[]}
              selectedRegion={region ?? "1000"}
              selectedProvince={province}
              getProvinceCode={(d) => (d as ProvincePoint).p}
              getMetricValue={(d) => (d as ProvincePoint).value}
              formatValue={formatValue}
            />
          ) : (
            <RegionMap
              data={mapData as RegionPoint[]}
              selectedRegion={region ?? "1000"}
              getRegionCode={(d) => (d as RegionPoint).r}
              getMetricValue={(d) => (d as RegionPoint).value}
              formatValue={formatValue}
            />
          )}
        </>
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
        {" · "}
        <span>Bron: Statbel</span>
      </div>
    </div>
  )
}
