"use client"

import { useEffect, useState } from "react"
import { EmbeddableSection } from "@/components/analyses/shared/EmbeddableSection"

// Import data for each analysis
import vergunningenData from "../../../../../analyses/vergunningen-goedkeuringen/results/data_quarterly.json"
import vergunningenMunicipalities from "../../../../../analyses/vergunningen-goedkeuringen/results/municipalities.json"

type ViewType = "chart" | "table" | "map"

interface EmbedClientProps {
  slug: string
  section: string
}

// Configuration for embeddable sections
const EMBED_CONFIGS: Record<string, Record<string, {
  title: string
  data: unknown[]
  municipalities: unknown[]
  metric: string
  label?: string
}>> = {
  "vergunningen-goedkeuringen": {
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
  },
}

function getViewTypeFromUrl(): ViewType {
  if (typeof window === "undefined") return "chart"
  const params = new URLSearchParams(window.location.search)
  const view = params.get("view")
  if (view === "table" || view === "map") return view
  return "chart"
}

export function EmbedClient({ slug, section }: EmbedClientProps) {
  const [viewType, setViewType] = useState<ViewType>("chart")

  useEffect(() => {
    setViewType(getViewTypeFromUrl())
  }, [])

  const config = EMBED_CONFIGS[slug]?.[section]

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
      viewType={viewType}
    />
  )
}
