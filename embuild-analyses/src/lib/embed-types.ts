/**
 * Type definitions for embed data structures
 */

/**
 * Generic data row with label, value, and optional period information
 */
export interface EmbedDataRow {
  label: string
  value: number
  periodCells?: Array<string | number>
  [key: string]: unknown // Allow additional properties
}

/**
 * Municipality data structure
 */
export interface MunicipalityData {
  code: number
  name: string
}

/**
 * Standard embed data structure loaded from JSON files
 */
export interface StandardEmbedData {
  data: EmbedDataRow[]
  municipalities: MunicipalityData[]
}
