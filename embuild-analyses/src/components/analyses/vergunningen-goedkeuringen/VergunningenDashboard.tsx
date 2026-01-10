"use client"

import * as React from "react"
import { AnalysisSection } from "../shared/AnalysisSection"
import { GeoProviderWithDefaults } from "../shared/GeoContext"

// Data is now lazy-loaded from public/data/vergunningen-goedkeuringen/
// Static imports replaced to reduce JavaScript bundle size by 3.8 MB

export function VergunningenDashboard() {
  const [data, setData] = React.useState<any[] | null>(null)
  const [municipalities, setMunicipalities] = React.useState<any[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      try {
        const basePath = process.env.NODE_ENV === "production" ? "/data-blog" : ""

        const [quarterlyData, municipalitiesData] = await Promise.all([
          fetch(`${basePath}/data/vergunningen-goedkeuringen/data_quarterly.json`).then(r => {
            if (!r.ok) throw new Error(`Failed to load data_quarterly.json: ${r.status}`)
            return r.json()
          }),
          fetch(`${basePath}/data/vergunningen-goedkeuringen/municipalities.json`).then(r => {
            if (!r.ok) throw new Error(`Failed to load municipalities.json: ${r.status}`)
            return r.json()
          })
        ])

        setData(quarterlyData)
        setMunicipalities(municipalitiesData)
        setLoading(false)
      } catch (err) {
        console.error("Error loading vergunningen data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Vergunningendata laden...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !data || !municipalities) {
    return (
      <div className="rounded-lg border bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Fout bij het laden van de data: {error || "Onbekende fout"}</p>
      </div>
    )
  }

  return (
    <GeoProviderWithDefaults initialLevel="province" initialRegion="1000" initialProvince={null} initialMunicipality={null}>
      <div className="space-y-12">
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
        />
      </div>
    </GeoProviderWithDefaults>
  )
}
