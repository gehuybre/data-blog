"use client"

import * as React from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Calculator, Check, ChevronsUpDown } from "lucide-react"
import { ExportButtons } from "../shared/ExportButtons"

// Import data
import monthlyIndices from "../../../../analyses/prijsherziening-index-i-2021/results/monthly_indices.json"
import components from "../../../../analyses/prijsherziening-index-i-2021/results/components.json"
import metadata from "../../../../analyses/prijsherziening-index-i-2021/results/metadata.json"

// Types
type MonthlyIndex = {
  year: number
  month: number
  component: string
  component_orig: string
  value: number
}

type Component = {
  code: string
  name: string
  original: string
}

type Metadata = {
  last_updated: string
  data_source: string
  latest_data_date: string | null
  total_records: number
  components: string[]
  date_range: {
    min_year: number
    max_year: number
    min_month: number
    max_month: number
  }
}

const monthlyData = monthlyIndices as MonthlyIndex[]
const componentsData = components as Component[]
const metadataData = metadata as Metadata

// Color palette for different components
const COMPONENT_COLORS: Record<string, string> = {
  "Diesel": "#ef4444",
  "Bitumen": "#f97316",
  "Staal": "#3b82f6",
  "Cement": "#8b5cf6",
  "Hout": "#84cc16",
  "Lonen": "#06b6d4",
  "Index I": "#ec4899",
}

function formatMonth(year: number, month: number): string {
  const monthNames = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
  return `${monthNames[month - 1]} ${year}`
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Onbekend"
  const date = new Date(dateString)
  return date.toLocaleDateString("nl-BE", { year: "numeric", month: "long", day: "numeric" })
}

