"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import type { ArrondissementData, MunicipalityData, SummaryMetrics } from "./types"
import { GebouwenparkSection } from "./GebouwenparkSection"
import { HuishoudensSection } from "./HuishoudensSection"
import { VergunningenSection } from "./VergunningenSection"
import { CorrelatiesSection } from "./CorrelatiesSection"
import { VergelijkingSection } from "./VergelijkingSection"

// Import CSV data (will be loaded client-side)
// Derive basePath from the current URL to avoid relying on process.env in the browser.
function getBasePath(): string {
  if (typeof window === "undefined") return ""
  const marker = "/analyses/"
  const index = window.location.pathname.indexOf(marker)
  if (index > 0) {
    return window.location.pathname.slice(0, index)
  }
  return ""
}

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
  const [arrondissementsData, setArrondissementsData] = useState<ArrondissementData[]>([])
  const [selectedArrondissement, setSelectedArrondissement] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [arrPopoverOpen, setArrPopoverOpen] = useState(false)

  // Load CSV data on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        const basePath = getBasePath()
        const municipalitiesPath = `${basePath}/analyses/betaalbaar-arr/results/municipalities.csv`
        const arrondissementsPath = `${basePath}/analyses/betaalbaar-arr/results/arrondissements.csv`
        const [municipalitiesResponse, arrondissementsResponse] = await Promise.all([
          fetch(municipalitiesPath),
          fetch(arrondissementsPath),
        ])
        const [municipalitiesText, arrondissementsText] = await Promise.all([
          municipalitiesResponse.text(),
          arrondissementsResponse.text(),
        ])

        // Parse CSV (simple implementation - could use papaparse library)
        const normalizeHeader = (header: string) => header.trim().replace(/-/g, "_")
        const municipalityLines = municipalitiesText.split("\n")
        const municipalityHeaders = municipalityLines[0].split(",").map(normalizeHeader)
        const municipalities: MunicipalityData[] = []

        for (let i = 1; i < municipalityLines.length; i++) {
          if (!municipalityLines[i].trim()) continue
          const values = municipalityLines[i].split(",")
          const row: any = {}

          municipalityHeaders.forEach((header, idx) => {
            const trimmedHeader = header
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

          municipalities.push(row as MunicipalityData)
        }

        const arrondissementLines = arrondissementsText.split("\n")
        const arrondissementHeaders = arrondissementLines[0].split(",").map(normalizeHeader)
        const arrondissements: ArrondissementData[] = []

        for (let i = 1; i < arrondissementLines.length; i++) {
          if (!arrondissementLines[i].trim()) continue
          const values = arrondissementLines[i].split(",")
          const row: any = {}

          arrondissementHeaders.forEach((header, idx) => {
            const trimmedHeader = header
            const value = values[idx]?.trim()

            if (trimmedHeader === "CD_ARR" || trimmedHeader === "TX_ARR_NL") {
              row[trimmedHeader] = value
            } else {
              row[trimmedHeader] = value === "" || value === "nan" ? null : parseFloat(value)
            }
          })

          arrondissements.push(row as ArrondissementData)
        }

        setMunicipalitiesData(municipalities)
        setArrondissementsData(arrondissements)
        setLoading(false)
      } catch (error) {
        console.error("Failed to load municipalities data:", error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const arrNameByCode = useMemo(() => {
    const map = new Map<string, string>()
    arrondissementsData.forEach(arr => {
      if (arr.CD_ARR && arr.TX_ARR_NL) {
        map.set(arr.CD_ARR, arr.TX_ARR_NL)
      }
    })
    return map
  }, [arrondissementsData])

  // Get unique arrondissements
  const arrondissements = useMemo(() => {
    const unique = new Map<string, string>()
    municipalitiesData.forEach(d => {
      if (d.CD_SUP_REFNIS && !unique.has(d.CD_SUP_REFNIS)) {
        const arrName = arrNameByCode.get(d.CD_SUP_REFNIS) ?? d.TX_REFNIS_NL
        unique.set(d.CD_SUP_REFNIS, arrName)
      }
    })
    return Array.from(unique.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [municipalitiesData, arrNameByCode])

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

      <div className="space-y-10">
        <GebouwenparkSection data={filteredData} />
        <HuishoudensSection data={filteredData} />
        <VergunningenSection data={filteredData} />
        <CorrelatiesSection data={filteredData} />
        <VergelijkingSection data={municipalitiesData} arrNameByCode={arrNameByCode} />
      </div>
    </div>
  )
}
