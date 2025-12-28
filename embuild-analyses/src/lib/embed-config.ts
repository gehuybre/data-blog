/**
 * Centralized configuration for embeddable analysis sections
 *
 * This file defines all embeddable sections across analyses in one place.
 * To add a new embeddable section:
 * 1. Add an entry to EMBED_CONFIGS with the analysis slug and section details
 * 2. The system will automatically generate routes and handle data loading
 */

import { validateEmbedPath } from "./embed-path-validation"

export type EmbedType = "standard" | "custom"

export interface StandardEmbedConfig {
  type: "standard"
  /** Display title for the embed */
  title: string
  /** Path to the data JSON file (relative to analyses folder) */
  dataPath: string
  /** Path to municipalities JSON file (relative to analyses folder) */
  municipalitiesPath: string
  /** Metric key to display */
  metric: string
  /** Label for the metric (e.g., "Aantal") */
  label?: string
  /** Height of the iframe in pixels (default: 500) */
  height?: number
}

export interface CustomEmbedConfig {
  type: "custom"
  /** Display title for the embed */
  title: string
  /** Component name to render (must be registered in EmbedClient) */
  component: string
  /** Height of the iframe in pixels (default: 500) */
  height?: number
}

export type EmbedConfig = StandardEmbedConfig | CustomEmbedConfig

export interface AnalysisEmbedConfig {
  /** Analysis slug */
  slug: string
  /** Map of section IDs to their configurations */
  sections: Record<string, EmbedConfig>
}

/**
 * Main embed configuration registry
 * Add new embeddable sections here
 */
export const EMBED_CONFIGS: AnalysisEmbedConfig[] = [
  {
    slug: "vergunningen-goedkeuringen",
    sections: {
      renovatie: {
        type: "standard",
        title: "Renovatie (Gebouwen)",
        dataPath: "vergunningen-goedkeuringen/results/data_quarterly.json",
        municipalitiesPath: "vergunningen-goedkeuringen/results/municipalities.json",
        metric: "ren",
        label: "Aantal",
      },
      nieuwbouw: {
        type: "standard",
        title: "Nieuwbouw (Gebouwen)",
        dataPath: "vergunningen-goedkeuringen/results/data_quarterly.json",
        municipalitiesPath: "vergunningen-goedkeuringen/results/municipalities.json",
        metric: "new",
        label: "Aantal",
      },
    },
  },
  {
    slug: "starters-stoppers",
    sections: {
      starters: {
        type: "custom",
        title: "Aantal starters",
        component: "StartersStoppersEmbed",
      },
      stoppers: {
        type: "custom",
        title: "Aantal stoppers",
        component: "StartersStoppersEmbed",
      },
      survival: {
        type: "custom",
        title: "Overlevingskans",
        component: "StartersStoppersEmbed",
      },
    },
  },
  {
    slug: "vastgoed-verkopen",
    sections: {
      transacties: {
        type: "custom",
        title: "Aantal transacties",
        component: "VastgoedVerkopenEmbed",
      },
      prijzen: {
        type: "custom",
        title: "Mediaanprijs",
        component: "VastgoedVerkopenEmbed",
      },
      "transacties-kwartaal": {
        type: "custom",
        title: "Transacties per kwartaal",
        component: "VastgoedVerkopenEmbed",
      },
      "prijzen-kwartaal": {
        type: "custom",
        title: "Mediaanprijs per kwartaal",
        component: "VastgoedVerkopenEmbed",
      },
    },
  },
  {
    slug: "faillissementen",
    sections: {
      evolutie: {
        type: "custom",
        title: "Evolutie faillissementen",
        component: "FaillissementenEmbed",
      },
      leeftijd: {
        type: "custom",
        title: "Bedrijfsleeftijd",
        component: "FaillissementenEmbed",
      },
      bedrijfsgrootte: {
        type: "custom",
        title: "Bedrijfsgrootte",
        component: "FaillissementenEmbed",
      },
      sectoren: {
        type: "custom",
        title: "Sectorvergelijking",
        component: "FaillissementenEmbed",
      },
    },
  },
  {
    slug: "huishoudensgroei",
    sections: {
      evolutie: {
        type: "custom",
        title: "Evolutie aantal huishoudens",
        component: "HuishoudensgroeiEmbed",
      },
      ranking: {
        type: "custom",
        title: "Gemeenten ranking",
        component: "HuishoudensgroeiEmbed",
      },
      "size-breakdown": {
        type: "custom",
        title: "Samenstelling huishoudens",
        component: "HuishoudensgroeiEmbed",
      },
    },
  },
  {
    slug: "energiekaart-premies",
    sections: {
      "aantal-premies": {
        type: "custom",
        title: "Aantal toegekende premies",
        component: "EnergiekaartPremiesEmbed",
        height: 700,
      },
      "bedrag-premies": {
        type: "custom",
        title: "Totaal bedrag premies",
        component: "EnergiekaartPremiesEmbed",
        height: 700,
      },
      "aantal-beschermd": {
        type: "custom",
        title: "Aantal premies beschermde afnemers",
        component: "EnergiekaartPremiesEmbed",
        height: 700,
      },
      "bedrag-beschermd": {
        type: "custom",
        title: "Bedrag premies beschermde afnemers",
        component: "EnergiekaartPremiesEmbed",
        height: 700,
      },
    },
  },
  {
    slug: "vergunningen-aanvragen",
    sections: {
      nieuwbouw: {
        type: "custom",
        title: "Nieuwbouw vergunningen",
        component: "VergunningenAanvragenEmbed",
        height: 600,
      },
      verbouw: {
        type: "custom",
        title: "Verbouw vergunningen",
        component: "VergunningenAanvragenEmbed",
        height: 600,
      },
      sloop: {
        type: "custom",
        title: "Sloop vergunningen",
        component: "VergunningenAanvragenEmbed",
        height: 600,
      },
    },
  },
]

