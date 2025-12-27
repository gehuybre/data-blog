/**
 * Type definitions for embed data structures
 */

/**
 * Standard data row structure from processed JSON files
 * Contains municipality code (m), year (y), quarter (q), and metric values
 */
export interface StandardEmbedDataRow {
  m: number // Municipality code
  y: number // Year
  q: number // Quarter
  [metric: string]: number // Dynamic metric values (e.g., "ren", "new")
}

/**
 * Generic display data row with label, value, and optional period information
 * Used for rendering tables and charts
 */
export interface EmbedDataRow {
  label: string
  value: number
  periodCells?: Array<string | number>
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
