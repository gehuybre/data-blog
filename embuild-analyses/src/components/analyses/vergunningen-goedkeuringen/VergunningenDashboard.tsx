"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalysisSection } from "../shared/AnalysisSection"
import { GeoProviderWithDefaults } from "../shared/GeoContext"

// Import data files
import dataQuarterly from "../../../../analyses/vergunningen-goedkeuringen/results/data_quarterly.json"
import municipalitiesData from "../../../../analyses/vergunningen-goedkeuringen/results/municipalities.json"

type PeriodType = "year" | "quarter"

// Convert imported data to the format we need
const data = dataQuarterly
const municipalities = municipalitiesData

type DataRow = {
  y: number
  q: number
  m: number
  ren: number
  new: number
}

export function VergunningenDashboard() {
  const [periodType, setPeriodType] = React.useState<PeriodType>("quarter")

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
          data={data as DataRow[]}
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
          data={data as DataRow[]}
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
