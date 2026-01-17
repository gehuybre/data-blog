"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FilterableChart } from "../shared/FilterableChart"
import { FilterableTable } from "../shared/FilterableTable"
import { ExportButtons } from "../shared/ExportButtons"
import { GeoProvider, useGeo } from "../shared/GeoContext"
import { GeoFilterInline } from "../shared/GeoFilterInline"
import { REGIONS, type RegionCode } from "@/lib/geo-utils"
import { SECTOR_SHORT_LABELS } from "@/lib/sector-short-labels"

// Import data
import byAllData from "../../../../analyses/bouwondernemers/results/by_all.json"
import lookups from "../../../../analyses/bouwondernemers/results/lookups.json"

type DataRow = {
  y: number | null
  r: string | null
  s?: string | null
  g?: string | null
  a?: string | null
  v: number | null
}

type YearPoint = {
  sortValue: number
  periodCells: Array<string | number>
  value: number
}

type LineSeriesPoint = {
  year: number
  [key: string]: number
}

type TableRow = {
  sortValue: string | number
  periodCells: Array<string | number>
  [key: string]: number | string | Array<string | number>
}

type LookupItem = {
  code: string | number
  nl?: string
  en?: string
}

type Lookups = {
  nace?: LookupItem[]
  gender?: LookupItem[]
  age_range?: LookupItem[]
}

function stripSectorPrefix(code: string, label: string) {
  const trimmed = label.trim()
  if (!trimmed) return trimmed
  const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const prefixPattern = new RegExp(`^${escapedCode}\\s*[-–—:]?\\s+`, "i")
  return trimmed.replace(prefixPattern, "")
}

type SectorFilterInlineProps = {
  selected: string | null
  onChange: (code: string | null) => void
}

