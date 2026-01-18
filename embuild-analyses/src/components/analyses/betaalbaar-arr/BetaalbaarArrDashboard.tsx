"use client"

import * as React from "react"
import { useState, useMemo } from "react"
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

import type { MunicipalityData, SummaryMetrics } from "./types"
import { GebouwenparkSection } from "./GebouwenparkSection"
import { HuishoudensSection } from "./HuishoudensSection"
import { VergunningenSection } from "./VergunningenSection"
import { CorrelatiesSection } from "./CorrelatiesSection"
import { VergelijkingSection } from "./VergelijkingSection"

// Import CSV data (will be loaded client-side)
// Use NEXT_PUBLIC_BASE_PATH from environment (empty in dev, /data-blog in production)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
const MUNICIPALITIES_DATA_PATH = `${basePath}/analyses/betaalbaar-arr/results/municipalities.csv`
const ARRONDISSEMENTS_DATA_PATH = `${basePath}/analyses/betaalbaar-arr/results/arrondissements.csv`

function formatInt(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

function formatPct(n: number) {
  return `${n.toFixed(0)}%`
}

function calculateCompleteness(data: MunicipalityData[], key: keyof MunicipalityData): number {
  if (data.length === 0) return 0
  const validCount = data.filter(d => d[key] != null && d[key] !== 0).length
  return (validCount / data.length) * 100
}

function calculateSummaryMetrics(data: MunicipalityData[]): SummaryMetrics {
  const totalHuizen = data.reduce((sum, d) => sum + (d.Huizen_totaal_2025 ?? 0), 0)
  const totalAppartementen = data.reduce((sum, d) => sum + (d.Appartementen_2025 ?? 0), 0)
  const nieuwbouwRecent = data.reduce((sum, d) => sum + (d.Woningen_Nieuwbouw_2022sep_2025aug ?? 0), 0)
  const renovatieRecent = data.reduce((sum, d) => sum + (d.Gebouwen_Renovatie_2022sep_2025aug ?? 0), 0)

  return {
    totalHuizen,
    totalAppartementen,
    nieuwbouwRecent,
    renovatieRecent,
    completenessHuizen: calculateCompleteness(data, "Huizen_totaal_2025"),
    completenessAppartementen: calculateCompleteness(data, "Appartementen_2025"),
    completenessNieuwbouw: calculateCompleteness(data, "Woningen_Nieuwbouw_2022sep_2025aug"),
    completenessRenovatie: calculateCompleteness(data, "Gebouwen_Renovatie_2022sep_2025aug"),
  }
}

export function BetaalbaarArrDashboard() {
  const [municipalitiesData, setMunicipalitiesData] = useState<MunicipalityData[]>([])
  const [selectedArrondissement, setSelectedArrondissement] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [arrPopoverOpen, setArrPopoverOpen] = useState(false)

  // Load CSV data on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(MUNICIPALITIES_DATA_PATH)
        const csvText = await response.text()

        // Parse CSV (simple implementation - could use papaparse library)
        const lines = csvText.split("\n")
        const headers = lines[0].split(",")
        const data: MunicipalityData[] = []

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue
          const values = lines[i].split(",")
          const row: any = {}

          headers.forEach((header, idx) => {
            const trimmedHeader = header.trim()
            const value = values[idx]?.trim()

            // Type conversions
            if (trimmedHeader === "HH_available") {
              row[trimmedHeader] = value === "True" || value === "true"
            } else if (trimmedHeader === "CD_REFNIS" || trimmedHeader === "CD_SUP_REFNIS" || trimmedHeader === "TX_REFNIS_NL") {
              row[trimmedHeader] = value
            } else {
              // Numeric columns
              row[trimmedHeader] = value === "" || value === "nan" ? null : parseFloat(value)
            }
          })

          data.push(row as MunicipalityData)
        }

        setMunicipalitiesData(data)
        setLoading(false)
      } catch (error) {
        console.error("Failed to load municipalities data:", error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Get unique arrondissements
  const arrondissements = useMemo(() => {
    const unique = new Map<string, string>()
    municipalitiesData.forEach(d => {
      if (d.CD_SUP_REFNIS && !unique.has(d.CD_SUP_REFNIS)) {
        // Get arrondissement name from first municipality in that arrondissement
        unique.set(d.CD_SUP_REFNIS, d.TX_REFNIS_NL) // Using municipality name as placeholder
      }
    })
    return Array.from(unique.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [municipalitiesData])

  // Filter data by selected arrondissement
  const filteredData = useMemo(() => {
    if (selectedArrondissement === "all") {
      return municipalitiesData
    }
    return municipalitiesData.filter(d => d.CD_SUP_REFNIS === selectedArrondissement)
  }, [municipalitiesData, selectedArrondissement])

  // Calculate summary metrics
  const metrics = useMemo(() => calculateSummaryMetrics(filteredData), [filteredData])

  const selectedArrName = useMemo(() => {
    if (selectedArrondissement === "all") return "Alle arrondissementen"
    const arr = arrondissements.find(a => a.code === selectedArrondissement)
    return arr?.name ?? "Alle arrondissementen"
  }, [selectedArrondissement, arrondissements])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Data laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Arrondissement selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Arrondissement:</label>
        <Popover open={arrPopoverOpen} onOpenChange={setArrPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={arrPopoverOpen}
              className="w-[300px] justify-between"
            >
              {selectedArrName}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Zoek arrondissement..." />
              <CommandList>
                <CommandEmpty>Geen resultaten gevonden.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedArrondissement("all")
                      setArrPopoverOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedArrondissement === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Alle arrondissementen
                  </CommandItem>
                  {arrondissements.map((arr) => (
                    <CommandItem
                      key={arr.code}
                      onSelect={() => {
                        setSelectedArrondissement(arr.code)
                        setArrPopoverOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedArrondissement === arr.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {arr.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totaal huizen (2025)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatInt(metrics.totalHuizen)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPct(metrics.completenessHuizen)} gevuld
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totaal appartementen (2025)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatInt(metrics.totalAppartementen)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPct(metrics.completenessAppartementen)} gevuld
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nieuwbouw 2022-2025 (36m)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatInt(metrics.nieuwbouwRecent)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPct(metrics.completenessNieuwbouw)} gevuld
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Renovaties 2022-2025 (36m)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatInt(metrics.renovatieRecent)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPct(metrics.completenessRenovatie)} gevuld
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="gebouwenpark" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gebouwenpark">Gebouwenpark</TabsTrigger>
          <TabsTrigger value="huishoudens">Huishoudens</TabsTrigger>
          <TabsTrigger value="vergunningen">Vergunningen</TabsTrigger>
          <TabsTrigger value="correlaties">Correlaties</TabsTrigger>
          <TabsTrigger value="vergelijking">Vergelijking</TabsTrigger>
        </TabsList>

        <TabsContent value="gebouwenpark" className="space-y-4">
          <GebouwenparkSection data={filteredData} />
        </TabsContent>

        <TabsContent value="huishoudens" className="space-y-4">
          <HuishoudensSection data={filteredData} />
        </TabsContent>

        <TabsContent value="vergunningen" className="space-y-4">
          <VergunningenSection data={filteredData} />
        </TabsContent>

        <TabsContent value="correlaties" className="space-y-4">
          <CorrelatiesSection data={filteredData} />
        </TabsContent>

        <TabsContent value="vergelijking" className="space-y-4">
          <VergelijkingSection data={municipalitiesData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
