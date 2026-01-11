"use client"

import { useMemo } from "react"
import { FilterableChart } from "../shared/FilterableChart"
import { FilterableTable } from "../shared/FilterableTable"
import { getBasePath } from "@/lib/path-utils"

import monthlyConstruction from "../../../../analyses/faillissementen/results/monthly_construction.json"
import monthlyTotals from "../../../../analyses/faillissementen/results/monthly_totals.json"
import yearlyConstruction from "../../../../analyses/faillissementen/results/yearly_construction.json"
import yearlyTotals from "../../../../analyses/faillissementen/results/yearly_totals.json"
import yearlyByDuration from "../../../../analyses/faillissementen/results/yearly_by_duration.json"
import yearlyByDurationConstruction from "../../../../analyses/faillissementen/results/yearly_by_duration_construction.json"
import yearlyByWorkers from "../../../../analyses/faillissementen/results/yearly_by_workers.json"
import yearlyByWorkersConstruction from "../../../../analyses/faillissementen/results/yearly_by_workers_construction.json"
import yearlyBySector from "../../../../analyses/faillissementen/results/yearly_by_sector.json"
import lookups from "../../../../analyses/faillissementen/results/lookups.json"
import metadata from "../../../../analyses/faillissementen/results/metadata.json"

type MonthlyRow = {
  y: number
  m: number
  n: number
  w: number
}

type YearlyRow = {
  y: number
  n: number
  w: number
}

type DurationRow = {
  y: number
  d: string
  ds: string
  do: number
  n: number
  w: number
}

type WorkersRow = {
  y: number
  c: string
  n: number
  w: number
}

type YearlySectorRow = {
  y: number
  s: string
  n: number
  w: number
}

type Sector = {
  code: string
  nl: string
}

type ChartPoint = {
  sortValue: number
  periodCells: Array<string | number>
  value: number
}

type SectionType = "evolutie" | "leeftijd" | "bedrijfsgrootte" | "sectoren"
type ViewType = "chart" | "table"

const MONTH_NAMES = [
  "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"
]

const WORKER_CLASS_ORDER = [
  "0 - 4 werknemers",
  "5 - 9 werknemers",
  "10 - 19 werknemers",
  "20 - 49 werknemers",
  "50 - 99 werknemers",
  "100 - 199 werknemers",
  "200 - 249 werknemers",
  "250 - 499 werknemers",
  "500 - 999 werknemers",
  "1000 werknemers en meer",
  "1000 en meer werknemers",
]

function getMonthlyData(sector: string, months: number = 24): ChartPoint[] {
  const data = sector === "ALL"
    ? (monthlyTotals as MonthlyRow[])
    : (monthlyConstruction as MonthlyRow[])

  return data
    .map((r) => ({
      sortValue: r.y * 100 + r.m,
      periodCells: [`${MONTH_NAMES[r.m - 1]} ${r.y}`],
      value: r.n,
    }))
    .sort((a, b) => a.sortValue - b.sortValue)
    .slice(-months)
}

function getYearlyData(sector: string): ChartPoint[] {
  const data = sector === "ALL"
    ? (yearlyTotals as YearlyRow[])
    : (yearlyConstruction as YearlyRow[])

  return data
    .map((r) => ({
      sortValue: r.y,
      periodCells: [r.y],
      value: r.n,
    }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function getDurationData(sector: string, year: number): Array<{ label: string; value: number; sortValue: number }> {
  const data = (sector === "F"
    ? (yearlyByDurationConstruction as DurationRow[])
    : (yearlyByDuration as DurationRow[])
  ).filter((r) => r.y === year)

  return data
    .map((r) => ({
      label: r.ds,
      value: r.n,
      sortValue: r.do,
    }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function getWorkersData(sector: string, year: number): Array<{ label: string; value: number; sortValue: number }> {
  const data = (sector === "F"
    ? (yearlyByWorkersConstruction as WorkersRow[])
    : (yearlyByWorkers as WorkersRow[])
  ).filter((r) => r.y === year)

  return data
    .map((r) => {
      const idx = WORKER_CLASS_ORDER.indexOf(r.c)
      return {
        label: r.c,
        value: r.n,
        sortValue: idx === -1 ? 999 : idx,
      }
    })
    .sort((a, b) => a.sortValue - b.sortValue)
}

function getSectorData(year: number): Array<{ label: string; value: number; sector: string }> {
  const sectors = (lookups as { sectors: Sector[] }).sectors ?? []
  const data = (yearlyBySector as YearlySectorRow[]).filter((r) => r.y === year)

  return data
    .map((r) => ({
      sector: r.s,
      label: sectors.find((s) => s.code === r.s)?.nl ?? r.s,
      value: r.n,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
}

interface FaillissementenEmbedProps {
  section: SectionType
  viewType: ViewType
  sector?: string
  year?: number
  timeRange?: "monthly" | "yearly"
}

export function FaillissementenEmbed({
  section,
  viewType,
  sector = "F",
  year = metadata.max_year,
  timeRange = "monthly",
}: FaillissementenEmbedProps) {
  const data = useMemo(() => {
    switch (section) {
      case "evolutie":
        return timeRange === "monthly" ? getMonthlyData(sector, 36) : getYearlyData(sector)
      case "leeftijd":
        return getDurationData(sector, year).map((d) => ({
          sortValue: d.sortValue,
          periodCells: [d.label],
          value: d.value,
        }))
      case "bedrijfsgrootte":
        return getWorkersData(sector, year).map((d) => ({
          sortValue: d.sortValue,
          periodCells: [d.label],
          value: d.value,
        }))
      case "sectoren":
        return getSectorData(year).map((d, i) => ({
          sortValue: i,
          periodCells: [d.label],
          value: d.value,
        }))
    }
  }, [section, sector, year, timeRange])

  const title = useMemo(() => {
    switch (section) {
      case "evolutie":
        return sector === "ALL"
          ? `Evolutie faillissementen - ${timeRange === "monthly" ? "maandelijks" : "jaarlijks"}`
          : `Evolutie bouwsector - ${timeRange === "monthly" ? "maandelijks" : "jaarlijks"}`
      case "leeftijd":
        return "Bedrijfsleeftijd gefailleerde bedrijven"
      case "bedrijfsgrootte":
        return "Bedrijfsgrootte gefailleerde bedrijven"
      case "sectoren":
        return "Top 10 sectoren met meeste faillissementen"
    }
  }, [section, sector, timeRange])

  const periodHeaders = section === "evolutie" && timeRange === "monthly" ? ["Maand"] : ["Categorie"]

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {viewType === "chart" && section === "evolutie" && (
        <FilterableChart
          data={data}
          getLabel={(d) => String((d as ChartPoint).periodCells[0])}
          getValue={(d) => (d as ChartPoint).value}
          getSortValue={(d) => (d as ChartPoint).sortValue}
        />
      )}

      {viewType === "chart" && section !== "evolutie" && (
        <div className="p-8 text-center text-muted-foreground">
          <p>Grafiekweergave is alleen beschikbaar voor de evolutie-sectie.</p>
          <p className="text-sm mt-2">Schakel over naar tabelweergave om de data te bekijken.</p>
        </div>
      )}

      {viewType === "table" && (
        <FilterableTable data={data} label="Faillissementen" periodHeaders={periodHeaders} />
      )}

      <div className="mt-4 text-xs text-muted-foreground text-center">
        <a
          href={typeof window !== "undefined" ? window.location.origin + getBasePath() : "#"}
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
