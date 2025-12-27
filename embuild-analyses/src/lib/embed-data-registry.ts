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

import type { EmbedDataRow, MunicipalityData } from "./embed-types"
import {
  validateEmbedDataRows,
  validateMunicipalityData,
} from "./embed-types"

// Explicit imports for vergunningen-goedkeuringen
import vergunningenDataQuarterly from "../../analyses/vergunningen-goedkeuringen/results/data_quarterly.json"
import vergunningenMunicipalities from "../../analyses/vergunningen-goedkeuringen/results/municipalities.json"

/**
 * Data module type - matches the structure returned by dynamic imports
 */
export interface EmbedDataModule {
  data: EmbedDataRow[]
  municipalities: MunicipalityData[]
}

/**
 * Registry of all embed data modules
 * Maps "slug/section" to the imported data and municipalities
 *
 * Note: Data is validated at runtime to ensure type safety
 */
const EMBED_DATA_REGISTRY: Record<string, EmbedDataModule> = {
  "vergunningen-goedkeuringen/renovatie": {
    data: validateEmbedDataRows(vergunningenDataQuarterly),
    municipalities: validateMunicipalityData(vergunningenMunicipalities),
  },
  "vergunningen-goedkeuringen/nieuwbouw": {
    data: validateEmbedDataRows(vergunningenDataQuarterly),
    municipalities: validateMunicipalityData(vergunningenMunicipalities),
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
