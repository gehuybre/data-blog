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
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { GeoProvider } from "../shared/GeoContext"
import { FilterableChart } from "../shared/FilterableChart"
import { FilterableTable } from "../shared/FilterableTable"
import { ExportButtons } from "../shared/ExportButtons"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts"

import quarterlyTotals from "../../../../analyses/vergunningen-aanvragen/results/quarterly_totals.json"
import yearlyTotals from "../../../../analyses/vergunningen-aanvragen/results/yearly_totals.json"
import yearlyByHandeling from "../../../../analyses/vergunningen-aanvragen/results/yearly_by_handeling.json"
import yearlyByType from "../../../../analyses/vergunningen-aanvragen/results/yearly_by_type.json"
import lookups from "../../../../analyses/vergunningen-aanvragen/results/lookups.json"

type QuarterlyRow = {
  y: number
  q: number
  p: number
  g: number
  w: number
  m2: number
}

type YearlyRow = {
  y: number
  p: number
  g: number
  w: number
  m2: number
}

type YearlyHandelingRow = {
  y: number
  h: string
  p: number
  g: number
  w: number
  m2: number
}

type YearlyTypeRow = {
  y: number
  t: string
  p: number
  g: number
  w: number
  m2: number
}

type MetricCode = "p" | "g" | "w" | "m2"

const METRIC_LABELS: Record<MetricCode, string> = {
  p: "Projecten",
  g: "Gebouwen",
  w: "Wooneenheden",
  m2: "Oppervlakte (m²)",
}

const TYPE_LABELS: Record<string, string> = {
  eengezins: "Eengezinswoning",
  meergezins: "Meergezinswoning",
  kamer: "Kamerwoning",
}

const HANDELING_LABELS: Record<string, string> = {
  nieuwbouw: "Nieuwbouw",
  verbouw: "Verbouwen",
}

