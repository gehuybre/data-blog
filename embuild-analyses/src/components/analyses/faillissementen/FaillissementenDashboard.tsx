"use client"

import * as React from "react"
import { Check, ChevronsUpDown, TrendingUp, TrendingDown, Building2, Users, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { FilterableChart } from "../shared/FilterableChart"
import { FilterableTable } from "../shared/FilterableTable"
import { ExportButtons } from "../shared/ExportButtons"
import { ProvinceMap } from "../shared/ProvinceMap"

// Import data
import monthlyConstruction from "../../../../analyses/faillissementen/results/monthly_construction.json"
import monthlyTotals from "../../../../analyses/faillissementen/results/monthly_totals.json"
import yearlyConstruction from "../../../../analyses/faillissementen/results/yearly_construction.json"
import yearlyTotals from "../../../../analyses/faillissementen/results/yearly_totals.json"
import yearlyBySector from "../../../../analyses/faillissementen/results/yearly_by_sector.json"
import provincesConstruction from "../../../../analyses/faillissementen/results/provinces_construction.json"
import provincesData from "../../../../analyses/faillissementen/results/provinces.json"
import monthlyProvincesConstruction from "../../../../analyses/faillissementen/results/monthly_provinces_construction.json"
import monthlyProvinces from "../../../../analyses/faillissementen/results/monthly_provinces.json"
import lookups from "../../../../analyses/faillissementen/results/lookups.json"
import metadata from "../../../../analyses/faillissementen/results/metadata.json"

// Types
type MonthlyRow = {
  y: number
  m: number
  n: number
  w: number
}

type MonthlyProvinceRow = {
  y: number
  m: number
  p: string
  n: number
  w: number
}

type YearlyRow = {
  y: number
  n: number
  w: number
}

type YearlySectorRow = {
  y: number
  s: string
  n: number
  w: number
}

type ProvinceRow = {
  y: number
  p: string
  n: number
  w: number
}

type Sector = {
  code: string
  nl: string
}

type Province = {
  code: string
  name: string
}

type ChartPoint = {
  sortValue: number
  periodCells: Array<string | number>
  value: number
}

type ProvincePoint = {
  p: string
  value: number
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"
]

const MONTH_NAMES_FULL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"
]

