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
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { GeoProvider } from "../shared/GeoContext"
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
  AreaChart,
  Area,
} from "recharts"

// Nieuwbouw data
import nieuwbouwQuarterly from "../../../../analyses/vergunningen-aanvragen/results/nieuwbouw_quarterly.json"
import nieuwbouwYearly from "../../../../analyses/vergunningen-aanvragen/results/nieuwbouw_yearly.json"
import nieuwbouwByType from "../../../../analyses/vergunningen-aanvragen/results/nieuwbouw_by_type.json"

// Verbouw data
import verbouwQuarterly from "../../../../analyses/vergunningen-aanvragen/results/verbouw_quarterly.json"
import verbouwYearly from "../../../../analyses/vergunningen-aanvragen/results/verbouw_yearly.json"
import verbouwByType from "../../../../analyses/vergunningen-aanvragen/results/verbouw_by_type.json"

// Sloop data
import sloopQuarterly from "../../../../analyses/vergunningen-aanvragen/results/sloop_quarterly.json"
import sloopYearly from "../../../../analyses/vergunningen-aanvragen/results/sloop_yearly.json"
import sloopByBesluit from "../../../../analyses/vergunningen-aanvragen/results/sloop_by_besluit.json"

type QuarterlyRow = { y: number; q: number; p: number; g: number; w: number; m2: number }
type YearlyRow = { y: number; p: number; g: number; w: number; m2: number }
type TypeRow = { y: number; t: string; p: number; g: number; w: number; m2: number }
type SloopQuarterlyRow = { y: number; q: number; p: number; g: number; m2: number; m3: number }
type SloopYearlyRow = { y: number; p: number; g: number; m2: number; m3: number }
type SloopBesluitRow = { y: number; b: string; p: number; g: number; m2: number; m3: number }

type MetricCode = "p" | "g" | "w" | "m2"
type SloopMetricCode = "p" | "g" | "m2" | "m3"

const METRIC_LABELS: Record<MetricCode, string> = {
  p: "Projecten",
  g: "Gebouwen",
  w: "Wooneenheden",
  m2: "Oppervlakte (m²)",
}

const SLOOP_METRIC_LABELS: Record<SloopMetricCode, string> = {
  p: "Projecten",
  g: "Gebouwen",
  m2: "Gesloopte oppervlakte (m²)",
  m3: "Gesloopt volume (m³)",
}

const TYPE_COLORS: Record<string, string> = {
  eengezins: "#3b82f6",
  meergezins: "#22c55e",
  kamer: "#f59e0b",
}

const TYPE_LABELS: Record<string, string> = {
  eengezins: "Eengezinswoning",
  meergezins: "Meergezinswoning",
  kamer: "Kamerwoning",
}