function formatInt(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

function formatPct(n: number) {
  const sign = n >= 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

// Metric selector
function MetricFilterInline({
  selected,
  onChange,
}: {
  selected: MetricCode
  onChange: (metric: MetricCode) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" role="combobox" aria-expanded={open} className="h-9 gap-1 min-w-[140px]">
          <span className="truncate max-w-[180px]">{METRIC_LABELS[selected]}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Zoek metriek..." />
          <CommandList>
            <CommandEmpty>Geen resultaat.</CommandEmpty>
            <CommandGroup heading="Metriek">
              {(Object.keys(METRIC_LABELS) as MetricCode[]).map((code) => (
                <CommandItem
                  key={code}
                  value={METRIC_LABELS[code]}
                  onSelect={() => {
                    onChange(code)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selected === code ? "opacity-100" : "opacity-0")} />
                  {METRIC_LABELS[code]}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Summary cards
function SummaryCards({ metric }: { metric: MetricCode }) {
  const currentYear = 2024 // Full year data
  const prevYear = 2023

  const current = (yearlyTotals as YearlyRow[]).find((r) => r.y === currentYear)
  const prev = (yearlyTotals as YearlyRow[]).find((r) => r.y === prevYear)

  if (!current || !prev) return null

  const currentValue = current[metric]
  const prevValue = prev[metric]
  const change = ((currentValue - prevValue) / prevValue) * 100

  // Get nieuwbouw vs verbouw for current year
  const nieuwbouw = (yearlyByHandeling as YearlyHandelingRow[]).find(
    (r) => r.y === currentYear && r.h === "nieuwbouw"
  )
  const verbouw = (yearlyByHandeling as YearlyHandelingRow[]).find(
    (r) => r.y === currentYear && r.h === "verbouw"
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">{METRIC_LABELS[metric]} {currentYear}</div>
          <div className="text-2xl font-bold">{formatInt(currentValue)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">vs {prevYear}</div>
          <div className={cn("text-2xl font-bold", change >= 0 ? "text-green-600" : "text-red-600")}>
            {formatPct(change)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">Nieuwbouw {currentYear}</div>
          <div className="text-2xl font-bold">{nieuwbouw ? formatInt(nieuwbouw[metric]) : "-"}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">Verbouw {currentYear}</div>
          <div className="text-2xl font-bold">{verbouw ? formatInt(verbouw[metric]) : "-"}</div>
        </CardContent>
      </Card>
    </div>
  )
}

// Quarterly evolution chart
function QuarterlySection({ metric }: { metric: MetricCode }) {
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")

  const chartData = React.useMemo(() => {
    return (quarterlyTotals as QuarterlyRow[]).map((r) => ({
      sortValue: r.y * 10 + r.q,
      periodCells: [r.y, `Q${r.q}`],
      value: r[metric],
      label: `${r.y} Q${r.q}`,
    }))
  }, [metric])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Evolutie per kwartaal</h2>
        <ExportButtons
          data={chartData}
          title="Vergunningen per kwartaal"
          slug="vergunningen-aanvragen"
          sectionId="kwartaal"
          viewType={currentView}
          periodHeaders={["Jaar", "Kwartaal"]}
          valueLabel={METRIC_LABELS[metric]}
          dataSource="Omgevingsloket Vlaanderen"
          dataSourceUrl="https://omgevingsloketrapportering.omgeving.vlaanderen.be/wonen"
        />
      </div>

      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table")}>
        <TabsList>
          <TabsTrigger value="chart">Grafiek</TabsTrigger>
          <TabsTrigger value="table">Tabel</TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>{METRIC_LABELS[metric]} per kwartaal (2018-2025)</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableChart data={chartData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableTable data={chartData} label={METRIC_LABELS[metric]} periodHeaders={["Jaar", "Kwartaal"]} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Yearly comparison by handeling
function HandelingSection({ metric }: { metric: MetricCode }) {
  const chartData = React.useMemo(() => {
    const years = [...new Set((yearlyByHandeling as YearlyHandelingRow[]).map((r) => r.y))].sort()

    return years.map((year) => {
      const nieuwbouw = (yearlyByHandeling as YearlyHandelingRow[]).find(
        (r) => r.y === year && r.h === "nieuwbouw"
      )
      const verbouw = (yearlyByHandeling as YearlyHandelingRow[]).find(
        (r) => r.y === year && r.h === "verbouw"
      )
      return {
        jaar: year,
        Nieuwbouw: nieuwbouw ? nieuwbouw[metric] : 0,
        Verbouw: verbouw ? verbouw[metric] : 0,
      }
    })
  }, [metric])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Nieuwbouw vs Verbouw</h2>
      <Card>
        <CardHeader>
          <CardTitle>{METRIC_LABELS[metric]} per jaar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="jaar" />
              <YAxis tickFormatter={(v) => formatInt(v)} />
              <Tooltip formatter={(value: number) => formatInt(value)} />
              <Legend />
              <Bar dataKey="Nieuwbouw" fill="#3b82f6" stackId="a" />
              <Bar dataKey="Verbouw" fill="#22c55e" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Yearly comparison by building type
function TypeSection({ metric }: { metric: MetricCode }) {
  const chartData = React.useMemo(() => {
    const years = [...new Set((yearlyByType as YearlyTypeRow[]).map((r) => r.y))].sort()

    return years.map((year) => {
      const eengezins = (yearlyByType as YearlyTypeRow[]).find(
        (r) => r.y === year && r.t === "eengezins"
      )
      const meergezins = (yearlyByType as YearlyTypeRow[]).find(
        (r) => r.y === year && r.t === "meergezins"
      )
      const kamer = (yearlyByType as YearlyTypeRow[]).find(
        (r) => r.y === year && r.t === "kamer"
      )
      return {
        jaar: year,
        Eengezinswoning: eengezins ? eengezins[metric] : 0,
        Meergezinswoning: meergezins ? meergezins[metric] : 0,
        Kamerwoning: kamer ? kamer[metric] : 0,
      }
    })
  }, [metric])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Verdeling per woningtype</h2>
      <Card>
        <CardHeader>
          <CardTitle>{METRIC_LABELS[metric]} per woningtype</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="jaar" />
              <YAxis tickFormatter={(v) => formatInt(v)} />
              <Tooltip formatter={(value: number) => formatInt(value)} />
              <Legend />
              <Bar dataKey="Eengezinswoning" fill="#3b82f6" />
              <Bar dataKey="Meergezinswoning" fill="#22c55e" />
              <Bar dataKey="Kamerwoning" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Trend analysis section
function TrendSection({ metric }: { metric: MetricCode }) {
  const chartData = React.useMemo(() => {
    const years = [...new Set((yearlyTotals as YearlyRow[]).map((r) => r.y))].sort()
    const baseYear = years[0]
    const baseValue = (yearlyTotals as YearlyRow[]).find((r) => r.y === baseYear)?.[metric] ?? 1

    return years.map((year) => {
      const row = (yearlyTotals as YearlyRow[]).find((r) => r.y === year)
      const value = row ? row[metric] : 0
      const indexValue = (value / baseValue) * 100
      return {
        jaar: year,
        waarde: value,
        index: indexValue,
      }
    })
  }, [metric])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Trend (index 2018 = 100)</h2>
      <Card>
        <CardHeader>
          <CardTitle>{METRIC_LABELS[metric]} - Jaarlijkse trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="jaar" />
              <YAxis yAxisId="left" tickFormatter={(v) => formatInt(v)} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 150]} />
              <Tooltip formatter={(value: number, name: string) =>
                name === "index" ? value.toFixed(1) : formatInt(value)
              } />
              <Legend />
              <Bar yAxisId="left" dataKey="waarde" name={METRIC_LABELS[metric]} fill="#3b82f6" />
              <Line yAxisId="right" type="monotone" dataKey="index" name="Index (2018=100)" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Inner dashboard
function InnerDashboard() {
  const [metric, setMetric] = React.useState<MetricCode>("w")

  return (
    <div className="space-y-10">
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          Deze analyse toont de vergunningsaanvragen voor woningen in Vlaanderen, gebaseerd op
          data van het Omgevingsloket. De cijfers omvatten zowel nieuwbouw als verbouwingen van
          eengezinswoningen, meergezinswoningen en kamerwoningen.
        </p>
      </div>

      <div className="flex justify-end">
        <MetricFilterInline selected={metric} onChange={setMetric} />
      </div>

      <SummaryCards metric={metric} />
      <QuarterlySection metric={metric} />
      <HandelingSection metric={metric} />
      <TypeSection metric={metric} />
      <TrendSection metric={metric} />
    </div>
  )
}

export function VergunningenDashboard() {
  return (
    <GeoProvider>
      <InnerDashboard />
    </GeoProvider>
  )
}