function formatInt(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

function formatPct(n: number) {
  const sign = n >= 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

function useSectorOptions(): Sector[] {
  return (lookups as { sectors: Sector[] }).sectors ?? []
}

function useProvinceOptions(): Province[] {
  return (lookups as { provinces: Province[] }).provinces ?? []
}

// Sector filter dropdown
function SectorFilter({
  selected,
  onChange,
  showAll = false,
}: {
  selected: string
  onChange: (code: string) => void
  showAll?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const sectors = useSectorOptions()

  const currentLabel = React.useMemo(() => {
    if (selected === "ALL") return "Alle sectoren"
    return sectors.find((s) => s.code === selected)?.nl ?? "Sector"
  }, [selected, sectors])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" role="combobox" aria-expanded={open} className="h-9 gap-1 min-w-[140px]">
          <span className="truncate max-w-[180px]">{currentLabel}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Zoek sector..." />
          <CommandList>
            <CommandEmpty>Geen resultaat.</CommandEmpty>
            {showAll && (
              <CommandGroup heading="Totaal">
                <CommandItem
                  value="Alle sectoren"
                  onSelect={() => {
                    onChange("ALL")
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selected === "ALL" ? "opacity-100" : "opacity-0")} />
                  Alle sectoren
                </CommandItem>
              </CommandGroup>
            )}
            {showAll && <CommandSeparator />}
            <CommandGroup heading="Sectoren">
              {sectors.map((s) => (
                <CommandItem
                  key={s.code}
                  value={s.nl}
                  onSelect={() => {
                    onChange(s.code)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selected === s.code ? "opacity-100" : "opacity-0")} />
                  {s.nl}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Province filter dropdown
function ProvinceFilter({
  selected,
  onChange,
}: {
  selected: string | null
  onChange: (code: string | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const provincesLookup = useProvinceOptions()

  const currentLabel = React.useMemo(() => {
    if (!selected) return "Vlaanderen"
    return provincesLookup.find((p) => p.code === selected)?.name ?? "Provincie"
  }, [selected, provincesLookup])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" role="combobox" aria-expanded={open} className="h-9 gap-1 min-w-[120px]">
          <span className="truncate max-w-[100px]">{currentLabel}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup heading="Regio">
              <CommandItem
                value="Vlaanderen"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", !selected ? "opacity-100" : "opacity-0")} />
                Vlaanderen
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Provincie">
              {provincesLookup.map((p) => (
                <CommandItem
                  key={p.code}
                  value={p.name}
                  onSelect={() => {
                    onChange(p.code)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selected === p.code ? "opacity-100" : "opacity-0")} />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Year filter dropdown
function YearFilter({
  selected,
  onChange,
  years,
}: {
  selected: number
  onChange: (year: number) => void
  years: number[]
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1">
          <span>{selected}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[120px] p-0" align="end">
        <Command>
          <CommandList>
            <CommandGroup>
              {years.slice(-10).reverse().map((year) => (
                <CommandItem
                  key={year}
                  value={String(year)}
                  onSelect={() => {
                    onChange(year)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selected === year ? "opacity-100" : "opacity-0")} />
                  {year}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Get monthly data for chart with province filter
function getMonthlyData(sector: string, provinceCode: string | null, months: number = 24): ChartPoint[] {
  let data: MonthlyRow[]

  if (provinceCode) {
    // Filter by province using monthly province data
    const provData: MonthlyProvinceRow[] = sector === "ALL"
      ? (monthlyProvinces as MonthlyProvinceRow[])
      : (monthlyProvincesConstruction as MonthlyProvinceRow[])

    const filtered = provData.filter((r) => r.p === provinceCode)
    data = filtered.map((r) => ({ y: r.y, m: r.m, n: r.n, w: r.w }))
  } else {
    data = sector === "ALL"
      ? (monthlyTotals as MonthlyRow[])
      : (monthlyConstruction as MonthlyRow[])
  }

  return data
    .map((r) => ({
      sortValue: r.y * 100 + r.m,
      periodCells: [`${MONTH_NAMES[r.m - 1]} ${r.y}`],
      value: r.n,
    }))
    .sort((a, b) => a.sortValue - b.sortValue)
    .slice(-months)
}

// Get yearly data for chart with province filter
function getYearlyData(sector: string, provinceCode: string | null): ChartPoint[] {
  let data: YearlyRow[]

  if (provinceCode) {
    // Aggregate monthly province data to yearly
    const provData: MonthlyProvinceRow[] = sector === "ALL"
      ? (monthlyProvinces as MonthlyProvinceRow[])
      : (monthlyProvincesConstruction as MonthlyProvinceRow[])

    const filtered = provData.filter((r) => r.p === provinceCode)
    const byYear = new Map<number, { n: number; w: number }>()
    for (const r of filtered) {
      const existing = byYear.get(r.y) ?? { n: 0, w: 0 }
      byYear.set(r.y, { n: existing.n + r.n, w: existing.w + r.w })
    }
    data = Array.from(byYear.entries()).map(([y, v]) => ({ y, n: v.n, w: v.w }))
  } else {
    data = sector === "ALL"
      ? (yearlyTotals as YearlyRow[])
      : (yearlyConstruction as YearlyRow[])
  }

  return data
    .map((r) => ({
      sortValue: r.y,
      periodCells: [r.y],
      value: r.n,
    }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

// Get province map data
function getProvinceMapData(year: number, sector: string): ProvincePoint[] {
  const data: ProvinceRow[] = sector === "ALL"
    ? (provincesData as ProvinceRow[])
    : (provincesConstruction as ProvinceRow[])

  return data
    .filter((r) => r.y === year)
    .map((r) => ({
      p: r.p,
      value: r.n,
    }))
}

// Header with dynamic date
function DashboardHeader() {
  const currentYear = metadata.max_year
  const currentMonth = metadata.max_month

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Data tot {MONTH_NAMES_FULL[currentMonth - 1]} {currentYear}</span>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          Deze analyse toont de maandelijkse faillissementen in Vlaanderen, met focus op de bouwsector (NACE sectie F).
          De data wordt maandelijks bijgewerkt door Statbel, ongeveer 15 dagen na de referentiemaand.
        </p>
      </div>
    </div>
  )
}

// Summary cards with province filter
function SummaryCards({ sector, provinceCode }: { sector: string; provinceCode: string | null }) {
  const currentYear = metadata.max_year
  const currentMonth = metadata.max_month
  const prevYear = currentYear - 1
  const provincesLookup = useProvinceOptions()
  const provinceName = provinceCode
    ? provincesLookup.find((p) => p.code === provinceCode)?.name ?? "Provincie"
    : "Vlaanderen"

  // Get data based on province filter
  let monthlyData: MonthlyRow[]
  if (provinceCode) {
    const provData: MonthlyProvinceRow[] = sector === "ALL"
      ? (monthlyProvinces as MonthlyProvinceRow[])
      : (monthlyProvincesConstruction as MonthlyProvinceRow[])
    monthlyData = provData
      .filter((r) => r.p === provinceCode)
      .map((r) => ({ y: r.y, m: r.m, n: r.n, w: r.w }))
  } else {
    monthlyData = sector === "ALL"
      ? (monthlyTotals as MonthlyRow[])
      : (monthlyConstruction as MonthlyRow[])
  }

  const ytdCurrent = monthlyData
    .filter((r) => r.y === currentYear && r.m <= currentMonth)
    .reduce((sum, r) => sum + r.n, 0)

  const ytdCurrentWorkers = monthlyData
    .filter((r) => r.y === currentYear && r.m <= currentMonth)
    .reduce((sum, r) => sum + r.w, 0)

  const ytdPrev = monthlyData
    .filter((r) => r.y === prevYear && r.m <= currentMonth)
    .reduce((sum, r) => sum + r.n, 0)

  const ytdPrevWorkers = monthlyData
    .filter((r) => r.y === prevYear && r.m <= currentMonth)
    .reduce((sum, r) => sum + r.w, 0)

  const changePercent = ytdPrev > 0 ? ((ytdCurrent - ytdPrev) / ytdPrev) * 100 : 0
  const workersChangePercent = ytdPrevWorkers > 0 ? ((ytdCurrentWorkers - ytdPrevWorkers) / ytdPrevWorkers) * 100 : 0

  // Latest month data
  const latestMonth = monthlyData.find((r) => r.y === currentYear && r.m === currentMonth)
  const sameMonthPrevYear = monthlyData.find((r) => r.y === prevYear && r.m === currentMonth)
  const monthlyChange = latestMonth && sameMonthPrevYear && sameMonthPrevYear.n > 0
    ? ((latestMonth.n - sameMonthPrevYear.n) / sameMonthPrevYear.n) * 100
    : 0

  const sectorLabel = sector === "ALL" ? "alle sectoren" : "bouwsector"

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>YTD {currentYear}</span>
          </div>
          <div className="text-2xl font-bold">{formatInt(ytdCurrent)}</div>
          <div className={cn("text-sm flex items-center gap-1", changePercent >= 0 ? "text-red-600" : "text-green-600")}>
            {changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPct(changePercent)} vs {prevYear}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Werknemers YTD</span>
          </div>
          <div className="text-2xl font-bold">{formatInt(ytdCurrentWorkers)}</div>
          <div className={cn("text-sm flex items-center gap-1", workersChangePercent >= 0 ? "text-red-600" : "text-green-600")}>
            {workersChangePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPct(workersChangePercent)} vs {prevYear}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">
            {MONTH_NAMES_FULL[currentMonth - 1]} {currentYear}
          </div>
          <div className="text-2xl font-bold">{formatInt(latestMonth?.n ?? 0)}</div>
          <div className={cn("text-sm flex items-center gap-1", monthlyChange >= 0 ? "text-red-600" : "text-green-600")}>
            {monthlyChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPct(monthlyChange)} vs vorig jaar
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">Regio</div>
          <div className="text-xl font-bold">{provinceName}</div>
          <div className="text-sm text-muted-foreground">{sectorLabel}</div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main evolution section with province filter
function EvolutionSection({
  sector,
  provinceCode,
  onSectorChange,
  onProvinceChange,
}: {
  sector: string
  provinceCode: string | null
  onSectorChange: (code: string) => void
  onProvinceChange: (code: string | null) => void
}) {
  const [currentView, setCurrentView] = React.useState<"chart" | "table" | "map">("chart")
  const [timeRange, setTimeRange] = React.useState<"monthly" | "yearly">("monthly")
  const currentYear = metadata.max_year
  const [mapYear, setMapYear] = React.useState(currentYear)
  const years = (lookups as { years: number[] }).years ?? []

  const data = React.useMemo(() => {
    return timeRange === "monthly"
      ? getMonthlyData(sector, provinceCode, 36)
      : getYearlyData(sector, provinceCode)
  }, [sector, provinceCode, timeRange])

  const mapData = React.useMemo(() => getProvinceMapData(mapYear, sector), [mapYear, sector])

  const exportData = React.useMemo(
    () =>
      data.map((d) => ({
        label: String(d.periodCells[0]),
        value: d.value,
        periodCells: d.periodCells,
      })),
    [data]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Evolutie faillissementen</h2>
        <ExportButtons
          data={exportData}
          title="Evolutie faillissementen"
          slug="faillissementen"
          sectionId="evolutie"
          viewType={currentView === "map" ? "chart" : currentView}
          periodHeaders={[timeRange === "monthly" ? "Maand" : "Jaar"]}
          valueLabel="Faillissementen"
          dataSource="Statbel - Faillissementen"
          dataSourceUrl="https://statbel.fgov.be/nl/themas/ondernemingen/faillissementen"
        />
      </div>

      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table" | "map")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
            <TabsTrigger value="map">Kaart</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <SectorFilter selected={sector} onChange={onSectorChange} showAll />
            <ProvinceFilter selected={provinceCode} onChange={onProvinceChange} />
            {currentView !== "map" && (
              <>
                <Button
                  variant={timeRange === "monthly" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("monthly")}
                >
                  Maandelijks
                </Button>
                <Button
                  variant={timeRange === "yearly" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("yearly")}
                >
                  Jaarlijks
                </Button>
              </>
            )}
            {currentView === "map" && (
              <YearFilter selected={mapYear} onChange={setMapYear} years={years} />
            )}
          </div>
        </div>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>
                {sector === "ALL" ? "Alle sectoren" : "Bouwsector"} - {timeRange === "monthly" ? "maandelijkse" : "jaarlijkse"} faillissementen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableChart
                data={data}
                getLabel={(d) => String((d as ChartPoint).periodCells[0])}
                getValue={(d) => (d as ChartPoint).value}
                getSortValue={(d) => (d as ChartPoint).sortValue}
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
              <FilterableTable
                data={data}
                label="Faillissementen"
                periodHeaders={[timeRange === "monthly" ? "Maand" : "Jaar"]}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>
                {sector === "ALL" ? "Alle sectoren" : "Bouwsector"} - {mapYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProvinceMap
                data={mapData}
                selectedRegion="2000"
                selectedProvince={provinceCode}
                onSelectProvince={(pCode) => onProvinceChange(pCode === provinceCode ? null : pCode)}
                getProvinceCode={(d) => (d as ProvincePoint).p}
                getMetricValue={(d) => (d as ProvincePoint).value}
                formatValue={formatInt}
                tooltipLabel="Faillissementen"
              />
              <div className="mt-3 text-xs text-muted-foreground">
                Klik op een provincie om te filteren.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Sector comparison section
function SectorComparisonSection() {
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")
  const currentYear = metadata.max_year
  const [selectedYear, setSelectedYear] = React.useState(currentYear)
  const years = (lookups as { years: number[] }).years ?? []
  const sectors = useSectorOptions()

  const data = React.useMemo(() => {
    const sectorData = (yearlyBySector as YearlySectorRow[]).filter((r) => r.y === selectedYear)
    return sectorData
      .map((r) => ({
        sector: r.s,
        name: sectors.find((s) => s.code === r.s)?.nl ?? r.s,
        n: r.n,
        w: r.w,
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 10)
  }, [selectedYear, sectors])

  const constructionData = data.find((d) => d.sector === "F")
  const constructionRank = data.findIndex((d) => d.sector === "F") + 1

  const chartData = React.useMemo(() => {
    return data.map((r, i) => ({
      sortValue: i,
      periodCells: [r.name],
      value: r.n,
    }))
  }, [data])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sectorvergelijking</h2>
      </div>

      {constructionData && (
        <Card className="border-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Bouwsector (rang #{constructionRank} in {selectedYear})</div>
                <div className="text-2xl font-bold">{formatInt(constructionData.n)} faillissementen</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Getroffen werknemers</div>
                <div className="text-xl font-bold">{formatInt(constructionData.w)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>
          <YearFilter selected={selectedYear} onChange={setSelectedYear} years={years} />
        </div>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 sectoren met meeste faillissementen ({selectedYear})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.map((r, i) => {
                  const isConstruction = r.sector === "F"
                  const maxValue = data[0]?.n ?? 1
                  const widthPercent = (r.n / maxValue) * 100

                  return (
                    <div key={r.sector} className={cn("py-2", isConstruction && "bg-primary/5 -mx-4 px-4 rounded")}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-muted-foreground">{i + 1}.</span>
                          <span className={cn("font-medium", isConstruction && "text-primary")}>{r.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{formatInt(r.w)} werknemers</span>
                          <span className="font-bold min-w-[60px] text-right">{formatInt(r.n)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", isConstruction ? "bg-primary" : "bg-muted-foreground/30")}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data per sector ({selectedYear})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.map((r, i) => (
                  <div key={r.sector} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-muted-foreground">{i + 1}.</span>
                      <span className="font-medium">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{formatInt(r.w)} werknemers</span>
                      <span className="font-bold min-w-[60px] text-right">{formatInt(r.n)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Long-term trend section - now a full section
function TrendSection({
  provinceCode,
  onProvinceChange,
}: {
  provinceCode: string | null
  onProvinceChange: (code: string | null) => void
}) {
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")
  const years = (lookups as { years: number[] }).years ?? []

  const yearlyData = React.useMemo(() => getYearlyData("F", provinceCode), [provinceCode])
  const yearlyAllData = React.useMemo(() => getYearlyData("ALL", provinceCode), [provinceCode])

  // Calculate construction share over time
  const shareData = React.useMemo(() => {
    const constructionByYear = new Map(yearlyData.map((r) => [r.periodCells[0], r.value]))
    const totalByYear = new Map(yearlyAllData.map((r) => [r.periodCells[0], r.value]))

    return Array.from(constructionByYear.entries())
      .map(([year, construction]) => {
        const total = totalByYear.get(year) ?? 1
        return {
          sortValue: year as number,
          periodCells: [year],
          value: (construction / (total as number)) * 100,
        }
      })
      .sort((a, b) => a.sortValue - b.sortValue)
  }, [yearlyData, yearlyAllData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Langjarige trend bouwsector</h2>
      </div>

      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>
          <ProvinceFilter selected={provinceCode} onChange={onProvinceChange} />
        </div>
        <TabsContent value="chart">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Faillissementen bouwsector (2005-heden)</CardTitle>
              </CardHeader>
              <CardContent>
                <FilterableChart
                  data={yearlyData}
                  getLabel={(d) => String((d as ChartPoint).periodCells[0])}
                  getValue={(d) => (d as ChartPoint).value}
                  getSortValue={(d) => (d as ChartPoint).sortValue}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aandeel bouwsector in totaal (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <FilterableChart
                  data={shareData}
                  getLabel={(d) => String((d as ChartPoint).periodCells[0])}
                  getValue={(d) => (d as ChartPoint).value}
                  getSortValue={(d) => (d as ChartPoint).sortValue}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data bouwsector</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableTable
                data={yearlyData}
                label="Faillissementen"
                periodHeaders={["Jaar"]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Main Dashboard Component
export function FaillissementenDashboard() {
  // Default to construction sector
  const [selectedSector, setSelectedSector] = React.useState<string>("F")
  const [selectedProvince, setSelectedProvince] = React.useState<string | null>(null)

  return (
    <div className="space-y-10">
      <DashboardHeader />

      <SummaryCards sector={selectedSector} provinceCode={selectedProvince} />

      <EvolutionSection
        sector={selectedSector}
        provinceCode={selectedProvince}
        onSectorChange={setSelectedSector}
        onProvinceChange={setSelectedProvince}
      />

      <SectorComparisonSection />

      <TrendSection
        provinceCode={selectedProvince}
        onProvinceChange={setSelectedProvince}
      />
    </div>
  )
}