function SectorFilterInline({ selected, onChange }: SectorFilterInlineProps) {
  const [open, setOpen] = React.useState(false)
  const sectors = React.useMemo(() => {
    const sectorMap = new Map<string, string>()
    if (lookups && (lookups as Lookups).nace) {
      for (const item of (lookups as Lookups).nace!) {
        const code = String(item.code)
        const rawLabel = item.nl || item.en || code
        const overrideLabel = SECTOR_SHORT_LABELS[code]
        const label = overrideLabel ?? stripSectorPrefix(code, rawLabel) ?? code
        sectorMap.set(code, label)
      }
    }
    return Array.from(sectorMap.entries())
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "nl"))
  }, [])

  const selectedLabel = React.useMemo(() => {
    if (!selected) return "Alle sectoren"
    const sector = sectors.find((s) => s.code === selected)
    return sector ? sector.label : selected
  }, [selected, sectors])

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="h-9 gap-1 min-w-[140px]"
      >
        <span className="truncate max-w-[120px]">{selectedLabel}</span>
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-[300px] rounded-md border bg-popover p-0 shadow-md">
          <div className="max-h-[300px] overflow-auto p-1">
            <div
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              Alle sectoren
            </div>
            {sectors.map((sector) => (
              <div
                key={sector.code}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange(sector.code)
                  setOpen(false)
                }}
              >
                {sector.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type GenderFilterInlineProps = {
  selected: string | null
  onChange: (code: string | null) => void
}

function GenderFilterInline({ selected, onChange }: GenderFilterInlineProps) {
  const [open, setOpen] = React.useState(false)
  const genders = React.useMemo(() => {
    const genderMap = new Map<string, string>()
    if (lookups && (lookups as Lookups).gender) {
      for (const item of (lookups as Lookups).gender!) {
        const code = String(item.code)
        const label = item.nl || item.en || code
        genderMap.set(code, label)
      }
    }
    return Array.from(genderMap.entries())
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "nl"))
  }, [])

  const selectedLabel = React.useMemo(() => {
    if (!selected) return "Alle geslachten"
    const gender = genders.find((g) => g.code === selected)
    return gender ? gender.label : selected
  }, [selected, genders])

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="h-9 gap-1 min-w-[140px]"
      >
        <span className="truncate max-w-[120px]">{selectedLabel}</span>
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-[240px] rounded-md border bg-popover p-0 shadow-md">
          <div className="max-h-[300px] overflow-auto p-1">
            <div
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              Alle geslachten
            </div>
            {genders.map((gender) => (
              <div
                key={gender.code}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange(gender.code)
                  setOpen(false)
                }}
              >
                {gender.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type AgeFilterInlineProps = {
  selected: string | null
  onChange: (code: string | null) => void
}

function AgeFilterInline({ selected, onChange }: AgeFilterInlineProps) {
  const [open, setOpen] = React.useState(false)
  const ages = React.useMemo(() => {
    const ageMap = new Map<string, string>()
    if (lookups && (lookups as Lookups).age_range) {
      for (const item of (lookups as Lookups).age_range!) {
        const code = String(item.code)
        const label = item.nl || item.en || code
        ageMap.set(code, label)
      }
    }
    return Array.from(ageMap.entries())
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "nl"))
  }, [])

  const selectedLabel = React.useMemo(() => {
    if (!selected) return "Alle leeftijdsgroepen"
    const age = ages.find((a) => a.code === selected)
    return age ? age.label : selected
  }, [selected, ages])

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="h-9 gap-1 min-w-[160px]"
      >
        <span className="truncate max-w-[140px]">{selectedLabel}</span>
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-[260px] rounded-md border bg-popover p-0 shadow-md">
          <div className="max-h-[300px] overflow-auto p-1">
            <div
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              Alle leeftijdsgroepen
            </div>
            {ages.map((age) => (
              <div
                key={age.code}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange(age.code)
                  setOpen(false)
                }}
              >
                {age.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatInt(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

function filterRowsByRegion(rows: DataRow[], selectedRegion: RegionCode): DataRow[] {
  if (selectedRegion === "1000") return rows
  return rows.filter((r) => r.r && String(r.r) === String(selectedRegion))
}

function filterRowsBySector(rows: DataRow[], sector: string | null): DataRow[] {
  if (!sector) return rows
  return rows.filter((r) => r.s && String(r.s) === String(sector))
}

function filterRowsByGender(rows: DataRow[], gender: string | null): DataRow[] {
  if (!gender) return rows
  return rows.filter((r) => r.g && String(r.g) === String(gender))
}

function filterRowsByAge(rows: DataRow[], age: string | null): DataRow[] {
  if (!age) return rows
  return rows.filter((r) => r.a && String(r.a) === String(age))
}

type FilterParams = {
  selectedRegion: RegionCode
  selectedSector: string | null
  selectedGender: string | null
  selectedAge: string | null
}

function filterRowsByAll(rows: DataRow[], filters: FilterParams): DataRow[] {
  let filtered = filterRowsByRegion(rows, filters.selectedRegion)
  filtered = filterRowsBySector(filtered, filters.selectedSector)
  filtered = filterRowsByGender(filtered, filters.selectedGender)
  filtered = filterRowsByAge(filtered, filters.selectedAge)
  return filtered
}

  // Overview section: chart + table with geo + sector filters
function OverviewSection() {
  const { selectedRegion, selectedProvince, setSelectedRegion, setSelectedProvince } = useGeo()
  const [selectedSector, setSelectedSector] = React.useState<string | null>(null)
  const [selectedGender, setSelectedGender] = React.useState<string | null>(null)
  const [selectedAge, setSelectedAge] = React.useState<string | null>(null)
  const [displayMode, setDisplayMode] = React.useState<"absolute" | "relative">("absolute")
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")

  const data = React.useMemo(() => {
    const allRows = byAllData as DataRow[]
    const filtered = filterRowsByAll(allRows, {
      selectedRegion,
      selectedSector,
      selectedGender,
      selectedAge,
    })

    // Aggregate by year
    const agg = new Map<number, number>()
    for (const r of filtered) {
      if (typeof r.y !== "number" || typeof r.v !== "number") continue
      agg.set(r.y, (agg.get(r.y) ?? 0) + r.v)
    }

    const totalByYear = new Map<number, number>()
    if (displayMode === "relative") {
      // Calculate totals for all sectors, keeping other filters (gender/age) intact.
      const allFiltered = filterRowsByAge(
        filterRowsByGender(filterRowsByRegion(byAllData as DataRow[], selectedRegion), selectedGender),
        selectedAge
      )
      for (const r of allFiltered) {
        if (typeof r.y !== "number" || typeof r.v !== "number") continue
        totalByYear.set(r.y, (totalByYear.get(r.y) ?? 0) + r.v)
      }
    }

    return Array.from(agg.entries())
      .map(([y, v]) => {
        let value = v
        if (displayMode === "relative") {
          const total = totalByYear.get(y) ?? 0
          value = total > 0 ? (v / total) * 100 : 0
        }
        return {
          sortValue: y,
          periodCells: [y],
          value,
        }
      })
      .sort((a, b) => a.sortValue - b.sortValue)
  }, [selectedRegion, selectedSector, selectedGender, selectedAge, displayMode])

  const exportData = React.useMemo(
    () =>
      data.map((d) => ({
        label: String(d.sortValue),
        value: d.value,
        periodCells: d.periodCells,
      })),
    [data]
  )

  const valueLabel = displayMode === "absolute" ? "Aantal ondernemers" : "Percentage (%)"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Overzicht bouwondernemers</h2>
        <ExportButtons
          data={exportData}
          title="Overzicht bouwondernemers"
          slug="bouwondernemers"
          sectionId="overview"
          viewType={currentView}
          periodHeaders={["Jaar"]}
          valueLabel={valueLabel}
          dataSource="Statbel - Ondernemers Datalab"
          dataSourceUrl="https://statbel.fgov.be/nl/open-data/ondernemers-datalab"
        />
      </div>
      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <GeoFilterInline
              selectedRegion={selectedRegion}
              selectedProvince={selectedProvince}
              onSelectRegion={setSelectedRegion}
              onSelectProvince={setSelectedProvince}
            />
            <SectorFilterInline selected={selectedSector} onChange={setSelectedSector} />
            <GenderFilterInline selected={selectedGender} onChange={setSelectedGender} />
            <AgeFilterInline selected={selectedAge} onChange={setSelectedAge} />
            <Tabs value={displayMode} onValueChange={(v) => setDisplayMode(v as "absolute" | "relative")}>
              <TabsList className="h-9">
                <TabsTrigger value="absolute" className="text-xs px-3">
                  Abs
                </TabsTrigger>
                <TabsTrigger value="relative" className="text-xs px-3">
                  Rel
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Evolutie over de jaren</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableChart
                data={data}
                getLabel={(d) => String((d as YearPoint).sortValue)}
                getValue={(d) => (d as YearPoint).value}
                getSortValue={(d) => (d as YearPoint).sortValue}
                yAxisLabel={valueLabel}
                showMovingAverage={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableTable data={data} label={valueLabel} periodHeaders={["Jaar"]} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Time series section where lines = sectors
function BySectorSection() {
  const { selectedRegion, selectedProvince, setSelectedRegion, setSelectedProvince } = useGeo()
  const [selectedSector, setSelectedSector] = React.useState<string | null>(null)
  const [selectedGender, setSelectedGender] = React.useState<string | null>(null)
  const [selectedAge, setSelectedAge] = React.useState<string | null>(null)
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")

  const { chartData, tableData, series, legendKeys } = React.useMemo(() => {
    const allRows = byAllData as DataRow[]
    const filtered = filterRowsByAll(allRows, {
      selectedRegion,
      selectedSector: null,
      selectedGender,
      selectedAge,
    })

    // Group by year and sector
    const agg = new Map<string, number>() // key: "year-sector"
    for (const r of filtered) {
      if (typeof r.y !== "number" || typeof r.v !== "number" || !r.s) continue
      const key = `${r.y}-${r.s}`
      agg.set(key, (agg.get(key) ?? 0) + r.v)
    }

    // Build sector labels
    const sectorLabels = new Map<string, string>()
    if (lookups && (lookups as Lookups).nace) {
      for (const item of (lookups as Lookups).nace!) {
        const code = String(item.code)
        const rawLabel = item.nl || item.en || code
        const overrideLabel = SECTOR_SHORT_LABELS[code]
        const label = overrideLabel ?? stripSectorPrefix(code, rawLabel) ?? code
        sectorLabels.set(code, label)
      }
    }

    // Transform to line chart format
    const seriesKeys = new Set<string>()
    const dataByYear = new Map<number, Record<string, number>>()
    const sectorTotals = new Map<string, number>()
    for (const [key, value] of agg.entries()) {
      const [yearStr, sector] = key.split("-")
      const year = Number(yearStr)
      if (!dataByYear.has(year)) {
        dataByYear.set(year, {})
      }
      seriesKeys.add(sector)
      dataByYear.get(year)![sector] = value
      sectorTotals.set(sector, (sectorTotals.get(sector) ?? 0) + value)
    }

    const chartData: LineSeriesPoint[] = Array.from(dataByYear.entries())
      .map(([year, sectors]) => ({ year, ...sectors }))
      .sort((a, b) => a.year - b.year)

    // Table data: rows per sector, columns per year
    const years = Array.from(dataByYear.keys()).sort((a, b) => a - b)
    const sectors = Array.from(sectorLabels.keys()).sort()

    const tableData: TableRow[] = sectors.map((sector) => {
      const row: TableRow = {
        sortValue: sector,
        periodCells: [sectorLabels.get(sector) || sector],
      }
      for (const year of years) {
        row[`y${year}`] = dataByYear.get(year)?.[sector] ?? 0
      }
      return row
    })

    const series = Array.from(seriesKeys)
      .map((sector) => ({
        key: sector,
        label: sectorLabels.get(sector) || sector,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "nl"))

    const legendKeys = Array.from(sectorTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([sector]) => sector)

    return { chartData, tableData, series, legendKeys }
  }, [selectedRegion, selectedSector, selectedGender, selectedAge])

  const exportData = React.useMemo(() => {
    return tableData.map((row) => ({
      label: String(row.periodCells[0] || row.sortValue),
      value: 0, // Not used for multi-column export
      periodCells: row.periodCells,
      ...Object.fromEntries(
        Object.entries(row).filter(([key]) => key.startsWith('y'))
      ),
    }))
  }, [tableData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Per sector</h2>
        <ExportButtons
          data={exportData}
          title="Bouwondernemers per sector"
          slug="bouwondernemers"
          sectionId="by-sector"
          viewType={currentView}
          periodHeaders={["Sector"]}
          valueLabel="Aantal ondernemers"
          dataSource="Statbel - Ondernemers Datalab"
          dataSourceUrl="https://statbel.fgov.be/nl/open-data/ondernemers-datalab"
        />
      </div>
      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <GeoFilterInline
              selectedRegion={selectedRegion}
              selectedProvince={selectedProvince}
              onSelectRegion={setSelectedRegion}
              onSelectProvince={setSelectedProvince}
            />
            <SectorFilterInline selected={selectedSector} onChange={setSelectedSector} />
            <GenderFilterInline selected={selectedGender} onChange={setSelectedGender} />
            <AgeFilterInline selected={selectedAge} onChange={setSelectedAge} />
          </div>
        </div>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Evolutie per sector</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableChart
                data={chartData}
                getLabel={(d) => String((d as LineSeriesPoint).year)}
                getSortValue={(d) => (d as LineSeriesPoint).year}
                yAxisLabel="Aantal ondernemers"
                series={series}
                legendVisibleKeys={legendKeys}
                highlightSeriesKey={selectedSector}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data per sector</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableTable data={tableData} label="Sector" periodHeaders={["Sector"]} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Time series section where lines = genders
function ByGenderSection() {
  const { selectedRegion, selectedProvince, setSelectedRegion, setSelectedProvince } = useGeo()
  const [selectedSector, setSelectedSector] = React.useState<string | null>(null)
  const [selectedGender, setSelectedGender] = React.useState<string | null>(null)
  const [selectedAge, setSelectedAge] = React.useState<string | null>(null)
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")

  const { chartData, tableData, series } = React.useMemo(() => {
    const allRows = byAllData as DataRow[]
    const filtered = filterRowsByAll(allRows, {
      selectedRegion,
      selectedSector,
      selectedGender: null,
      selectedAge,
    })

    // Group by year and gender
    const agg = new Map<string, number>() // key: "year-gender"
    for (const r of filtered) {
      if (typeof r.y !== "number" || typeof r.v !== "number" || !r.g) continue
      const key = `${r.y}-${r.g}`
      agg.set(key, (agg.get(key) ?? 0) + r.v)
    }

    // Build gender labels
    const genderLabels = new Map<string, string>()
    if (lookups && (lookups as Lookups).gender) {
      for (const item of (lookups as Lookups).gender!) {
        const code = String(item.code)
        genderLabels.set(code, item.nl || item.en || code)
      }
    }

    // Transform to line chart format
    const seriesKeys = new Set<string>()
    const dataByYear = new Map<number, Record<string, number>>()
    for (const [key, value] of agg.entries()) {
      const [yearStr, gender] = key.split("-")
      const year = Number(yearStr)
      if (!dataByYear.has(year)) {
        dataByYear.set(year, {})
      }
      seriesKeys.add(gender)
      dataByYear.get(year)![gender] = value
    }

    const chartData: LineSeriesPoint[] = Array.from(dataByYear.entries())
      .map(([year, genders]) => ({ year, ...genders }))
      .sort((a, b) => a.year - b.year)

    // Table data
    const years = Array.from(dataByYear.keys()).sort((a, b) => a - b)
    const genderCodes = Array.from(genderLabels.keys()).sort()

    const tableData: TableRow[] = genderCodes.map((code) => {
      const label = genderLabels.get(code) || code
      const row: TableRow = {
        sortValue: code,
        periodCells: [label],
      }
      for (const year of years) {
        row[`y${year}`] = dataByYear.get(year)?.[code] ?? 0
      }
      return row
    })

    const series = Array.from(seriesKeys)
      .map((code) => ({
        key: code,
        label: genderLabels.get(code) || code,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "nl"))

    return { chartData, tableData, series }
  }, [selectedRegion, selectedSector, selectedGender, selectedAge])

  const exportData = React.useMemo(() => {
    return tableData.map((row) => ({
      label: String(row.periodCells[0] || row.sortValue),
      value: 0, // Not used for multi-column export
      periodCells: row.periodCells,
      ...Object.fromEntries(
        Object.entries(row).filter(([key]) => key.startsWith('y'))
      ),
    }))
  }, [tableData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Per geslacht</h2>
        <ExportButtons
          data={exportData}
          title="Bouwondernemers per geslacht"
          slug="bouwondernemers"
          sectionId="by-gender"
          viewType={currentView}
          periodHeaders={["Geslacht"]}
          valueLabel="Aantal ondernemers"
          dataSource="Statbel - Ondernemers Datalab"
          dataSourceUrl="https://statbel.fgov.be/nl/open-data/ondernemers-datalab"
        />
      </div>
      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <GeoFilterInline
              selectedRegion={selectedRegion}
              selectedProvince={selectedProvince}
              onSelectRegion={setSelectedRegion}
              onSelectProvince={setSelectedProvince}
            />
            <SectorFilterInline selected={selectedSector} onChange={setSelectedSector} />
            <GenderFilterInline selected={selectedGender} onChange={setSelectedGender} />
            <AgeFilterInline selected={selectedAge} onChange={setSelectedAge} />
          </div>
        </div>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Evolutie per geslacht</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableChart
                data={chartData}
                getLabel={(d) => String((d as LineSeriesPoint).year)}
                getSortValue={(d) => (d as LineSeriesPoint).year}
                yAxisLabel="Aantal ondernemers"
                series={series}
                highlightSeriesKey={selectedGender}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data per geslacht</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableTable data={tableData} label="Geslacht" periodHeaders={["Geslacht"]} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Time series section where lines = regions
function ByRegionSection() {
  const { selectedRegion, selectedProvince, setSelectedRegion, setSelectedProvince } = useGeo()
  const [selectedSector, setSelectedSector] = React.useState<string | null>(null)
  const [selectedGender, setSelectedGender] = React.useState<string | null>(null)
  const [selectedAge, setSelectedAge] = React.useState<string | null>(null)
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")

  const { chartData, tableData, series } = React.useMemo(() => {
    const allRows = byAllData as DataRow[]
    const filtered = filterRowsByAll(allRows, {
      selectedRegion: "1000",
      selectedSector,
      selectedGender,
      selectedAge,
    })

    // Group by year and region
    const agg = new Map<string, number>() // key: "year-region"
    for (const r of filtered) {
      if (typeof r.y !== "number" || typeof r.v !== "number" || !r.r) continue
      const key = `${r.y}-${r.r}`
      agg.set(key, (agg.get(key) ?? 0) + r.v)
    }

    // Build region labels
    const regionLabels = new Map<string, string>()
    for (const region of REGIONS) {
      if (region.code !== "1000") {
        regionLabels.set(String(region.code), region.name)
      }
    }

    // Transform to line chart format
    const seriesKeys = new Set<string>()
    const dataByYear = new Map<number, Record<string, number>>()
    for (const [key, value] of agg.entries()) {
      const [yearStr, regionCode] = key.split("-")
      const year = Number(yearStr)
      if (!dataByYear.has(year)) {
        dataByYear.set(year, {})
      }
      seriesKeys.add(regionCode)
      dataByYear.get(year)![regionCode] = value
    }

    const chartData: LineSeriesPoint[] = Array.from(dataByYear.entries())
      .map(([year, regions]) => ({ year, ...regions }))
      .sort((a, b) => a.year - b.year)

    // Table data
    const years = Array.from(dataByYear.keys()).sort((a, b) => a - b)
    const regionCodes = Array.from(regionLabels.keys()).sort()

    const tableData: TableRow[] = regionCodes.map((code) => {
      const label = regionLabels.get(code) || code
      const row: TableRow = {
        sortValue: code,
        periodCells: [label],
      }
      for (const year of years) {
        row[`y${year}`] = dataByYear.get(year)?.[code] ?? 0
      }
      return row
    })

    const series = Array.from(seriesKeys)
      .map((code) => ({
        key: code,
        label: regionLabels.get(code) || code,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "nl"))

    return { chartData, tableData, series }
  }, [selectedRegion, selectedSector, selectedGender, selectedAge])

  const exportData = React.useMemo(() => {
    return tableData.map((row) => ({
      label: String(row.periodCells[0] || row.sortValue),
      value: 0, // Not used for multi-column export
      periodCells: row.periodCells,
      ...Object.fromEntries(
        Object.entries(row).filter(([key]) => key.startsWith('y'))
      ),
    }))
  }, [tableData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Per regio</h2>
        <ExportButtons
          data={exportData}
          title="Bouwondernemers per regio"
          slug="bouwondernemers"
          sectionId="by-region"
          viewType={currentView}
          periodHeaders={["Regio"]}
          valueLabel="Aantal ondernemers"
          dataSource="Statbel - Ondernemers Datalab"
          dataSourceUrl="https://statbel.fgov.be/nl/open-data/ondernemers-datalab"
        />
      </div>
      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <GeoFilterInline
              selectedRegion={selectedRegion}
              selectedProvince={selectedProvince}
              onSelectRegion={setSelectedRegion}
              onSelectProvince={setSelectedProvince}
            />
            <SectorFilterInline selected={selectedSector} onChange={setSelectedSector} />
            <GenderFilterInline selected={selectedGender} onChange={setSelectedGender} />
            <AgeFilterInline selected={selectedAge} onChange={setSelectedAge} />
          </div>
        </div>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Evolutie per regio</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableChart
                data={chartData}
                getLabel={(d) => String((d as LineSeriesPoint).year)}
                getSortValue={(d) => (d as LineSeriesPoint).year}
                yAxisLabel="Aantal ondernemers"
                series={series}
                highlightSeriesKey={selectedRegion === "1000" ? null : selectedRegion}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data per regio</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableTable data={tableData} label="Regio" periodHeaders={["Regio"]} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Time series section where lines = age ranges
function ByAgeSection() {
  const { selectedRegion, selectedProvince, setSelectedRegion, setSelectedProvince } = useGeo()
  const [selectedSector, setSelectedSector] = React.useState<string | null>(null)
  const [selectedGender, setSelectedGender] = React.useState<string | null>(null)
  const [selectedAge, setSelectedAge] = React.useState<string | null>(null)
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")

  const { chartData, tableData, series } = React.useMemo(() => {
    const allRows = byAllData as DataRow[]
    const filtered = filterRowsByAll(allRows, {
      selectedRegion,
      selectedSector,
      selectedGender,
      selectedAge: null,
    })

    // Group by year and age range
    const agg = new Map<string, number>() // key: "year-age"
    for (const r of filtered) {
      if (typeof r.y !== "number" || typeof r.v !== "number" || !r.a) continue
      const key = `${r.y}-${r.a}`
      agg.set(key, (agg.get(key) ?? 0) + r.v)
    }

    // Build age labels
    const ageLabels = new Map<string, string>()
    const ageOrder = new Map<string, number>()
    if (lookups && (lookups as Lookups).age_range) {
      for (const [index, item] of (lookups as Lookups).age_range!.entries()) {
        const code = String(item.code)
        ageLabels.set(code, item.nl || item.en || code)
        ageOrder.set(code, index)
      }
    }

    // Transform to line chart format
    const seriesKeys = new Set<string>()
    const dataByYear = new Map<number, Record<string, number>>()
    for (const [key, value] of agg.entries()) {
      const [yearStr, age] = key.split("-")
      const year = Number(yearStr)
      if (!dataByYear.has(year)) {
        dataByYear.set(year, {})
      }
      seriesKeys.add(age)
      dataByYear.get(year)![age] = value
    }

    const chartData: LineSeriesPoint[] = Array.from(dataByYear.entries())
      .map(([year, ages]) => ({ year, ...ages }))
      .sort((a, b) => a.year - b.year)

    // Table data
    const years = Array.from(dataByYear.keys()).sort((a, b) => a - b)
    const ageCodes = Array.from(ageLabels.keys()).sort()

    const tableData: TableRow[] = ageCodes.map((code) => {
      const label = ageLabels.get(code) || code
      const row: TableRow = {
        sortValue: code,
        periodCells: [label],
      }
      for (const year of years) {
        row[`y${year}`] = dataByYear.get(year)?.[code] ?? 0
      }
      return row
    })

    const getAgeSortValue = (code: string, label?: string) => {
      const ordered = ageOrder.get(code)
      if (ordered !== undefined) return ordered
      const match = String(label ?? code).match(/\d+/)
      return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
    }

    const series = Array.from(seriesKeys)
      .map((code) => ({
        key: code,
        label: ageLabels.get(code) || code,
      }))
      .sort((a, b) => getAgeSortValue(a.key, a.label) - getAgeSortValue(b.key, b.label))

    return { chartData, tableData, series }
  }, [selectedRegion, selectedSector, selectedGender, selectedAge])

  const exportData = React.useMemo(() => {
    return tableData.map((row) => ({
      label: String(row.periodCells[0] || row.sortValue),
      value: 0, // Not used for multi-column export
      periodCells: row.periodCells,
      ...Object.fromEntries(
        Object.entries(row).filter(([key]) => key.startsWith('y'))
      ),
    }))
  }, [tableData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Per leeftijd</h2>
        <ExportButtons
          data={exportData}
          title="Bouwondernemers per leeftijd"
          slug="bouwondernemers"
          sectionId="by-age"
          viewType={currentView}
          periodHeaders={["Leeftijd"]}
          valueLabel="Aantal ondernemers"
          dataSource="Statbel - Ondernemers Datalab"
          dataSourceUrl="https://statbel.fgov.be/nl/open-data/ondernemers-datalab"
        />
      </div>
      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <GeoFilterInline
              selectedRegion={selectedRegion}
              selectedProvince={selectedProvince}
              onSelectRegion={setSelectedRegion}
              onSelectProvince={setSelectedProvince}
            />
            <SectorFilterInline selected={selectedSector} onChange={setSelectedSector} />
            <GenderFilterInline selected={selectedGender} onChange={setSelectedGender} />
            <AgeFilterInline selected={selectedAge} onChange={setSelectedAge} />
          </div>
        </div>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Evolutie per leeftijdscategorie</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableChart
                data={chartData}
                getLabel={(d) => String((d as LineSeriesPoint).year)}
                getSortValue={(d) => (d as LineSeriesPoint).year}
                yAxisLabel="Aantal ondernemers"
                series={series}
                highlightSeriesKey={selectedAge}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data per leeftijdscategorie</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableTable data={tableData} label="Leeftijd" periodHeaders={["Leeftijd"]} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InnerDashboard() {
  return (
    <div className="space-y-10">
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          Deze analyse toont het aantal zelfstandige ondernemers per sector in België.
          Gebruik de filters om de data te verfijnen per regio, sector, geslacht en leeftijd. De
          absolute/relatieve toggle toont het aantal ondernemers of hun percentage ten opzichte van alle
          sectoren.
        </p>
      </div>

      <OverviewSection />
      <BySectorSection />
      <ByGenderSection />
      <ByRegionSection />
      <ByAgeSection />
    </div>
  )
}

export function BouwondernemersDashboard() {
  return (
    <GeoProvider>
      <InnerDashboard />
    </GeoProvider>
  )
}
