"use client"

import { useState, useEffect, useMemo } from "react"
import { MunicipalityMap } from "./MunicipalityMap"
import { MunicipalitySearch } from "./MunicipalitySearch"
import { loadMunicipalities } from "@/lib/map-utils"

type UnknownRecord = Record<string, unknown>

interface MapSectionProps<TData extends UnknownRecord = UnknownRecord> {
  /** Data array - MUST contain municipality-level data with NIS codes */
  data: TData[]

  /** Accessor for municipality NIS code (5-digit code) */
  getGeoCode?: (d: TData) => string | number | null | undefined

  /** Accessor for metric value */
  getValue?: (d: TData) => number | null | undefined

  /** Accessor for period (year, quarter, etc.) */
  getPeriod?: (d: TData) => number | string

  /** Available periods for time slider */
  periods?: (number | string)[]

  /** Initial period to display */
  initialPeriod?: number | string

  /** Show time slider */
  showTimeSlider?: boolean

  /** Format function for values */
  formatValue?: (value: number) => string

  /** Label for tooltips */
  tooltipLabel?: string

  /** Map height in pixels */
  height?: number

  /** Color scheme */
  colorScheme?: "blue" | "green" | "orange" | "purple" | "red"

  /** Show province boundaries as overlay */
  showProvinceBoundaries?: boolean

  /** Optional class name */
  className?: string
}

/**
 * MapSection - Simplified map component for MUNICIPALITY-LEVEL data only
 *
 * IMPORTANT: This component requires municipality-level data with NIS codes.
 * - Do NOT pass province or region data
 * - Data must have a municipality code field (5-digit NIS code)
 * - If you don't have municipality data, don't show a map
 *
 * Note on fusions & Flanders-only datasets:
 * - If your dataset uses pre-fusion NIS codes, normalize or aggregate codes
 *   (see `normalizeNisCode` / `aggregateByNormalizedNis` in
 *   `src/lib/nis-fusion-utils.ts`) so values map to current municipalities.
 * - When a dataset contains only Flemish municipalities, the map will
 *   automatically use a Flanders-focused viewport and hide non-Flemish
 *   municipalities to avoid showing irrelevant empty borders.
 *
 * Features:
 * - Municipality search/autocomplete
 * - Auto-zoom to selected municipality
 * - Province boundary overlay
 *
 * @example
 * ```tsx
 * // CORRECT: Municipality-level data
 * const municipalityData = [
 *   { m: '11001', value: 100, y: 2024 },  // Aartselaar
 *   { m: '12002', value: 200, y: 2024 },  // Antwerpen
 * ]
 *
 * <MapSection
 *   data={municipalityData}
 *   getGeoCode={(d) => d.m}
 *   getValue={(d) => d.value}
 *   showProvinceBoundaries={true}
 * />
 * ```
 */
export function MapSection<TData extends UnknownRecord = UnknownRecord>({
  data,
  getGeoCode,
  getValue,
  getPeriod,
  periods = [],
  initialPeriod,
  showTimeSlider = false,
  formatValue,
  tooltipLabel,
  height = 500,
  colorScheme = "blue",
  showProvinceBoundaries = true,
  className,
}: MapSectionProps<TData>) {
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null)
  const [municipalities, setMunicipalities] = useState<Array<{ code: string; name: string }>>([])

  // Load municipality list for search
  useEffect(() => {
    loadMunicipalities().then((data) => {
      setMunicipalities(data)
    })
  }, [])

  // Filter available municipalities based on data availability
  const availableMunicipalities = useMemo(() => {
    if (!getGeoCode) return municipalities

    // Get all municipality codes that have data
    const codesWithData = new Set(
      data
        .map((d) => String(getGeoCode(d) ?? ""))
        .filter((code) => code !== "" && code.length === 5) // Must be 5-digit NIS code
    )

    // Only show municipalities that have data
    return municipalities.filter((m) => codesWithData.has(m.code))
  }, [municipalities, data, getGeoCode])

  return (
    <div className={className}>
      {/* Municipality Search */}
      <div className="mb-4">
        <MunicipalitySearch
          selectedMunicipality={selectedMunicipality}
          onSelect={setSelectedMunicipality}
          municipalities={availableMunicipalities}
          placeholder="Zoek een gemeente..."
        />
      </div>

      {/* Map */}
      <MunicipalityMap
        data={data}
        getGeoCode={getGeoCode}
        getValue={getValue}
        getPeriod={getPeriod}
        periods={periods}
        initialPeriod={initialPeriod}
        showTimeSlider={showTimeSlider}
        selectedMunicipality={selectedMunicipality}
        onSelectMunicipality={setSelectedMunicipality}
        formatValue={formatValue}
        tooltipLabel={tooltipLabel}
        height={height}
        colorScheme={colorScheme}
        showProvinceBoundaries={showProvinceBoundaries}
      />
    </div>
  )
}
