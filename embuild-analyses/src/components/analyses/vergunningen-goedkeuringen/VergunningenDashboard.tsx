"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalysisSection } from "../shared/AnalysisSection"
import { GeoProviderWithDefaults } from "../shared/GeoContext"

type PeriodType = "year" | "quarter"

type DataRow = {
  y: number
  q: number
  m: number
  ren: number
  new: number
}

type MunicipalityData = {
  m: number
  name: string
}

export function VergunningenDashboard() {
  const [periodType, setPeriodType] = React.useState<PeriodType>("quarter")
  const [data, setData] = React.useState<DataRow[] | null>(null)
  const [municipalities, setMunicipalities] = React.useState<MunicipalityData[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Lazy-load data from public directory to reduce JavaScript bundle size by 3.8 MB
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [dataResponse, municipalitiesResponse] = await Promise.all([
          fetch("/data-blog/data/vergunningen-goedkeuringen/data_quarterly.json"),
          fetch("/data-blog/data/vergunningen-goedkeuringen/municipalities.json"),
        ])

        if (!dataResponse.ok || !municipalitiesResponse.ok) {
          throw new Error("Failed to load data files")
        }

        const [dataJson, municipalitiesJson] = await Promise.all([
          dataResponse.json(),
          municipalitiesResponse.json(),
        ])

        setData(dataJson)
        setMunicipalities(municipalitiesJson)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
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

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Data laden...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !data || !municipalities) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <p className="text-sm text-destructive">Fout bij het laden van data: {error || "Data niet gevonden"}</p>
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
        />
      </div>
    </GeoProviderWithDefaults>
  )
}
