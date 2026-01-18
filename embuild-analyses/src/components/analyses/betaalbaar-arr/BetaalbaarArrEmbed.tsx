"use client"

import * as React from "react"
import type { ArrondissementData, MunicipalityData } from "./types"
import { GebouwenparkSection } from "./GebouwenparkSection"
import { HuishoudensSection } from "./HuishoudensSection"
import { VergunningenSection } from "./VergunningenSection"
import { CorrelatiesSection } from "./CorrelatiesSection"
import { VergelijkingSection } from "./VergelijkingSection"
import { getBasePath as getBlogBasePath } from "@/lib/path-utils"

type SectionType = "gebouwenpark" | "huishoudens" | "vergunningen" | "correlaties" | "vergelijking"
type ViewType = "chart" | "table"

export function BetaalbaarArrEmbed({
  section,
  viewType,
}: {
  section: SectionType
  viewType: ViewType
}) {
  const [municipalitiesData, setMunicipalitiesData] = React.useState<MunicipalityData[]>([])
  const [arrondissementsData, setArrondissementsData] = React.useState<ArrondissementData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      try {
        const basePath = getBlogBasePath()
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

            if (trimmedHeader === "HH_available") {
              row[trimmedHeader] = value === "True" || value === "true"
            } else if (trimmedHeader === "CD_REFNIS" || trimmedHeader === "CD_SUP_REFNIS" || trimmedHeader === "TX_REFNIS_NL") {
              row[trimmedHeader] = value
            } else {
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
      } catch (err) {
        console.error("Failed to load betaalbaar-arr embed data:", err)
        setError("Kon data niet laden.")
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const arrNameByCode = React.useMemo(() => {
    const map = new Map<string, string>()
    arrondissementsData.forEach(arr => {
      if (arr.CD_ARR && arr.TX_ARR_NL) {
        map.set(arr.CD_ARR, arr.TX_ARR_NL)
      }
    })
    return map
  }, [arrondissementsData])

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">Data laden...</div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-muted-foreground">{error}</div>
    )
  }

  return (
    <div className="p-4">
      {section === "gebouwenpark" && (
        <GebouwenparkSection data={municipalitiesData} viewType={viewType} hideControls />
      )}
      {section === "huishoudens" && (
        <HuishoudensSection data={municipalitiesData} viewType={viewType} hideControls />
      )}
      {section === "vergunningen" && (
        <VergunningenSection data={municipalitiesData} viewType={viewType} hideControls />
      )}
      {section === "correlaties" && (
        <CorrelatiesSection data={municipalitiesData} viewType={viewType} hideControls />
      )}
      {section === "vergelijking" && (
        <VergelijkingSection data={municipalitiesData} arrNameByCode={arrNameByCode} viewType={viewType} hideControls />
      )}

      <div className="mt-4 text-xs text-muted-foreground text-center">
        <a
          href={typeof window !== "undefined" ? window.location.origin + getBlogBasePath() : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          suppressHydrationWarning
        >
          Data Blog
        </a>
        {" · "}
        <span>Bron: Statbel, Vlaamse Overheid</span>
      </div>
    </div>
  )
}