/**
 * Validate standard embed configuration in development mode
 */
function validateStandardConfig(config: StandardEmbedConfig, slug: string, section: string): void {
  if (process.env.NODE_ENV !== "development") return

  const issues: string[] = []

  // Validate dataPath
  const dataPathResult = validateEmbedPath(config.dataPath, "dataPath", slug)
  if (!dataPathResult.valid) {
    issues.push(...dataPathResult.errors)
  }

  // Validate municipalitiesPath
  const municipalitiesPathResult = validateEmbedPath(
    config.municipalitiesPath,
    "municipalitiesPath",
    slug
  )
  if (!municipalitiesPathResult.valid) {
    issues.push(...municipalitiesPathResult.errors)
  }

  // Check required fields are present and non-empty
  if (!config.title || config.title.trim() === "") {
    issues.push("title is required and must not be empty")
  }

  if (!config.metric || config.metric.trim() === "") {
    issues.push("metric is required and must not be empty")
  }

  // Log validation issues as warnings
  if (issues.length > 0) {
    console.warn(
      `[embed-config] Validation issues for ${slug}/${section}:\n` +
      issues.map((issue) => `  - ${issue}`).join("\n")
    )
  }
}

/**
 * Get embed configuration for a specific analysis and section
 */
export function getEmbedConfig(slug: string, section: string): EmbedConfig | null {
  const analysisConfig = EMBED_CONFIGS.find((a) => a.slug === slug)
  if (!analysisConfig) return null

  const config = analysisConfig.sections[section] ?? null

  // Validate standard configs in development
  if (config && config.type === "standard") {
    validateStandardConfig(config, slug, section)
  }

  return config
}

/**
 * Get all embeddable sections as static params for Next.js
 */
export function getAllEmbedParams(): Array<{ slug: string; section: string }> {
  const params: Array<{ slug: string; section: string }> = []
  for (const analysis of EMBED_CONFIGS) {
    for (const section of Object.keys(analysis.sections)) {
      params.push({ slug: analysis.slug, section })
    }
  }
  return params
}

/**
 * Check if an analysis/section combination is embeddable
 */
export function isEmbeddable(slug: string, section: string): boolean {
  return getEmbedConfig(slug, section) !== null
}

/**
 * Get all valid section names for a specific analysis
 */
export function getValidSections(slug: string): string[] {
  const analysisConfig = EMBED_CONFIGS.find((a) => a.slug === slug)
  if (!analysisConfig) return []
  return Object.keys(analysisConfig.sections)
}
