/**
 * Centralized configuration for embeddable analysis sections
 *
 * This file defines all embeddable sections across analyses in one place.
 * To add a new embeddable section:
 * 1. Add an entry to EMBED_CONFIGS with the analysis slug and section details
 * 2. The system will automatically generate routes and handle data loading
 */

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
}

export interface CustomEmbedConfig {
  type: "custom"
  /** Display title for the embed */
  title: string
  /** Component name to render (must be registered in EmbedClient) */
  component: string
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
]

/**
 * Get embed configuration for a specific analysis and section
 */
export function getEmbedConfig(slug: string, section: string): EmbedConfig | null {
  const analysisConfig = EMBED_CONFIGS.find((a) => a.slug === slug)
  if (!analysisConfig) return null
  return analysisConfig.sections[section] ?? null
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
