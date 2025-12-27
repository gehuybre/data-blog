"use client"

import React, { useEffect, useState } from "react"
import { EmbeddableSection } from "@/components/analyses/shared/EmbeddableSection"
import { StartersStoppersEmbed } from "@/components/analyses/starters-stoppers/StartersStoppersEmbed"
import { ProvinceCode, RegionCode } from "@/lib/geo-utils"
import { getEmbedConfig, StandardEmbedConfig } from "@/lib/embed-config"
import { EmbedDataRow, MunicipalityData } from "@/lib/embed-types"

type ViewType = "chart" | "table" | "map"
type StopHorizon = 1 | 2 | 3 | 4 | 5
type StartersStoppersSection = "starters" | "stoppers" | "survival"

interface EmbedClientProps {
  slug: string
  section: string
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

  // State for dynamically loaded data
  const [embedData, setEmbedData] = useState<{
    data: EmbedDataRow[] | null
    municipalities: MunicipalityData[] | null
    loading: boolean
    error: string | null
  }>({
    data: null,
    municipalities: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    setUrlParams(getParamsFromUrl())
  }, [])

  // Load data dynamically for standard embeds
  useEffect(() => {
    const config = getEmbedConfig(slug, section)
    if (!config || config.type !== "standard") return

    const standardConfig = config as StandardEmbedConfig
    let isCancelled = false

    // Validate paths don't escape analyses directory
    // This is a defense-in-depth measure. The actual security is ensured by:
    // 1. Config is hardcoded in source code (not from external sources)
    // 2. Build-time validation ensures paths exist
    // 3. Next.js static export validates paths at build time
    if (standardConfig.dataPath.includes('..') || standardConfig.municipalitiesPath.includes('..')) {
      setEmbedData({
        data: null,
        municipalities: null,
        loading: false,
        error: 'Invalid data path configuration',
      })
      return
    }

    setEmbedData((prev) => ({ ...prev, loading: true }))

    Promise.all([
      import(`../../../../../analyses/${standardConfig.dataPath}`),
      import(`../../../../../analyses/${standardConfig.municipalitiesPath}`),
    ])
      .then(([dataModule, municipalitiesModule]) => {
        // Prevent state update if component unmounted or slug/section changed
        if (isCancelled) return

        setEmbedData({
          data: dataModule.default as EmbedDataRow[],
          municipalities: municipalitiesModule.default as MunicipalityData[],
          loading: false,
          error: null,
        })
      })
      .catch((err) => {
        // Prevent state update if component unmounted or slug/section changed
        if (isCancelled) return

        // More specific error messages
        let errorMessage = "Failed to load data"
        if (err.message?.includes("Cannot find module")) {
          errorMessage = `Data file not found. Please check that the paths in embed-config.ts are correct:\n- ${standardConfig.dataPath}\n- ${standardConfig.municipalitiesPath}`
        } else if (err.message) {
          errorMessage = `Failed to load data: ${err.message}`
        }

        setEmbedData({
          data: null,
          municipalities: null,
          loading: false,
          error: errorMessage,
        })
      })

    // Cleanup function to prevent race conditions
    return () => {
      isCancelled = true
    }
  }, [slug, section])

  // Get config
  const config = getEmbedConfig(slug, section)

  if (!config) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Embed niet gevonden: {slug}/{section}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Deze combinatie van analyse en sectie is niet beschikbaar voor embedding.
        </p>
      </div>
    )
  }

  // Handle custom embeds
  if (config.type === "custom") {
    // Registry of known custom components
    const CUSTOM_COMPONENTS: Record<string, React.ComponentType<any>> = {
      StartersStoppersEmbed: StartersStoppersEmbed,
    }

    // Validate component is registered
    if (!CUSTOM_COMPONENTS[config.component]) {
      return (
        <div className="p-8 text-center">
          <p className="text-red-500">
            Custom component &quot;{config.component}&quot; not registered
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Add it to CUSTOM_COMPONENTS in EmbedClient.tsx
          </p>
        </div>
      )
    }

    // Handle StartersStoppersEmbed
    if (config.component === "StartersStoppersEmbed") {
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

      const Component = CUSTOM_COMPONENTS[config.component]
      return (
        <Component
          section={section as StartersStoppersSection}
          viewType={urlParams.view}
          horizon={urlParams.horizon}
          region={urlParams.region}
          province={urlParams.province}
          sector={urlParams.sector}
        />
      )
    }

    // Generic fallback for other custom components
    const Component = CUSTOM_COMPONENTS[config.component]
    return <Component slug={slug} section={section} urlParams={urlParams} />
  }

  // Handle standard embeds
  if (config.type === "standard") {
    if (embedData.loading) {
      return (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Laden...</p>
        </div>
      )
    }

    if (embedData.error) {
      return (
        <div className="p-8 text-center">
          <p className="text-red-500 whitespace-pre-wrap">{embedData.error}</p>
        </div>
      )
    }

    if (!embedData.data || !embedData.municipalities) {
      return (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Geen data beschikbaar</p>
        </div>
      )
    }

    return (
      <EmbeddableSection
        title={config.title}
        data={embedData.data}
        municipalities={embedData.municipalities}
        metric={config.metric}
        label={config.label}
        viewType={urlParams.view}
      />
    )
  }

  // Unsupported custom component
  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">
        Onbekend embed type: {config.type}
      </p>
    </div>
  )
}
