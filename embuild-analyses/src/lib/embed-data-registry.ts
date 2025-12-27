/**
 * Centralized registry for embed data imports
 *
 * This file provides explicit imports for all embed data files, making them
 * visible to the bundler (webpack/vite) at build time. This is more reliable
 * than dynamic imports with template literals.
 *
 * When adding a new embeddable section:
 * 1. Add the config to EMBED_CONFIGS in embed-config.ts
 * 2. Add the data imports to this registry
 * 3. Map the slug/section to the imported data in getEmbedDataModule()
 */

import type { EmbedDataRow, MunicipalityData, StandardEmbedDataRow } from "./embed-types"
import { validateMunicipalityData } from "./embed-types"
import {
  transformToEmbedDataRows,
  validateStandardEmbedDataRow,
} from "./embed-data-transformers"

// Explicit imports for vergunningen-goedkeuringen
import vergunningenDataQuarterlyRaw from "../../analyses/vergunningen-goedkeuringen/results/data_quarterly.json"
import vergunningenMunicipalitiesRaw from "../../analyses/vergunningen-goedkeuringen/results/municipalities.json"

/**
 * Data module type - matches the structure returned by dynamic imports
 */
export interface EmbedDataModule {
  data: EmbedDataRow[]
  municipalities: MunicipalityData[]
}

/**
 * Validate and transform raw quarterly data
 * This ensures type safety and converts to the correct format for rendering
 */
const vergunningenDataQuarterly = validateStandardEmbedDataRow(
  vergunningenDataQuarterlyRaw as unknown
) as StandardEmbedDataRow[]

const vergunningenMunicipalities = validateMunicipalityData(
  vergunningenMunicipalitiesRaw as unknown
)

/**
 * Registry of all embed data modules
 * Maps "slug/section" to the imported data and municipalities
 *
 * Note: Data is validated and transformed at module load time.
 * Raw data (StandardEmbedDataRow format) is transformed to display format (EmbedDataRow)
 * using the metric specified in the embed config.
 */
const EMBED_DATA_REGISTRY: Record<string, EmbedDataModule> = {
  "vergunningen-goedkeuringen/renovatie": {
    data: transformToEmbedDataRows(vergunningenDataQuarterly, "ren"),
    municipalities: vergunningenMunicipalities,
  },
  "vergunningen-goedkeuringen/nieuwbouw": {
    data: transformToEmbedDataRows(vergunningenDataQuarterly, "new"),
    municipalities: vergunningenMunicipalities,
  },
}

/**
 * Get embed data module for a specific slug/section combination
 *
 * This is a synchronous alternative to dynamic imports that makes all
 * data paths explicit for the bundler.
 *
 * @param slug - Analysis slug
 * @param section - Section identifier
 * @returns Data module or null if not found
 */
export function getEmbedDataModule(
  slug: string,
  section: string
): EmbedDataModule | null {
  const key = `${slug}/${section}`
  return EMBED_DATA_REGISTRY[key] ?? null
}

/**
 * Check if embed data is registered for a slug/section
 */
export function hasEmbedData(slug: string, section: string): boolean {
  const key = `${slug}/${section}`
  return key in EMBED_DATA_REGISTRY
}
