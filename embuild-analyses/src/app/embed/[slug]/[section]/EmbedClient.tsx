"use client"

import { useEffect, useState } from "react"
import { EmbeddableSection } from "@/components/analyses/shared/EmbeddableSection"
import { StartersStoppersEmbed } from "@/components/analyses/starters-stoppers/StartersStoppersEmbed"
import { ProvinceCode, RegionCode } from "@/lib/geo-utils"

// Import data for each analysis
import vergunningenData from "../../../../../analyses/vergunningen-goedkeuringen/results/data_quarterly.json"
import vergunningenMunicipalities from "../../../../../analyses/vergunningen-goedkeuringen/results/municipalities.json"

type ViewType = "chart" | "table" | "map"
type StopHorizon = 1 | 2 | 3 | 4 | 5
type StartersStoppersSection = "starters" | "stoppers" | "survival"

interface EmbedClientProps {
  slug: string
  section: string
}

// Configuration for vergunningen embeddable sections
const VERGUNNINGEN_CONFIGS: Record<string, {
  title: string
  data: unknown[]
  municipalities: unknown[]
  metric: string
  label?: string
}> = {
  renovatie: {
    title: "Renovatie (Gebouwen)",
    data: vergunningenData,
    municipalities: vergunningenMunicipalities,
    metric: "ren",
    label: "Aantal",
  },
  nieuwbouw: {
    title: "Nieuwbouw (Gebouwen)",
    data: vergunningenData,
    municipalities: vergunningenMunicipalities,
    metric: "new",
    label: "Aantal",
  },
}

interface UrlParams {
  view: ViewType
  horizon: StopHorizon
  region: RegionCode | null
  province: ProvinceCode | null
  sector: string | null
}

function getParamsFromUrl(): UrlParams {
  if (typeof window === "undefined") {
    return { view: "chart", horizon: 1, region: null, province: null, sector: null }
  }

  const params = new URLSearchParams(window.location.search)

  // View type
  const view = params.get("view")
  const viewType: ViewType = (view === "table" || view === "map") ? view : "chart"

  // Horizon (1-5)
  const horizonStr = params.get("horizon")
  let horizon: StopHorizon = 1
  if (horizonStr) {
    const h = parseInt(horizonStr, 10)
    if (h >= 1 && h <= 5) horizon = h as StopHorizon
  }

  // Region
  const regionStr = params.get("region")
  const region: RegionCode | null = regionStr as RegionCode | null

  // Province
  const provinceStr = params.get("province")
  const province: ProvinceCode | null = provinceStr as ProvinceCode | null

  // Sector (NACE code)
  const sector = params.get("sector") || null

  return { view: viewType, horizon, region, province, sector }
}

export function EmbedClient({ slug, section }: EmbedClientProps) {
  const [urlParams, setUrlParams] = useState<UrlParams>({
    view: "chart",
    horizon: 1,
    region: null,
    province: null,
    sector: null,
  })

  useEffect(() => {
    setUrlParams(getParamsFromUrl())
  }, [])

  // Handle starters-stoppers separately
  if (slug === "starters-stoppers") {
    const validSections: StartersStoppersSection[] = ["starters", "stoppers", "survival"]
    if (!validSections.includes(section as StartersStoppersSection)) {
      return (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            Ongeldige sectie: {section}. Geldige opties: starters, stoppers, survival
          </p>
        </div>
      )
    }

    return (
      <StartersStoppersEmbed
        section={section as StartersStoppersSection}
        viewType={urlParams.view}
        horizon={urlParams.horizon}
        region={urlParams.region}
        province={urlParams.province}
        sector={urlParams.sector}
      />
    )
  }

  // Handle vergunningen-goedkeuringen
  if (slug === "vergunningen-goedkeuringen") {
    const config = VERGUNNINGEN_CONFIGS[section]

    if (!config) {
      return (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            Embed niet gevonden: {slug}/{section}
          </p>
        </div>
      )
    }

    return (
      <EmbeddableSection
        title={config.title}
        data={config.data as Record<string, unknown>[]}
        municipalities={config.municipalities as { code: number; name: string }[]}
        metric={config.metric}
        label={config.label}
        viewType={urlParams.view}
      />
    )
  }

  // Unknown slug
  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">
        Embed niet gevonden: {slug}/{section}
      </p>
    </div>
  )
}
