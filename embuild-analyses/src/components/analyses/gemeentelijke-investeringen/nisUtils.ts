/**
 * Utilities for working with NIS codes and municipality names
 */

import bvLookups from '../../../../analyses/gemeentelijke-investeringen/results/bv_lookups.json'

// The municipalities lookup is shared between BV and REK
export const nisLookup: Record<string, string> = bvLookups.municipalities

/**
 * Get municipality name from NIS code
 */
export function getMunicipalityName(nisCode: string): string {
  return nisLookup[nisCode] || `Gemeente ${nisCode}`
}

/**
 * Get all municipalities sorted by name
 */
export function getAllMunicipalities(): Array<{ nisCode: string; name: string }> {
  return Object.entries(nisLookup)
    .map(([nisCode, name]) => ({ nisCode, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
