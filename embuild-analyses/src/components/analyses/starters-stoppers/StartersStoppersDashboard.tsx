"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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
import { PROVINCES, ProvinceCode, REGIONS, RegionCode } from "@/lib/geo-utils"
import { GeoProvider, useGeo } from "../shared/GeoContext"
import { GeoFilter } from "../shared/GeoFilter"
import { FilterableChart } from "../shared/FilterableChart"
import { FilterableTable } from "../shared/FilterableTable"
import { RegionMap } from "../shared/RegionMap"

import raw from "../../../../analyses/starters-stoppers/results/vat_survivals.json"
import lookups from "../../../../analyses/starters-stoppers/results/lookups.json"

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
}

type RegionPoint = {
  r: RegionCode
  value: number
}

function formatInt(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

function formatPct(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 1 }).format(n) + "%"
}

function useNaceMainOptions() {
  const items: Array<{ code: string; label: string }> =
    (lookups as any)?.nace_lvl1?.map((d: any) => ({
      code: String(d.code),
      label: `${String(d.code)} — ${d.nl ?? d.en ?? ""}`.trim(),
    })) ?? []
  items.sort((a, b) => a.label.localeCompare(b.label, "nl"))
  return items
}

function SectorFilter({
  selected,
  onChange,
}: {
  selected: string | null
  onChange: (code: string | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const options = useNaceMainOptions()

  const selectedLabel = React.useMemo(() => {
    if (!selected) return "Alle sectoren"
    return options.find((o) => o.code === selected)?.label ?? selected
  }, [selected, options])

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-card text-card-foreground shadow-sm border-blue-500">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Economische sector</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
              <span className="truncate">{selectedLabel}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Zoek sector (NACE hoofdcode)..." />
              <CommandList>
                <CommandEmpty>Geen resultaat gevonden.</CommandEmpty>
                <CommandGroup heading="Sector">
                  <CommandItem
                    value="Alle sectoren"
                    onSelect={() => {
                      onChange(null)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", !selected ? "opacity-100" : "opacity-0")} />
                    Alle sectoren
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="NACE hoofdcode">
                  {options.map((o) => (
                    <CommandItem
                      key={o.code}
                      value={o.label}
                      onSelect={() => {
                        onChange(o.code)
                        setOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selected === o.code ? "opacity-100" : "opacity-0")} />
                      {o.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function filterRowsByGeo(rows: VatSurvivalRow[], level: string, selectedRegion: RegionCode, selectedProvince: ProvinceCode | null) {
  if (level === "province" && selectedProvince) {
    return rows.filter((r) => r.p && String(r.p) === String(selectedProvince))
  }
  if (level === "region" && selectedRegion !== "1000") {
    return rows.filter((r) => r.r && String(r.r) === String(selectedRegion))
  }
  return rows
}

function filterRowsBySector(rows: VatSurvivalRow[], nace1: string | null) {
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
    .map(([y, v]) => ({ sortValue: y, periodCells: [y], value: v }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

type StopHorizon = 1 | 2 | 3 | 4 | 5
type SurvivalKey = "s1" | "s2" | "s3" | "s4" | "s5"

function survivalKeyForHorizon(h: StopHorizon): SurvivalKey {
  return `s${h}` as SurvivalKey
}

function aggregateStoppersByYear(rows: VatSurvivalRow[], horizon: StopHorizon): YearPoint[] {
  const key = survivalKeyForHorizon(horizon)
  const agg = new Map<number, { fr: number; surv: number }>()
  for (const r of rows) {
    const surv = (r as any)[key]
    if (typeof r.y !== "number" || typeof r.fr !== "number" || typeof surv !== "number") continue
    const prev = agg.get(r.y) ?? { fr: 0, surv: 0 }
    prev.fr += r.fr
    prev.surv += surv
    agg.set(r.y, prev)
  }
  return Array.from(agg.entries())
    .map(([y, v]) => ({ sortValue: y, periodCells: [y], value: Math.max(0, v.fr - v.surv) }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function aggregateSurvivalRateByYear(rows: VatSurvivalRow[], yearKey: "s1" | "s2" | "s3" | "s4" | "s5"): YearPoint[] {
  const agg = new Map<number, { fr: number; surv: number }>()
  for (const r of rows) {
    const surv = (r as any)[yearKey]
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
    }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function aggregateByRegionForYear(rows: VatSurvivalRow[], year: number, valueFn: (r: VatSurvivalRow) => number | null): RegionPoint[] {
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

function MetricSection({
  title,
  label,
  yearSeries,
  mapData,
  mapYear,
  formatValue,
  selectedRegion,
  onSelectRegion,
}: {
  title: string
  label: string
  yearSeries: YearPoint[]
  mapData: RegionPoint[]
  mapYear: number | null
  formatValue: (v: number) => string
  selectedRegion: RegionCode
  onSelectRegion: (code: RegionCode) => void
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Grafiek</TabsTrigger>
          <TabsTrigger value="table">Tabel</TabsTrigger>
          <TabsTrigger value="map">Kaart</TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Evolutie</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableChart
                data={yearSeries}
                getLabel={(d) => String((d as any).sortValue)}
                getValue={(d) => (d as any).value}
                getSortValue={(d) => (d as any).sortValue}
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
              <FilterableTable data={yearSeries} label={label} periodHeaders={["Jaar"]} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>{mapYear ? `Verdeling per regio (${mapYear})` : "Verdeling per regio"}</CardTitle>
            </CardHeader>
            <CardContent>
              <RegionMap
                data={mapData}
                selectedRegion={selectedRegion}
                onSelectRegion={onSelectRegion}
                getRegionCode={(d) => (d as any).r}
                getMetricValue={(d) => (d as any).value}
                formatValue={formatValue}
              />
              <div className="mt-3 text-xs text-muted-foreground">
                Klik op een regio om de regiofilter te zetten (België kiezen kan via de locatie-filter bovenaan).
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InnerDashboard() {
  const { level, selectedRegion, setSelectedRegion, selectedProvince, setSelectedProvince, setSelectedMunicipality, setLevel } = useGeo()

  const [selectedNace1, setSelectedNace1] = React.useState<string | null>(null)
  const [stopHorizon, setStopHorizon] = React.useState<StopHorizon>(1)

  const allRows = React.useMemo(() => raw as VatSurvivalRow[], [])

  const filteredRows = React.useMemo(() => {
    const bySector = filterRowsBySector(allRows, selectedNace1)
    return filterRowsByGeo(bySector, level, selectedRegion, selectedProvince)
  }, [allRows, selectedNace1, level, selectedRegion, selectedProvince])

  const startersSeries = React.useMemo(() => aggregateStartersByYear(filteredRows), [filteredRows])
  const stoppersSeries = React.useMemo(() => aggregateStoppersByYear(filteredRows, stopHorizon), [filteredRows, stopHorizon])
  const survivalSeries = React.useMemo(
    () => aggregateSurvivalRateByYear(filteredRows, survivalKeyForHorizon(stopHorizon)),
    [filteredRows, stopHorizon]
  )

  const mapRows = React.useMemo(() => filterRowsBySector(allRows, selectedNace1), [allRows, selectedNace1])

  function latestYear(series: YearPoint[]): number | null {
    if (!series.length) return null
    return series[series.length - 1]?.sortValue ?? null
  }

  const startersMapYear = latestYear(startersSeries)
  const stoppersMapYear = latestYear(stoppersSeries)
  const survivalMapYear = latestYear(survivalSeries)

  const startersMap = React.useMemo(() => {
    if (!startersMapYear) return []
    return aggregateByRegionForYear(mapRows, startersMapYear, (r) => (typeof r.fr === "number" ? r.fr : null))
  }, [mapRows, startersMapYear])

  const stoppersMap = React.useMemo(() => {
    if (!stoppersMapYear) return []
    const key = survivalKeyForHorizon(stopHorizon)
    return aggregateByRegionForYear(mapRows, stoppersMapYear, (r) => {
      const surv = (r as any)[key]
      return typeof r.fr === "number" && typeof surv === "number" ? Math.max(0, r.fr - surv) : null
    })
  }, [mapRows, stoppersMapYear, stopHorizon])

  function survMap(mapYear: number | null, key: "s1" | "s2" | "s3" | "s4" | "s5") {
    if (!mapYear) return []
    const byRegion = new Map<RegionCode, { fr: number; surv: number }>()
    for (const r of mapRows) {
      if (r.y !== mapYear) continue
      if (!r.r) continue
      const surv = (r as any)[key]
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

  const survivalMap = React.useMemo(
    () => survMap(survivalMapYear, survivalKeyForHorizon(stopHorizon)),
    [mapRows, survivalMapYear, stopHorizon]
  )

  function selectRegion(code: RegionCode) {
    setSelectedRegion(code)
    setSelectedProvince(null)
    setSelectedMunicipality(null)
    setLevel("region")
  }

  const placeLabel = React.useMemo(() => {
    if (level === "province" && selectedProvince) {
      return PROVINCES.find((p) => String(p.code) === String(selectedProvince))?.name ?? String(selectedProvince)
    }
    if (level === "region" && selectedRegion !== "1000") {
      return REGIONS.find((r) => String(r.code) === String(selectedRegion))?.name ?? String(selectedRegion)
    }
    return "België"
  }, [level, selectedProvince, selectedRegion])

  return (
    <div className="space-y-10">
      <div className="grid gap-4 md:grid-cols-2">
        <GeoFilter municipalities={[]} showMunicipalities={false} />
        <SectorFilter selected={selectedNace1} onChange={setSelectedNace1} />
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          We tonen hier het aantal starters (eerste inschrijvingen), het aantal stoppers (starters die na N jaar niet meer actief zijn),
          en de overlevingskans na N jaar. Gebruik de toggle om N (1–5 jaar) te kiezen. Selectie:{" "}
          <span className="font-medium text-foreground">{placeLabel}</span>
          {selectedNace1 ? <span className="font-medium text-foreground">{` · Sector ${selectedNace1}`}</span> : null}
        </p>
      </div>

      <MetricSection
        title="Aantal starters"
        label="Aantal"
        yearSeries={startersSeries}
        mapData={startersMap}
        mapYear={startersMapYear}
        formatValue={formatInt}
        selectedRegion={selectedRegion}
        onSelectRegion={selectRegion}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">{`Stoppers en overlevingskans (na ${stopHorizon} jaar)`}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Definitie:</span>
            <Tabs
              value={String(stopHorizon)}
              onValueChange={(v) => setStopHorizon(Number(v) as StopHorizon)}
            >
              <TabsList>
                <TabsTrigger value="1">1j</TabsTrigger>
                <TabsTrigger value="2">2j</TabsTrigger>
                <TabsTrigger value="3">3j</TabsTrigger>
                <TabsTrigger value="4">4j</TabsTrigger>
                <TabsTrigger value="5">5j</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <MetricSection
          title={`Aantal stoppers (na ${stopHorizon} jaar)`}
          label="Aantal"
          yearSeries={stoppersSeries}
          mapData={stoppersMap}
          mapYear={stoppersMapYear}
          formatValue={formatInt}
          selectedRegion={selectedRegion}
          onSelectRegion={selectRegion}
        />
      </div>

      <MetricSection
        title={`Overlevingskans na ${stopHorizon} jaar`}
        label="Overlevingskans"
        yearSeries={survivalSeries}
        mapData={survivalMap}
        mapYear={survivalMapYear}
        formatValue={formatPct}
        selectedRegion={selectedRegion}
        onSelectRegion={selectRegion}
      />
    </div>
  )
}

export function StartersStoppersDashboard() {
  return (
    <GeoProvider>
      <InnerDashboard />
    </GeoProvider>
  )
}