function formatPct(n: number) {
  const sign = n >= 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

export function PrijsherzieningDashboard() {
  const defaultSelected = React.useMemo(() => {
    const preferred = new Set(["Index I-2021", "Cement"])
    const availablePreferred = componentsData.filter((c) => preferred.has(c.code)).map((c) => c.code)
    return new Set(availablePreferred.length ? availablePreferred : componentsData.map((c) => c.code))
  }, [])

  // Component selection
  const [selectedComponents, setSelectedComponents] = React.useState<Set<string>>(defaultSelected)
  const [componentsOpen, setComponentsOpen] = React.useState(false)
  const allComponentCodes = React.useMemo(() => componentsData.map((c) => c.code), [])
  const selectedComponentList = React.useMemo(
    () => componentsData.filter((c) => selectedComponents.has(c.code)).map((c) => c.code),
    [selectedComponents]
  )
  const componentTriggerLabel = React.useMemo(() => {
    if (selectedComponents.size === 0) return "Selecteer componenten"
    if (selectedComponents.size === allComponentCodes.length) return "Alle componenten"

    const selectedNames = componentsData
      .filter((c) => selectedComponents.has(c.code))
      .map((c) => c.name)
      .slice(0, 2)

    if (selectedComponents.size <= 2) return selectedNames.join(", ")
    return `${selectedComponents.size} geselecteerd`
  }, [allComponentCodes.length, selectedComponents])

  // Price revision calculator state
  const [initialPrice, setInitialPrice] = React.useState<string>("100000")
  const [initialIndex, setInitialIndex] = React.useState<string>("")
  const [currentIndex, setCurrentIndex] = React.useState<string>("")
  const [laborShare, setLaborShare] = React.useState<string>("0.40")
  const [materialShare, setMaterialShare] = React.useState<string>("0.40")
  const [fixedShare, setFixedShare] = React.useState<string>("0.20")

  const toggleComponent = (component: string) => {
    setSelectedComponents((prev) => {
      const next = new Set(prev)
      if (next.has(component)) {
        next.delete(component)
      } else {
        next.add(component)
      }
      return next
    })
  }

  // Prepare chart data
  const chartData = React.useMemo(() => {
    type ChartRow = {
      date: string
      year: number
      month: number
      label: string
      [component: string]: number | string
    }

    const grouped = new Map<string, ChartRow>()

    monthlyData.forEach(row => {
      if (selectedComponents.has(row.component)) {
        const key = `${row.year}-${String(row.month).padStart(2, '0')}`
        if (!grouped.has(key)) {
          grouped.set(key, {
            date: key,
            year: row.year,
            month: row.month,
            label: formatMonth(row.year, row.month),
          })
        }
        grouped.get(key)![row.component] = row.value
      }
    })

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [selectedComponents])

  // Prepare table data
  const tableData = React.useMemo(() => {
    return chartData.map(row => {
      const result: Record<string, any> = {
        Periode: row.label,
      }
      selectedComponentList.forEach(comp => {
        const value = row[comp]
        if (typeof value === "number") {
          result[comp] = value.toFixed(2)
        }
      })
      return result
    })
  }, [chartData, selectedComponentList])

  // Calculate latest values
  const latestValues = React.useMemo(() => {
    const latest = new Map<string, { value: number; year: number; month: number }>()

    monthlyData.forEach(row => {
      const existing = latest.get(row.component)
      if (!existing || row.year > existing.year || (row.year === existing.year && row.month > existing.month)) {
        latest.set(row.component, { value: row.value, year: row.year, month: row.month })
      }
    })

    return latest
  }, [])

  // Calculate revised price
  const calculateRevisedPrice = () => {
    const P0 = parseFloat(initialPrice)
    const S = parseFloat(initialIndex)
    const s = parseFloat(currentIndex)
    const lShare = parseFloat(laborShare)
    const mShare = parseFloat(materialShare)
    const fShare = parseFloat(fixedShare)

    if (isNaN(P0) || isNaN(S) || isNaN(s) || isNaN(lShare) || isNaN(mShare) || isNaN(fShare)) {
      return null
    }

    // P = P₀ × (lShare × s/S + mShare × i/I + fShare)
    // For simplicity, assuming both labor and material use the same index ratio
    const indexRatio = s / S
    const P = P0 * (lShare * indexRatio + mShare * indexRatio + fShare)

    return {
      revisedPrice: P,
      increase: P - P0,
      percentageIncrease: ((P - P0) / P0) * 100,
    }
  }

  const revisedPriceResult = calculateRevisedPrice()

  // Calculate year-over-year changes for each component
  const componentChanges = React.useMemo(() => {
    const changes: Array<{ component: string; change: number; latest: number; year: number; month: number }> = []

    componentsData.forEach(comp => {
      const latest = latestValues.get(comp.code)
      if (!latest) return

      // Find value from 12 months ago
      const prevYear = latest.year
      const prevMonth = latest.month
      const compareYear = latest.month === 12 ? prevYear : prevYear - 1
      const compareMonth = latest.month === 12 ? 12 : latest.month

      const prevValue = monthlyData.find(
        d => d.component === comp.code && d.year === compareYear && d.month === compareMonth
      )

      if (prevValue) {
        const change = ((latest.value - prevValue.value) / prevValue.value) * 100
        changes.push({
          component: comp.code,
          change,
          latest: latest.value,
          year: latest.year,
          month: latest.month,
        })
      }
    })

    return changes
  }, [latestValues])

  const biggestRiser = React.useMemo(() => {
    return componentChanges.reduce((max, curr) =>
      curr.change > max.change ? curr : max
    , componentChanges[0] || { component: "N/A", change: 0, latest: 0, year: 0, month: 0 })
  }, [componentChanges])

  const biggestFaller = React.useMemo(() => {
    return componentChanges.reduce((min, curr) =>
      curr.change < min.change ? curr : min
    , componentChanges[0] || { component: "N/A", change: 0, latest: 0, year: 0, month: 0 })
  }, [componentChanges])

  const indexI2021Latest = React.useMemo(() => {
    return latestValues.get("Index I-2021")
  }, [latestValues])

  return (
    <div className="space-y-6">
      {/* Date info under title (no card) */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Data laatst bijgewerkt op: {formatDate(metadataData.last_updated)}</p>
        {metadataData.latest_data_date && (
          <p>Recentste data: {formatDate(metadataData.latest_data_date)}</p>
        )}
      </div>

      {/* Summary cards: biggest riser, biggest faller, overall index */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Grootste stijger</div>
            <div className="text-2xl font-bold">{biggestRiser.component}</div>
            <div className="text-lg text-green-600 font-semibold">
              {formatPct(biggestRiser.change)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Grootste daler</div>
            <div className="text-2xl font-bold">{biggestFaller.component}</div>
            <div className="text-lg text-red-600 font-semibold">
              {formatPct(biggestFaller.change)}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Index I-2021</div>
            <div className="text-2xl font-bold">
              {indexI2021Latest ? indexI2021Latest.value.toFixed(2) : "-"}
            </div>
            <div className="text-xs text-muted-foreground">
              {indexI2021Latest ? formatMonth(indexI2021Latest.year, indexI2021Latest.month) : ""}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Evolutie prijsherzieningsindex</h2>
          <div className="flex items-center gap-2">
            <ExportButtons
              data={chartData.map((row) => ({
                label: row.label,
                value: 0, // Not used for multi-component export
                periodCells: [row.label],
              }))}
              periodHeaders={["Periode"]}
              title="Prijsherzieningsindex I-2021"
              slug="prijsherziening-index-i-2021"
              sectionId="evolutie"
              viewType="chart"
              valueLabel="Index"
              dataSource="FOD Economie - Prijsherzieningsindexen"
              dataSourceUrl="https://economie.fgov.be/nl/themas/ondernemingen/specifieke-sectoren/bouw/prijsherzieningsindexen/mercuriale-index-i-2021"
            />
            <Popover open={componentsOpen} onOpenChange={setComponentsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  role="combobox"
                  aria-expanded={componentsOpen}
                  className="h-8 gap-1 min-w-[130px]"
                >
                  <span className="truncate">{componentTriggerLabel}</span>
                  <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Zoek component..." />
                  <CommandList>
                    <CommandEmpty>Geen resultaat.</CommandEmpty>
                    <CommandGroup heading="Selectie">
                      <CommandItem
                        value="Alle componenten"
                        onSelect={() => {
                          setSelectedComponents(new Set(allComponentCodes))
                          setComponentsOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedComponents.size === allComponentCodes.length ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Alle componenten
                      </CommandItem>
                      <CommandItem
                        value="Standaard selectie"
                        onSelect={() => {
                          setSelectedComponents(new Set(defaultSelected))
                          setComponentsOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedComponents.size === defaultSelected.size &&
                              Array.from(defaultSelected).every((c) => selectedComponents.has(c))
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        Standaard selectie
                      </CommandItem>
                      <CommandItem
                        value="Wis selectie"
                        onSelect={() => {
                          setSelectedComponents(new Set())
                          setComponentsOpen(false)
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedComponents.size === 0 ? "opacity-100" : "opacity-0")} />
                        Wis selectie
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Component">
                      {componentsData.map((comp) => (
                        <CommandItem
                          key={comp.code}
                          value={`${comp.code} ${comp.name} ${comp.original ?? ""}`.trim()}
                          onSelect={() => toggleComponent(comp.code)}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedComponents.has(comp.code) ? "opacity-100" : "opacity-0")} />
                          <span className="flex flex-col">
                            <span>{comp.name}</span>
                            {comp.original && comp.original !== comp.name ? (
                              <span className="text-xs text-muted-foreground">{comp.original}</span>
                            ) : null}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>
              Maandelijkse evolutie van de geselecteerde indexcomponenten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedComponentList.map(comp => (
                    <Line
                      key={comp}
                      type="monotone"
                      dataKey={comp}
                      stroke={COMPONENT_COLORS[comp] || "#888888"}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle>Indexwaarden per maand</CardTitle>
          <CardDescription>
            Volledige tabel met alle maandelijkse indexwaarden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Periode</th>
                  {selectedComponentList.map(comp => (
                    <th key={comp} className="text-right p-2">{comp}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(-24).reverse().map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{row.Periode}</td>
                    {selectedComponentList.map(comp => (
                      <td key={comp} className="text-right p-2">
                        {row[comp] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Price revision calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Prijsherzieningscalculator
          </CardTitle>
          <CardDescription>
            Bereken de herziene contractprijs op basis van de prijsherzieningsformule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="initialPrice">Initiële contractprijs (P₀)</Label>
                <Input
                  id="initialPrice"
                  type="number"
                  value={initialPrice}
                  onChange={(e) => setInitialPrice(e.target.value)}
                  placeholder="100000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialIndex">Index bij aanvang contract (S of I)</Label>
                <Input
                  id="initialIndex"
                  type="number"
                  step="0.01"
                  value={initialIndex}
                  onChange={(e) => setInitialIndex(e.target.value)}
                  placeholder="Bijv. 150.25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentIndex">Huidige index (s of i)</Label>
                <Input
                  id="currentIndex"
                  type="number"
                  step="0.01"
                  value={currentIndex}
                  onChange={(e) => setCurrentIndex(e.target.value)}
                  placeholder="Bijv. 165.80"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="laborShare">Aandeel lonen</Label>
                <Input
                  id="laborShare"
                  type="number"
                  step="0.01"
                  value={laborShare}
                  onChange={(e) => setLaborShare(e.target.value)}
                  placeholder="0.40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materialShare">Aandeel materialen</Label>
                <Input
                  id="materialShare"
                  type="number"
                  step="0.01"
                  value={materialShare}
                  onChange={(e) => setMaterialShare(e.target.value)}
                  placeholder="0.40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fixedShare">Vast deel</Label>
                <Input
                  id="fixedShare"
                  type="number"
                  step="0.01"
                  value={fixedShare}
                  onChange={(e) => setFixedShare(e.target.value)}
                  placeholder="0.20"
                />
              </div>
            </div>

            {revisedPriceResult && (
              <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Herziene prijs (P):</span>
                  <span className="text-2xl font-bold">
                    € {revisedPriceResult.revisedPrice.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Verschil:</span>
                  <span className={revisedPriceResult.increase >= 0 ? "text-red-600" : "text-green-600"}>
                    {revisedPriceResult.increase >= 0 ? "+" : ""}€ {revisedPriceResult.increase.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {" "}({revisedPriceResult.percentageIncrease >= 0 ? "+" : ""}{revisedPriceResult.percentageIncrease.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium mb-2">Formule:</p>
              <p className="font-mono text-xs">
                P = P₀ × ({laborShare} × s/S + {materialShare} × i/I + {fixedShare})
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                Waarbij s/S en i/I de verhoudingen zijn tussen de indices bij herziening en bij aanvang.
                Voor deze vereenvoudigde calculator wordt dezelfde indexverhouding gebruikt voor beide.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
