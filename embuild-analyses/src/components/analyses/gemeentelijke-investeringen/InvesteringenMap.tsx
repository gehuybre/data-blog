"use client"

import React, { useMemo } from 'react'
import { MunicipalityMap } from "../shared/MunicipalityMap"

interface MapData {
  municipality: string
  value: number
  nis_code?: string | null
}

interface InvesteringenMapProps {
  data: MapData[]
  selectedMetric: 'total' | 'per_capita'
  title?: string
}

const formatNumber = (num: number) => new Intl.NumberFormat('nl-BE').format(Math.round(num))
const formatCurrency = (num: number) => `€ ${formatNumber(num)}`

export function InvesteringenMap({ data, selectedMetric, title }: InvesteringenMapProps) {
  // Transform data for map
  const mapData = useMemo(() => {
    return data
      .filter(d => d.nis_code) // Only include municipalities with NIS codes
      .map(d => ({
        municipalityCode: d.nis_code!,
        municipalityName: d.municipality,
        value: d.value,
      }))
  }, [data])

  const valueLabel = selectedMetric === 'total' ? 'Totale investering' : 'Investering per inwoner'

  if (mapData.length === 0) {
    return (
      <div className="w-full p-8 text-center text-muted-foreground">
        Geen kaartdata beschikbaar
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <MunicipalityMap
        data={mapData}
        getGeoCode={(d) => d.municipalityCode}
        getValue={(d) => d.value}
        formatValue={formatCurrency}
        tooltipLabel={valueLabel}
        colorScheme="blue"
        showProvinceBoundaries={true}
      />
    </div>
  )
}
