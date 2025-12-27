"use client"

import * as React from "react"
import { Check, ChevronsUpDown, TrendingUp, TrendingDown, Building2, Users, Calendar, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { InteractiveMap } from "../shared/InteractiveMap"

// Import data
import monthlyConstruction from "../../../../analyses/faillissementen/results/monthly_construction.json"
import monthlyTotals from "../../../../analyses/faillissementen/results/monthly_totals.json"
import yearlyConstruction from "../../../../analyses/faillissementen/results/yearly_construction.json"
import yearlyTotals from "../../../../analyses/faillissementen/results/yearly_totals.json"
import yearlyBySector from "../../../../analyses/faillissementen/results/yearly_by_sector.json"
import yearlyBySectorProvince from "../../../../analyses/faillissementen/results/yearly_by_sector_province.json"
import provincesConstruction from "../../../../analyses/faillissementen/results/provinces_construction.json"
import provincesData from "../../../../analyses/faillissementen/results/provinces.json"
import monthlyProvincesConstruction from "../../../../analyses/faillissementen/results/monthly_provinces_construction.json"
import monthlyProvinces from "../../../../analyses/faillissementen/results/monthly_provinces.json"
import lookups from "../../../../analyses/faillissementen/results/lookups.json"
import metadata from "../../../../analyses/faillissementen/results/metadata.json"
import yearlyByDuration from "../../../../analyses/faillissementen/results/yearly_by_duration.json"
import yearlyByDurationConstruction from "../../../../analyses/faillissementen/results/yearly_by_duration_construction.json"
import yearlyByDurationProvinceConstruction from "../../../../analyses/faillissementen/results/yearly_by_duration_province_construction.json"
import yearlyByWorkers from "../../../../analyses/faillissementen/results/yearly_by_workers.json"
import yearlyByWorkersConstruction from "../../../../analyses/faillissementen/results/yearly_by_workers_construction.json"
import yearlyByWorkersProvinceConstruction from "../../../../analyses/faillissementen/results/yearly_by_workers_province_construction.json"

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

type YearlySectorProvinceRow = {
  y: number
  s: string
  p: string
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

type DurationProvinceRow = {
  y: number
  d: string
  ds: string
  do: number
  p: string
  n: number
  w: number
}

type WorkersRow = {
  y: number
  c: string
  n: number
  w: number
}

type WorkersProvinceRow = {
  y: number
  c: string
  p: string
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

// Lookup data structure with proper typing
interface Lookups {
  sectors: Sector[]
  provinces: Province[]
  years: number[]
}

// Type guard for validating lookups data
function isValidLookups(data: unknown): data is Lookups {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    Array.isArray(obj.sectors) &&
    obj.sectors.every((s: unknown) =>
      typeof s === 'object' && s !== null &&
      'code' in s && 'nl' in s
    ) &&
    Array.isArray(obj.provinces) &&
    obj.provinces.every((p: unknown) =>
      typeof p === 'object' && p !== null &&
      'code' in p && 'name' in p
    ) &&
    Array.isArray(obj.years) &&
    obj.years.every((y: unknown) => typeof y === 'number')
  )
}

// Type guards for runtime validation
function isMonthlyProvinceRow(item: unknown): item is MonthlyProvinceRow {
  return (
    typeof item === 'object' && item !== null &&
    'y' in item && typeof (item as MonthlyProvinceRow).y === 'number' &&
    'm' in item && typeof (item as MonthlyProvinceRow).m === 'number' &&
    'p' in item && typeof (item as MonthlyProvinceRow).p === 'string' &&
    'n' in item && typeof (item as MonthlyProvinceRow).n === 'number' &&
    'w' in item && typeof (item as MonthlyProvinceRow).w === 'number'
  )
}

function isMonthlyRow(item: unknown): item is MonthlyRow {
  return (
    typeof item === 'object' && item !== null &&
    'y' in item && typeof (item as MonthlyRow).y === 'number' &&
    'm' in item && typeof (item as MonthlyRow).m === 'number' &&
    'n' in item && typeof (item as MonthlyRow).n === 'number' &&
    'w' in item && typeof (item as MonthlyRow).w === 'number'
  )
}

function isYearlyRow(item: unknown): item is YearlyRow {
  return (
    typeof item === 'object' && item !== null &&
    'y' in item && typeof (item as YearlyRow).y === 'number' &&
    'n' in item && typeof (item as YearlyRow).n === 'number' &&
    'w' in item && typeof (item as YearlyRow).w === 'number'
  )
}

function isProvinceRow(item: unknown): item is ProvinceRow {
  return (
    typeof item === 'object' && item !== null &&
    'y' in item && typeof (item as ProvinceRow).y === 'number' &&
    'p' in item && typeof (item as ProvinceRow).p === 'string' &&
    'n' in item && typeof (item as ProvinceRow).n === 'number' &&
    'w' in item && typeof (item as ProvinceRow).w === 'number'
  )
}

// Utility function for safe array access with error handling
function safeArrayAccess<T>(
  data: unknown,
  arrayName: string,
  validator?: (item: unknown) => item is T
): { data: T[]; error: string | null } {
  try {
    if (!Array.isArray(data)) {
      const errorMsg = `${arrayName} is niet beschikbaar`
      console.error(`Data validation error: ${arrayName} is not an array`, data)
      return { data: [], error: errorMsg }
    }

    // If validator is provided, filter out invalid items
    if (validator) {
      const validData = data.filter(validator)
      if (validData.length !== data.length) {
        console.warn(`${arrayName}: ${data.length - validData.length} invalid items filtered out`)
      }
      return { data: validData, error: null }
    }

    return { data: data as T[], error: null }
  } catch (error) {
    const errorMsg = `Fout bij laden van ${arrayName}`
    console.error(`Error loading ${arrayName}:`, error)
    return { data: [], error: errorMsg }
  }
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"
]

const MONTH_NAMES_FULL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"
]

// Worker class order for sorting
// NOTE: Includes two variants for the largest class due to inconsistent naming in Statbel source data:
// - "1000 werknemers en meer" appears in all-sector data
// - "1000 en meer werknemers" appears in construction sector data
// This handles both variants during sorting without data normalization
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

function formatInt(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

function formatPct(n: number) {
  const sign = n >= 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

function useSectorOptions(): { sectors: Sector[]; error: string | null } {
  return React.useMemo(() => {
    if (isValidLookups(lookups)) {
      return { sectors: lookups.sectors, error: null }
    }
    const result = safeArrayAccess<Sector>(
      (lookups as Record<string, unknown>).sectors,
      'sectorgegevens'
    )
    return { sectors: result.data, error: result.error }
  }, [])
}

function useProvinceOptions(): { provinces: Province[]; error: string | null } {
  return React.useMemo(() => {
    if (isValidLookups(lookups)) {
      return { provinces: lookups.provinces, error: null }
    }
    const result = safeArrayAccess<Province>(
      (lookups as Record<string, unknown>).provinces,
      'provinciegegevens'
    )
    return { provinces: result.data, error: result.error }
  }, [])
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
  const { sectors, error } = useSectorOptions()

  const currentLabel = React.useMemo(() => {
    if (selected === "ALL") return "Alle sectoren"
    return sectors.find((s) => s.code === selected)?.nl ?? "Sector"
  }, [selected, sectors])

  if (error) {
    return (
      <Button variant="outline" size="sm" disabled className="h-9 gap-1 min-w-[140px]">
        <span className="truncate max-w-[180px]">Fout bij laden</span>
      </Button>
    )
  }

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
  const { provinces: provincesLookup, error } = useProvinceOptions()

  const currentLabel = React.useMemo(() => {
    if (!selected) return "Vlaanderen"
    return provincesLookup.find((p) => p.code === selected)?.name ?? "Provincie"
  }, [selected, provincesLookup])

  if (error) {
    return (
      <Button variant="outline" size="sm" disabled className="h-9 gap-1 min-w-[120px]">
        <span className="truncate max-w-[100px]">Fout bij laden</span>
      </Button>
    )
  }

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
function getMonthlyData(
  sector: string,
  provinceCode: string | null,
  months: number = 24
): { data: ChartPoint[]; error: string | null } {
  try {
    let data: MonthlyRow[]

    if (provinceCode) {
      // Filter by province using monthly province data
      const sourceData = sector === "ALL" ? monthlyProvinces : monthlyProvincesConstruction
      const validation = safeArrayAccess<MonthlyProvinceRow>(
        sourceData,
        'maandelijkse provinciegegevens',
        isMonthlyProvinceRow
      )

      if (validation.error) {
        return { data: [], error: validation.error }
      }

      const filtered = validation.data.filter((r) => r.p === provinceCode)
      data = filtered.map((r) => ({ y: r.y, m: r.m, n: r.n, w: r.w }))
    } else {
      const sourceData = sector === "ALL" ? monthlyTotals : monthlyConstruction
      const validation = safeArrayAccess<MonthlyRow>(
        sourceData,
        'maandelijkse gegevens',
        isMonthlyRow
      )

      if (validation.error) {
        return { data: [], error: validation.error }
      }

      data = validation.data
    }

    const chartData = data
      .map((r) => ({
        sortValue: r.y * 100 + r.m,
        periodCells: [`${MONTH_NAMES[r.m - 1]} ${r.y}`],
        value: r.n,
      }))
      .sort((a, b) => a.sortValue - b.sortValue)
      .slice(-months)

    return { data: chartData, error: null }
  } catch (error) {
    console.error("Error loading monthly data:", error)
    return { data: [], error: 'Fout bij laden van maandelijkse gegevens' }
  }
}

// Get yearly data for chart with province filter
function getYearlyData(
  sector: string,
  provinceCode: string | null
): { data: ChartPoint[]; error: string | null } {
  try {
    let data: YearlyRow[]

    if (provinceCode) {
      // Aggregate monthly province data to yearly
      const sourceData = sector === "ALL" ? monthlyProvinces : monthlyProvincesConstruction
      const validation = safeArrayAccess<MonthlyProvinceRow>(
        sourceData,
        'maandelijkse provinciegegevens',
        isMonthlyProvinceRow
      )

      if (validation.error) {
        return { data: [], error: validation.error }
      }

      const filtered = validation.data.filter((r) => r.p === provinceCode)
      const byYear = new Map<number, { n: number; w: number }>()
      for (const r of filtered) {
        const existing = byYear.get(r.y) ?? { n: 0, w: 0 }
        byYear.set(r.y, { n: existing.n + r.n, w: existing.w + r.w })
      }
      data = Array.from(byYear.entries()).map(([y, v]) => ({ y, n: v.n, w: v.w }))
    } else {
      const sourceData = sector === "ALL" ? yearlyTotals : yearlyConstruction
      const validation = safeArrayAccess<YearlyRow>(
        sourceData,
        'jaarlijkse gegevens',
        isYearlyRow
      )

      if (validation.error) {
        return { data: [], error: validation.error }
      }

      data = validation.data
    }

    const chartData = data
      .map((r) => ({
        sortValue: r.y,
        periodCells: [r.y],
        value: r.n,
      }))
      .sort((a, b) => a.sortValue - b.sortValue)

    return { data: chartData, error: null }
  } catch (error) {
    console.error("Error loading yearly data:", error)
    return { data: [], error: 'Fout bij laden van jaarlijkse gegevens' }
  }
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
  const { provinces: provincesLookup } = useProvinceOptions()
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

// Get all years province data for interactive map
function getAllYearsProvinceData(
  sector: string
): { data: { p: string; n: number; y: number }[]; error: string | null } {
  try {
    const sourceData = sector === "ALL" ? provincesData : provincesConstruction
    const validation = safeArrayAccess<ProvinceRow>(
      sourceData,
      'provinciegegevens',
      isProvinceRow
    )

    if (validation.error) {
      return { data: [], error: validation.error }
    }

    const mapData = validation.data.map((r) => ({
      p: r.p,
      n: r.n,
      y: r.y,
    }))

    return { data: mapData, error: null }
  } catch (error) {
    console.error("Error loading province data:", error)
    return { data: [], error: 'Fout bij laden van provinciegegevens' }
  }
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
  const years = isValidLookups(lookups) ? lookups.years : []

  const { data, error: dataError } = React.useMemo(() => {
    return timeRange === "monthly"
      ? getMonthlyData(sector, provinceCode, 36)
      : getYearlyData(sector, provinceCode)
  }, [sector, provinceCode, timeRange])

  // All years data for interactive map with time slider
  const { data: allYearsMapData, error: mapError } = React.useMemo(
    () => getAllYearsProvinceData(sector),
    [sector]
  )

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
              {dataError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Fout bij laden van gegevens</AlertTitle>
                  <AlertDescription>{dataError}</AlertDescription>
                </Alert>
              ) : (
                <FilterableChart
                  data={data}
                  getLabel={(d) => String((d as ChartPoint).periodCells[0])}
                  getValue={(d) => (d as ChartPoint).value}
                  getSortValue={(d) => (d as ChartPoint).sortValue}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
            </CardHeader>
            <CardContent>
              {dataError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Fout bij laden van gegevens</AlertTitle>
                  <AlertDescription>{dataError}</AlertDescription>
                </Alert>
              ) : (
                <FilterableTable
                  data={data}
                  label="Faillissementen"
                  periodHeaders={[timeRange === "monthly" ? "Maand" : "Jaar"]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>
                {sector === "ALL" ? "Alle sectoren" : "Bouwsector"} - Faillissementen per provincie
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mapError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Fout bij laden van kaartgegevens</AlertTitle>
                  <AlertDescription>{mapError}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <InteractiveMap
                    data={allYearsMapData}
                    level="province"
                    getGeoCode={(d) => d.p}
                    getValue={(d) => d.n}
                    getPeriod={(d) => d.y}
                    periods={years}
                    showTimeSlider={true}
                    selectedGeo={provinceCode}
                    onGeoSelect={(code) => onProvinceChange(code === provinceCode ? null : code)}
                    formatValue={formatInt}
                    tooltipLabel="Faillissementen"
                    regionFilter="2000"
                    height={500}
                  />
                  <div className="mt-3 text-xs text-muted-foreground">
                    Klik op een provincie om te filteren. Gebruik de tijdsslider om de evolutie te bekijken.
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Company duration section (bedrijfsleeftijd)
function DurationSection({
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
  const currentYear = metadata.max_year
  const [selectedYear, setSelectedYear] = React.useState(currentYear)
  const years = isValidLookups(lookups) ? lookups.years : []

  // Reset province filter when switching to "Alle sectoren" since we don't have all-sector province data
  React.useEffect(() => {
    if (sector === "ALL" && provinceCode) {
      onProvinceChange(null)
    }
  }, [sector, provinceCode, onProvinceChange])

  const data = React.useMemo(() => {
    let durationData: DurationRow[]

    // Province filter only available for construction sector
    if (provinceCode && sector === "F") {
      // Filter by province
      const provData = (yearlyByDurationProvinceConstruction as DurationProvinceRow[])
        .filter((r) => r.y === selectedYear && r.p === provinceCode)
      durationData = provData.map((r) => ({
        y: r.y,
        d: r.d,
        ds: r.ds,
        do: r.do,
        n: r.n,
        w: r.w,
      }))
    } else {
      // Use construction or all sectors data based on selection
      durationData = (sector === "F"
        ? (yearlyByDurationConstruction as DurationRow[])
        : (yearlyByDuration as DurationRow[])
      ).filter((r) => r.y === selectedYear)
    }

    return durationData.sort((a, b) => a.do - b.do)
  }, [selectedYear, provinceCode, sector])

  const totalBankruptcies = data.reduce((sum, r) => sum + r.n, 0)
  const youngCompanies = data.filter(r => r.do <= 4)
  const youngCompanyCount = youngCompanies.reduce((sum, r) => sum + r.n, 0)
  const youngCompanyPercent = totalBankruptcies > 0 ? (youngCompanyCount / totalBankruptcies) * 100 : 0

  const { sectors, error: sectorsError } = useSectorOptions()
  const sectorName = sector === "ALL"
    ? "Alle sectoren"
    : sectors.find((s) => s.code === sector)?.nl ?? "Onbekend"
  const sectorLabelNoun = sector === "ALL" ? "bedrijven" : "bouwbedrijven"
  const exportData = React.useMemo(
    () =>
      data.map((d) => ({
        label: d.ds,
        value: d.n,
        periodCells: [String(selectedYear), d.ds],
      })),
    [data, selectedYear]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leeftijd gefailleerde bedrijven</h2>
        <ExportButtons
          data={exportData}
          title={`Bedrijfsleeftijd faillissementen ${sectorName.toLowerCase()}`}
          slug="faillissementen"
          sectionId="leeftijd"
          viewType="table"
          periodHeaders={["Jaar", "Bedrijfsleeftijd"]}
          valueLabel="Faillissementen"
          dataSource="Statbel - Faillissementen"
          dataSourceUrl="https://statbel.fgov.be/nl/themas/ondernemingen/faillissementen"
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
        <SectorFilter selected={sector} onChange={onSectorChange} showAll />
        {sector === "F" && <ProvinceFilter selected={provinceCode} onChange={onProvinceChange} />}
        <YearFilter selected={selectedYear} onChange={setSelectedYear} years={years} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faillissementen {sectorName.toLowerCase()} naar bedrijfsleeftijd ({selectedYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.map((r) => {
              const widthPercent = totalBankruptcies > 0 ? (r.n / totalBankruptcies) * 100 : 0
              const isYoung = r.do <= 4 // < 5 jaar

              return (
                <div key={r.d} className={cn("py-2", isYoung && "bg-destructive/5 -mx-4 px-4 rounded")}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", isYoung && "text-destructive")}>{r.ds}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{formatInt(r.w)} werknemers</span>
                      <span className="font-bold min-w-[60px] text-right">{formatInt(r.n)}</span>
                      <span className="text-muted-foreground min-w-[50px] text-right">({widthPercent.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", isYoung ? "bg-destructive" : "bg-muted-foreground/30")}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            <p>Jonge bedrijven (&lt;5 jaar) zijn gemarkeerd. In {selectedYear} faalden {formatInt(youngCompanyCount)} jonge {sectorLabelNoun} ({youngCompanyPercent.toFixed(1)}% van totaal).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Workers count section (aantal werknemers)
function WorkersSection({
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
  const currentYear = metadata.max_year
  const [selectedYear, setSelectedYear] = React.useState(currentYear)
  const years = isValidLookups(lookups) ? lookups.years : []

  // Reset province filter when switching to "Alle sectoren" since we don't have all-sector province data
  React.useEffect(() => {
    if (sector === "ALL" && provinceCode) {
      onProvinceChange(null)
    }
  }, [sector, provinceCode, onProvinceChange])

  const data = React.useMemo(() => {
    let workersData: WorkersRow[]

    // Province filter only available for construction sector
    if (provinceCode && sector === "F") {
      // Filter by province
      const provData = (yearlyByWorkersProvinceConstruction as WorkersProvinceRow[])
        .filter((r) => r.y === selectedYear && r.p === provinceCode)
      // Aggregate by class
      const byClass = new Map<string, { n: number; w: number }>()
      for (const r of provData) {
        const existing = byClass.get(r.c) ?? { n: 0, w: 0 }
        byClass.set(r.c, { n: existing.n + r.n, w: existing.w + r.w })
      }
      workersData = Array.from(byClass.entries()).map(([c, v]) => ({
        y: selectedYear,
        c,
        n: v.n,
        w: v.w,
      }))
    } else {
      // Use construction or all sectors data based on selection
      workersData = (sector === "F"
        ? (yearlyByWorkersConstruction as WorkersRow[])
        : (yearlyByWorkers as WorkersRow[])
      ).filter((r) => r.y === selectedYear)
    }

    return workersData.sort((a, b) => {
      const aIdx = WORKER_CLASS_ORDER.indexOf(a.c)
      const bIdx = WORKER_CLASS_ORDER.indexOf(b.c)
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
    })
  }, [selectedYear, provinceCode, sector])

  const totalBankruptcies = data.reduce((sum, r) => sum + r.n, 0)
  const totalWorkers = data.reduce((sum, r) => sum + r.w, 0)
  const smallCompanies = data.filter(r => r.c === "0 - 4 werknemers")
  const smallCompanyCount = smallCompanies.reduce((sum, r) => sum + r.n, 0)
  const smallCompanyPercent = totalBankruptcies > 0 ? (smallCompanyCount / totalBankruptcies) * 100 : 0

  const { sectors, error: sectorsError } = useSectorOptions()
  const sectorName = sector === "ALL"
    ? "Alle sectoren"
    : sectors.find((s) => s.code === sector)?.nl ?? "Onbekend"
  const exportData = React.useMemo(
    () =>
      data.map((d) => ({
        label: d.c,
        value: d.n,
        periodCells: [String(selectedYear), d.c],
      })),
    [data, selectedYear]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bedrijfsgrootte</h2>
        <ExportButtons
          data={exportData}
          title={`Bedrijfsgrootte faillissementen ${sectorName.toLowerCase()}`}
          slug="faillissementen"
          sectionId="bedrijfsgrootte"
          viewType="table"
          periodHeaders={["Jaar", "Bedrijfsgrootte"]}
          valueLabel="Faillissementen"
          dataSource="Statbel - Faillissementen"
          dataSourceUrl="https://statbel.fgov.be/nl/themas/ondernemingen/faillissementen"
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
        <SectorFilter selected={sector} onChange={onSectorChange} showAll />
        {sector === "F" && <ProvinceFilter selected={provinceCode} onChange={onProvinceChange} />}
        <YearFilter selected={selectedYear} onChange={setSelectedYear} years={years} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faillissementen {sectorName.toLowerCase()} naar bedrijfsgrootte ({selectedYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.map((r) => {
              const widthPercent = totalBankruptcies > 0 ? (r.n / totalBankruptcies) * 100 : 0
              const isSmall = r.c === "0 - 4 werknemers"

              return (
                <div key={r.c} className={cn("py-2", isSmall && "bg-primary/5 -mx-4 px-4 rounded")}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", isSmall && "text-primary")}>{r.c}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{formatInt(r.w)} werknemers</span>
                      <span className="font-bold min-w-[60px] text-right">{formatInt(r.n)}</span>
                      <span className="text-muted-foreground min-w-[50px] text-right">({widthPercent.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", isSmall ? "bg-primary" : "bg-muted-foreground/30")}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            <p>In {selectedYear} waren {formatInt(smallCompanyCount)} faillissementen ({smallCompanyPercent.toFixed(1)}%) kleine bedrijven (0-4 werknemers). In totaal verloren {formatInt(totalWorkers)} werknemers hun job.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Sector comparison section
function SectorComparisonSection({
  provinceCode,
  onProvinceChange,
}: {
  provinceCode: string | null
  onProvinceChange: (code: string | null) => void
}) {
  const currentYear = metadata.max_year
  const [selectedYear, setSelectedYear] = React.useState(currentYear)
  const years = isValidLookups(lookups) ? lookups.years : []
  const { sectors, error: sectorsError } = useSectorOptions()

  const data = React.useMemo(() => {
    let sectorData: YearlySectorRow[]

    if (provinceCode) {
      // Filter by province using yearly sector province data
      const provData = (yearlyBySectorProvince as YearlySectorProvinceRow[])
        .filter((r) => r.y === selectedYear && r.p === provinceCode)
      // Aggregate to sector level
      const bySector = new Map<string, { n: number; w: number }>()
      for (const r of provData) {
        const existing = bySector.get(r.s) ?? { n: 0, w: 0 }
        bySector.set(r.s, { n: existing.n + r.n, w: existing.w + r.w })
      }
      sectorData = Array.from(bySector.entries()).map(([s, v]) => ({
        y: selectedYear,
        s,
        n: v.n,
        w: v.w,
      }))
    } else {
      sectorData = (yearlyBySector as YearlySectorRow[]).filter((r) => r.y === selectedYear)
    }

    return sectorData
      .map((r) => ({
        sector: r.s,
        name: sectors.find((s) => s.code === r.s)?.nl ?? r.s,
        n: r.n,
        w: r.w,
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 10)
  }, [selectedYear, sectors, provinceCode])

  const constructionData = data.find((d) => d.sector === "F")
  const constructionRank = data.findIndex((d) => d.sector === "F") + 1

  const exportData = React.useMemo(
    () =>
      data.map((d) => ({
        label: d.name,
        value: d.n,
        periodCells: [String(selectedYear), d.name],
      })),
    [data, selectedYear]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sectorvergelijking</h2>
        <ExportButtons
          data={exportData}
          title="Sectorvergelijking faillissementen"
          slug="faillissementen"
          sectionId="sectoren"
          viewType="table"
          periodHeaders={["Jaar", "Sector"]}
          valueLabel="Faillissementen"
          dataSource="Statbel - Faillissementen"
          dataSourceUrl="https://statbel.fgov.be/nl/themas/ondernemingen/faillissementen"
        />
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

      <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
        <ProvinceFilter selected={provinceCode} onChange={onProvinceChange} />
        <YearFilter selected={selectedYear} onChange={setSelectedYear} years={years} />
      </div>

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
    </div>
  )
}


// Main Dashboard Component
export function FaillissementenDashboard() {
  // Default to construction sector
  const [selectedSector, setSelectedSector] = React.useState<string>("F")
  const [selectedProvince, setSelectedProvince] = React.useState<string | null>(null)

  // Stabilize callbacks to prevent unnecessary re-renders
  const handleSectorChange = React.useCallback((code: string) => {
    setSelectedSector(code)
  }, [])

  const handleProvinceChange = React.useCallback((code: string | null) => {
    setSelectedProvince(code)
  }, [])

  return (
    <div className="space-y-10">
      <DashboardHeader />

      <SummaryCards sector={selectedSector} provinceCode={selectedProvince} />

      <EvolutionSection
        sector={selectedSector}
        provinceCode={selectedProvince}
        onSectorChange={handleSectorChange}
        onProvinceChange={handleProvinceChange}
      />

      <SectorComparisonSection
        provinceCode={selectedProvince}
        onProvinceChange={handleProvinceChange}
      />

      <DurationSection
        sector={selectedSector}
        provinceCode={selectedProvince}
        onSectorChange={handleSectorChange}
        onProvinceChange={handleProvinceChange}
      />

      <WorkersSection
        sector={selectedSector}
        provinceCode={selectedProvince}
        onSectorChange={handleSectorChange}
        onProvinceChange={handleProvinceChange}
      />
    </div>
  )
}
