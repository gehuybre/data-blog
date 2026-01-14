"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalysisSection } from "../shared/AnalysisSection"
import { GeoProviderWithDefaults } from "../shared/GeoContext"
import { getBasePath } from "@/lib/path-utils"
import { normalizeNisCode } from "@/lib/nis-fusion-utils"

// Data is now lazy-loaded from public/data/vergunningen-goedkeuringen/
// Static imports replaced to reduce JavaScript bundle size by 3.8 MB

type PeriodType = "year" | "quarter"

type DataRow = {
  y: number
  q: number
  m: number | string
  ren: number
  new: number
}

type MunicipalityData = {
  code: number
  name: string
}

export function VergunningenDashboard() {
  const [periodType, setPeriodType] = React.useState<PeriodType>("quarter")
  const [data, setData] = React.useState<DataRow[] | null>(null)
  const [municipalities, setMunicipalities] = React.useState<MunicipalityData[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    async function loadData() {
      try {
        const basePath = getBasePath()

        const [dataQuarterly, municipalitiesData] = await Promise.all([
          fetch(`${basePath}/data/vergunningen-goedkeuringen/data_quarterly.json`, { signal: abortController.signal }).then(r => r.json()),
          fetch(`${basePath}/data/vergunningen-goedkeuringen/municipalities.json`, { signal: abortController.signal }).then(r => r.json()),
        ])

        if (!isMounted) return

        // Normalize municipality codes and aggregate per period so the map
        // receives post-fusion, zero-padded 5-digit NIS codes (see nis-fusion-utils)
        // Aggregate counts when multiple pre-fusion codes map to the same current code
        const aggregatedMap = new Map<string, { y: number; q: number; m: number; ren: number; new: number }>()

        for (const row of (dataQuarterly as DataRow[])) {
          const normStr = normalizeNisCode(row.m) || String(row.m).padStart(5, "0")
          const normNum = Number(normStr)
          const key = `${row.y}-${row.q}|${normStr}`
          const prev = aggregatedMap.get(key)
          if (!prev) {
            aggregatedMap.set(key, { y: row.y, q: row.q, m: normNum, ren: Number(row.ren) || 0, new: Number(row.new) || 0 })
          } else {
            prev.ren += Number(row.ren) || 0
            prev.new += Number(row.new) || 0
          }
        }

        const normalizedData = Array.from(aggregatedMap.values())

        // Keep municipalities list as-is (numbers). They will be matched via numeric NIS codes.
        setData(normalizedData)
        setMunicipalities(municipalitiesData)
        setLoading(false)
      } catch (err) {
        if (!isMounted) return
        console.error("Failed to load vergunningen data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
        setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [])

  // Define period configurations for different aggregation levels
  const periodConfig = React.useMemo(() => {
    if (periodType === "year") {
      return {
        key: (d: DataRow) => `${d.y}`,
        sortValue: (d: DataRow) => d.y,
        label: (d: DataRow) => `${d.y}`,
        table: {
          headers: ["Jaar"],
          cells: (d: DataRow) => [d.y],
        },
      }
    }

    // quarter (default)
    return {
      key: (d: DataRow) => `${d.y}-${d.q}`,
      sortValue: (d: DataRow) => d.y * 10 + d.q,
      label: (d: DataRow) => `${d.y} Q${d.q}`,
      table: {
        headers: ["Jaar", "Kwartaal"],
        cells: (d: DataRow) => [d.y, `Q${d.q}`],
      },
    }
  }, [periodType])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Data laden...</p>
        </div>
      </div>
    )
  }

  if (error || !data || !municipalities) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">Fout bij het laden van de data</p>
          {error && <p className="text-xs text-muted-foreground">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <GeoProviderWithDefaults initialLevel="province" initialRegion="1000" initialProvince={null} initialMunicipality={null}>
      <div className="space-y-8">
        {/* Period selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Periode:</span>
          <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
            <TabsList className="h-9">
              <TabsTrigger value="year" className="text-xs px-3">
                Per jaar
              </TabsTrigger>
              <TabsTrigger value="quarter" className="text-xs px-3">
                Per kwartaal
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <AnalysisSection
          title="Renovatie (Gebouwen)"
          data={data}
          municipalities={municipalities}
          metric="ren"
          label="Aantal"
          slug="vergunningen-goedkeuringen"
          sectionId="renovatie"
          dataSource="Statbel - Bouwvergunningen"
          dataSourceUrl="https://statbel.fgov.be/nl/themas/bouwen-wonen/bouwvergunningen"
          showMap={true}
          period={periodConfig}
          getMunicipalityCode={(d) => Number(d.m)}
        />

        <AnalysisSection
          title="Nieuwbouw (Gebouwen)"
          data={data}
          municipalities={municipalities}
          metric="new"
          label="Aantal"
          slug="vergunningen-goedkeuringen"
          sectionId="nieuwbouw"
          dataSource="Statbel - Bouwvergunningen"
          dataSourceUrl="https://statbel.fgov.be/nl/themas/bouwen-wonen/bouwvergunningen"
          showMap={true}
          period={periodConfig}
          getMunicipalityCode={(d) => Number(d.m)}
        />
      </div>
    </GeoProviderWithDefaults>
  )
}