function formatInt(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

function formatPct(n: number) {
  const sign = n >= 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

// Metric selector component
function MetricSelector<T extends string>({
  selected,
  onChange,
  labels,
}: {
  selected: T
  onChange: (m: T) => void
  labels: Record<T, string>
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 min-w-[130px]">
          <span className="truncate">{labels[selected]}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="end">
        <Command>
          <CommandList>
            <CommandGroup>
              {(Object.keys(labels) as T[]).map((code) => (
                <CommandItem
                  key={code}
                  value={labels[code]}
                  onSelect={() => {
                    onChange(code)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selected === code ? "opacity-100" : "opacity-0")} />
                  {labels[code]}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// NIEUWBOUW SECTION
// ============================================================================

function NieuwbouwSection() {
  const [metric, setMetric] = React.useState<MetricCode>("w")

  // Summary stats
  const currentYear = 2024
  const current = (nieuwbouwYearly as YearlyRow[]).find((r) => r.y === currentYear)
  const prev = (nieuwbouwYearly as YearlyRow[]).find((r) => r.y === currentYear - 1)
  const change = current && prev ? ((current[metric] - prev[metric]) / prev[metric]) * 100 : 0

  // Yearly chart data
  const yearlyData = React.useMemo(() => {
    return (nieuwbouwYearly as YearlyRow[]).map((r) => ({
      jaar: r.y,
      waarde: r[metric],
    }))
  }, [metric])

  // Quarterly chart data
  const quarterlyData = React.useMemo(() => {
    return (nieuwbouwQuarterly as QuarterlyRow[]).map((r) => ({
      label: `${r.y} Q${r.q}`,
      waarde: r[metric],
    }))
  }, [metric])

  // By type data
  const typeData = React.useMemo(() => {
    const years = [...new Set((nieuwbouwByType as TypeRow[]).map((r) => r.y))].sort()
    return years.map((year) => {
      const row: Record<string, number | string> = { jaar: year }
      for (const t of ["eengezins", "meergezins", "kamer"]) {
        const found = (nieuwbouwByType as TypeRow[]).find((r) => r.y === year && r.t === t)
        row[TYPE_LABELS[t]] = found ? found[metric] : 0
      }
      return row
    })
  }, [metric])

  // Trend data (index 2018 = 100)
  const trendData = React.useMemo(() => {
    const baseValue = (nieuwbouwYearly as YearlyRow[]).find((r) => r.y === 2018)?.[metric] ?? 1
    return (nieuwbouwYearly as YearlyRow[]).map((r) => ({
      jaar: r.y,
      waarde: r[metric],
      index: (r[metric] / baseValue) * 100,
    }))
  }, [metric])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Nieuwbouw</h2>
        <MetricSelector selected={metric} onChange={setMetric} labels={METRIC_LABELS} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">{METRIC_LABELS[metric]} {currentYear}</div>
            <div className="text-2xl font-bold">{current ? formatInt(current[metric]) : "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">vs {currentYear - 1}</div>
            <div className={cn("text-2xl font-bold", change >= 0 ? "text-green-600" : "text-red-600")}>
              {formatPct(change)}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Totaal 2018-2024</div>
            <div className="text-2xl font-bold">
              {formatInt((nieuwbouwYearly as YearlyRow[]).filter((r) => r.y <= 2024).reduce((sum, r) => sum + r[metric], 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts in tabs */}
      <Tabs defaultValue="yearly">
        <TabsList className="mb-4">
          <TabsTrigger value="yearly">Per jaar</TabsTrigger>
          <TabsTrigger value="quarterly">Per kwartaal</TabsTrigger>
          <TabsTrigger value="type">Per type</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="yearly">
          <Card>
            <CardHeader><CardTitle>Jaarlijkse evolutie nieuwbouw</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jaar" />
                  <YAxis tickFormatter={formatInt} />
                  <Tooltip formatter={(v: number) => formatInt(v)} />
                  <Bar dataKey="waarde" name={METRIC_LABELS[metric]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly">
          <Card>
            <CardHeader><CardTitle>Kwartaalevolutie nieuwbouw</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tickFormatter={formatInt} />
                  <Tooltip formatter={(v: number) => formatInt(v)} />
                  <Area type="monotone" dataKey="waarde" name={METRIC_LABELS[metric]} fill="#3b82f6" stroke="#2563eb" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="type">
          <Card>
            <CardHeader><CardTitle>Nieuwbouw per woningtype</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jaar" />
                  <YAxis tickFormatter={formatInt} />
                  <Tooltip formatter={(v: number) => formatInt(v)} />
                  <Legend />
                  <Bar dataKey="Eengezinswoning" fill={TYPE_COLORS.eengezins} />
                  <Bar dataKey="Meergezinswoning" fill={TYPE_COLORS.meergezins} />
                  <Bar dataKey="Kamerwoning" fill={TYPE_COLORS.kamer} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend">
          <Card>
            <CardHeader><CardTitle>Trend nieuwbouw (index 2018 = 100)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jaar" />
                  <YAxis yAxisId="left" tickFormatter={formatInt} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 150]} />
                  <Tooltip formatter={(v: number, name: string) => name === "Index" ? v.toFixed(1) : formatInt(v)} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="waarde" name={METRIC_LABELS[metric]} fill="#3b82f6" />
                  <Line yAxisId="right" type="monotone" dataKey="index" name="Index" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// VERBOUW SECTION
// ============================================================================

function VerbouwSection() {
  const [metric, setMetric] = React.useState<MetricCode>("w")

  const currentYear = 2024
  const current = (verbouwYearly as YearlyRow[]).find((r) => r.y === currentYear)
  const prev = (verbouwYearly as YearlyRow[]).find((r) => r.y === currentYear - 1)
  const change = current && prev ? ((current[metric] - prev[metric]) / prev[metric]) * 100 : 0

  const yearlyData = React.useMemo(() => {
    return (verbouwYearly as YearlyRow[]).map((r) => ({ jaar: r.y, waarde: r[metric] }))
  }, [metric])

  const quarterlyData = React.useMemo(() => {
    return (verbouwQuarterly as QuarterlyRow[]).map((r) => ({ label: `${r.y} Q${r.q}`, waarde: r[metric] }))
  }, [metric])

  const typeData = React.useMemo(() => {
    const years = [...new Set((verbouwByType as TypeRow[]).map((r) => r.y))].sort()
    return years.map((year) => {
      const row: Record<string, number | string> = { jaar: year }
      for (const t of ["eengezins", "meergezins", "kamer"]) {
        const found = (verbouwByType as TypeRow[]).find((r) => r.y === year && r.t === t)
        row[TYPE_LABELS[t]] = found ? found[metric] : 0
      }
      return row
    })
  }, [metric])

  const trendData = React.useMemo(() => {
    const baseValue = (verbouwYearly as YearlyRow[]).find((r) => r.y === 2018)?.[metric] ?? 1
    return (verbouwYearly as YearlyRow[]).map((r) => ({
      jaar: r.y,
      waarde: r[metric],
      index: (r[metric] / baseValue) * 100,
    }))
  }, [metric])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Verbouwen</h2>
        <MetricSelector selected={metric} onChange={setMetric} labels={METRIC_LABELS} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">{METRIC_LABELS[metric]} {currentYear}</div>
            <div className="text-2xl font-bold">{current ? formatInt(current[metric]) : "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">vs {currentYear - 1}</div>
            <div className={cn("text-2xl font-bold", change >= 0 ? "text-green-600" : "text-red-600")}>
              {formatPct(change)}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Totaal 2018-2024</div>
            <div className="text-2xl font-bold">
              {formatInt((verbouwYearly as YearlyRow[]).filter((r) => r.y <= 2024).reduce((sum, r) => sum + r[metric], 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="yearly">
        <TabsList className="mb-4">
          <TabsTrigger value="yearly">Per jaar</TabsTrigger>
          <TabsTrigger value="quarterly">Per kwartaal</TabsTrigger>
          <TabsTrigger value="type">Per type</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="yearly">
          <Card>
            <CardHeader><CardTitle>Jaarlijkse evolutie verbouw</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jaar" />
                  <YAxis tickFormatter={formatInt} />
                  <Tooltip formatter={(v: number) => formatInt(v)} />
                  <Bar dataKey="waarde" name={METRIC_LABELS[metric]} fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly">
          <Card>
            <CardHeader><CardTitle>Kwartaalevolutie verbouw</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tickFormatter={formatInt} />
                  <Tooltip formatter={(v: number) => formatInt(v)} />
                  <Area type="monotone" dataKey="waarde" name={METRIC_LABELS[metric]} fill="#22c55e" stroke="#16a34a" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="type">
          <Card>
            <CardHeader><CardTitle>Verbouw per woningtype</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jaar" />
                  <YAxis tickFormatter={formatInt} />
                  <Tooltip formatter={(v: number) => formatInt(v)} />
                  <Legend />
                  <Bar dataKey="Eengezinswoning" fill={TYPE_COLORS.eengezins} />
                  <Bar dataKey="Meergezinswoning" fill={TYPE_COLORS.meergezins} />
                  <Bar dataKey="Kamerwoning" fill={TYPE_COLORS.kamer} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend">
          <Card>
            <CardHeader><CardTitle>Trend verbouw (index 2018 = 100)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jaar" />
                  <YAxis yAxisId="left" tickFormatter={formatInt} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 150]} />
                  <Tooltip formatter={(v: number, name: string) => name === "Index" ? v.toFixed(1) : formatInt(v)} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="waarde" name={METRIC_LABELS[metric]} fill="#22c55e" />
                  <Line yAxisId="right" type="monotone" dataKey="index" name="Index" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// SLOOP SECTION
// ============================================================================

function SloopSection() {
  const [metric, setMetric] = React.useState<SloopMetricCode>("m2")

  const currentYear = 2024
  const current = (sloopYearly as SloopYearlyRow[]).find((r) => r.y === currentYear)
  const prev = (sloopYearly as SloopYearlyRow[]).find((r) => r.y === currentYear - 1)
  const change = current && prev ? ((current[metric] - prev[metric]) / prev[metric]) * 100 : 0

  const yearlyData = React.useMemo(() => {
    return (sloopYearly as SloopYearlyRow[]).map((r) => ({ jaar: r.y, waarde: r[metric] }))
  }, [metric])

  const quarterlyData = React.useMemo(() => {
    return (sloopQuarterly as SloopQuarterlyRow[]).map((r) => ({ label: `${r.y} Q${r.q}`, waarde: r[metric] }))
  }, [metric])

  // By besluit type data
  const besluitData = React.useMemo(() => {
    const years = [...new Set((sloopByBesluit as SloopBesluitRow[]).map((r) => r.y))].sort()
    const besluitTypes = ["Gemeente", "Provincie", "Onbekend"]
    return years.map((year) => {
      const row: Record<string, number | string> = { jaar: year }
      for (const b of besluitTypes) {
        const found = (sloopByBesluit as SloopBesluitRow[]).find((r) => r.y === year && r.b === b)
        row[b] = found ? found[metric] : 0
      }
      return row
    })
  }, [metric])

  const trendData = React.useMemo(() => {
    const baseValue = (sloopYearly as SloopYearlyRow[]).find((r) => r.y === 2018)?.[metric] ?? 1
    return (sloopYearly as SloopYearlyRow[]).map((r) => ({
      jaar: r.y,
      waarde: r[metric],
      index: (r[metric] / baseValue) * 100,
    }))
  }, [metric])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sloop</h2>
        <MetricSelector selected={metric} onChange={setMetric} labels={SLOOP_METRIC_LABELS} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">{SLOOP_METRIC_LABELS[metric]} {currentYear}</div>
            <div className="text-2xl font-bold">{current ? formatInt(current[metric]) : "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">vs {currentYear - 1}</div>
            <div className={cn("text-2xl font-bold", change >= 0 ? "text-green-600" : "text-red-600")}>
              {formatPct(change)}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Totaal 2018-2024</div>
            <div className="text-2xl font-bold">
              {formatInt((sloopYearly as SloopYearlyRow[]).filter((r) => r.y <= 2024).reduce((sum, r) => sum + r[metric], 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="yearly">
        <TabsList className="mb-4">
          <TabsTrigger value="yearly">Per jaar</TabsTrigger>
          <TabsTrigger value="quarterly">Per kwartaal</TabsTrigger>
          <TabsTrigger value="besluit">Per besluit</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="yearly">
          <Card>
            <CardHeader><CardTitle>Jaarlijkse evolutie sloop</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jaar" />
                  <YAxis tickFormatter={formatInt} />
                  <Tooltip formatter={(v: number) => formatInt(v)} />
                  <Bar dataKey="waarde" name={SLOOP_METRIC_LABELS[metric]} fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly">
          <Card>
            <CardHeader><CardTitle>Kwartaalevolutie sloop</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tickFormatter={formatInt} />
                  <Tooltip formatter={(v: number) => formatInt(v)} />
                  <Area type="monotone" dataKey="waarde" name={SLOOP_METRIC_LABELS[metric]} fill="#ef4444" stroke="#dc2626" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="besluit">
          <Card>
            <CardHeader><CardTitle>Sloop per besluitniveau</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={besluitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jaar" />
                  <YAxis tickFormatter={formatInt} />
                  <Tooltip formatter={(v: number) => formatInt(v)} />
                  <Legend />
                  <Bar dataKey="Gemeente" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="Provincie" fill="#22c55e" stackId="a" />
                  <Bar dataKey="Onbekend" fill="#9ca3af" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend">
          <Card>
            <CardHeader><CardTitle>Trend sloop (index 2018 = 100)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jaar" />
                  <YAxis yAxisId="left" tickFormatter={formatInt} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 150]} />
                  <Tooltip formatter={(v: number, name: string) => name === "Index" ? v.toFixed(1) : formatInt(v)} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="waarde" name={SLOOP_METRIC_LABELS[metric]} fill="#ef4444" />
                  <Line yAxisId="right" type="monotone" dataKey="index" name="Index" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

function InnerDashboard() {
  return (
    <div className="space-y-12">
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          Deze analyse toont de vergunningsaanvragen voor woningen in Vlaanderen, gebaseerd op
          data van het Omgevingsloket. De cijfers zijn opgedeeld in drie categorieën: nieuwbouw,
          verbouw (renovatie/hergebruik), en sloop. Selecteer een metriek per sectie om de data
          te verkennen.
        </p>
      </div>

      <NieuwbouwSection />

      <div className="border-t pt-8">
        <VerbouwSection />
      </div>

      <div className="border-t pt-8">
        <SloopSection />
      </div>
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
