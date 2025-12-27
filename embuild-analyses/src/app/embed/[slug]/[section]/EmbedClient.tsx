"use client"

import React, { useEffect, useState } from "react"
import { EmbeddableSection } from "@/components/analyses/shared/EmbeddableSection"
import { StartersStoppersEmbed } from "@/components/analyses/starters-stoppers/StartersStoppersEmbed"
import { VastgoedVerkopenEmbed } from "@/components/analyses/vastgoed-verkopen/VastgoedVerkopenEmbed"
import { FaillissementenEmbed } from "@/components/analyses/faillissementen/FaillissementenEmbed"
import { HuishoudensgroeiEmbed } from "@/components/analyses/huishoudensgroei/HuishoudensgroeiEmbed"
import { ProvinceCode, RegionCode } from "@/lib/geo-utils"
import { getEmbedConfig } from "@/lib/embed-config"
import { EmbedDataRow, MunicipalityData } from "@/lib/embed-types"
import { getEmbedDataModule } from "@/lib/embed-data-registry"

type ViewType = "chart" | "table" | "map"
type StopHorizon = 1 | 2 | 3 | 4 | 5
type StartersStoppersSection = "starters" | "stoppers" | "survival"
type ChartOrTableViewType = "chart" | "table"

interface EmbedClientProps {
  slug: string
  section: string
}

/**
 * Props for StartersStoppersEmbed custom component
 */
interface StartersStoppersEmbedProps {
  section: StartersStoppersSection
  viewType: ViewType
  horizon: StopHorizon
  region: RegionCode | null
  province: ProvinceCode | null
  sector: string | null
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

function toChartOrTableViewType(viewType: ViewType): ChartOrTableViewType {
  return viewType === "table" ? "table" : "chart"
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

  // Load data from registry for standard embeds
  useEffect(() => {
    const config = getEmbedConfig(slug, section)
    if (!config || config.type !== "standard") return

    setEmbedData((prev) => ({ ...prev, loading: true }))

    try {
      // Use synchronous registry lookup instead of dynamic imports
      // This makes all data paths explicit for the bundler (webpack/vite)
      const dataModule = getEmbedDataModule(slug, section)

      if (!dataModule) {
        // Developer error: config exists but data not registered
        console.error("[EmbedClient] Data not found in registry:", {
          slug,
          section,
          hint: "Add this embed to EMBED_DATA_REGISTRY in embed-data-registry.ts",
        })

        setEmbedData({
          data: null,
          municipalities: null,
          loading: false,
          error: "Data niet beschikbaar. Neem contact op met de beheerder.",
        })
        return
      }

      // Data is already validated in the registry
      setEmbedData({
        data: dataModule.data,
        municipalities: dataModule.municipalities,
        loading: false,
        error: null,
      })
    } catch (err) {
      // Log error for debugging
      console.error("[EmbedClient] Failed to load data:", {
        slug,
        section,
        error: err,
      })

      // User-friendly error message (Dutch)
      const errorMessage =
        err instanceof Error
          ? `Fout bij laden van data: ${err.message}`
          : "Er is een fout opgetreden bij het laden van de data."

      setEmbedData({
        data: null,
        municipalities: null,
        loading: false,
        error: errorMessage,
      })
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

    // Handle VastgoedVerkopenEmbed
    if (config.component === "VastgoedVerkopenEmbed") {
      const validSections = ["transacties", "prijzen", "transacties-kwartaal", "prijzen-kwartaal"]
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}
            </p>
          </div>
        )
      }

      return (
        <VastgoedVerkopenEmbed
          section={section as "transacties" | "prijzen" | "transacties-kwartaal" | "prijzen-kwartaal"}
          viewType={toChartOrTableViewType(urlParams.view)}
          geo={urlParams.region}
          type={urlParams.sector}
        />
      )
    }

    // Handle FaillissementenEmbed
    if (config.component === "FaillissementenEmbed") {
      const validSections = ["evolutie", "leeftijd", "bedrijfsgrootte", "sectoren"]
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}
            </p>
          </div>
        )
      }

      return (
        <FaillissementenEmbed
          section={section as "evolutie" | "leeftijd" | "bedrijfsgrootte" | "sectoren"}
          viewType={toChartOrTableViewType(urlParams.view)}
          sector={urlParams.sector ?? "F"}
          year={urlParams.horizon}
          timeRange={(urlParams.view === "table" || urlParams.view === "map") ? "yearly" : "monthly"}
        />
      )
    }

    // Handle HuishoudensgroeiEmbed
    if (config.component === "HuishoudensgroeiEmbed") {
      const validSections = ["evolutie", "ranking", "size-breakdown"]
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}
            </p>
          </div>
        )
      }

      return (
        <HuishoudensgroeiEmbed
          section={section as "evolutie" | "ranking" | "size-breakdown"}
          viewType={toChartOrTableViewType(urlParams.view)}
          geo={urlParams.region}
          horizonYear={urlParams.horizon ?? 2033}
          showDecline={urlParams.sector === "decline"}
        />
      )
    }

    // Unknown custom component
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">
          Custom component &quot;{config.component}&quot; not registered
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Add handling for this component in EmbedClient.tsx
        </p>
      </div>
    )
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
        Onbekend embed type voor: {slug}/{section}
      </p>
    </div>
  )
}
