"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search } from 'lucide-react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label,
} from 'recharts'
import { ExportButtons } from "../shared/ExportButtons"
import { HierarchicalFilter } from "../shared/HierarchicalFilter"
import { getMunicipalityName } from "./nisUtils"
import { stripPrefix } from "./labelUtils"
import {
  createAutoScaledFormatter,
  formatCurrency as formatFullCurrency,
} from "@/lib/number-formatters"
import { getPublicPath } from "@/lib/path-utils"

interface REKLookups {
  niveau3s: Array<{ Niveau_3: string }>
  alg_rekenings: Array<{ Niveau_3: string; Alg_rekening: string }>
  municipalities: Record<string, string>
}

interface REKRecord {
  NIS_code: string
  Rapportjaar: number
  Niveau_3: string
  Alg_rekening: string
  Totaal: number
  Per_inwoner: number
}

interface ScatterDataPoint {
  municipality: string
  NIS_code: string
  value: number
  x: number // Index for X axis
}

function validateLookups(data: unknown): REKLookups {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid lookups: expected object')
  }
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.niveau3s) || !Array.isArray(obj.alg_rekenings) ||
      !obj.municipalities || typeof obj.municipalities !== 'object') {
    throw new Error('Invalid lookups: missing or invalid fields')
  }
  return {
    niveau3s: obj.niveau3s as Array<{ Niveau_3: string }>,
    alg_rekenings: obj.alg_rekenings as Array<{ Niveau_3: string; Alg_rekening: string }>,
    municipalities: obj.municipalities as Record<string, string>
  }
}

function validateMetadata(data: unknown): { bv_chunks: number; rek_chunks: number } {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid metadata: expected object')
  }
  const obj = data as Record<string, unknown>
  if (typeof obj.bv_chunks !== 'number' || typeof obj.rek_chunks !== 'number') {
    throw new Error('Invalid metadata: missing or invalid chunk counts')
  }
  return obj as { bv_chunks: number; rek_chunks: number }
}

function validateChunkData(data: unknown): REKRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid chunk data: expected array')
  }
  return data as REKRecord[]
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, selectedMetric }: {
  active?: boolean
  payload?: Array<{ payload: ScatterDataPoint }>
  selectedMetric: 'Totaal' | 'Per_inwoner'
}) => {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload
  const formattedValue = selectedMetric === 'Totaal'
    ? formatFullCurrency(data.value)
    : `€ ${data.value.toFixed(2)}`

  return (
    <div className="bg-background border border-border rounded-md shadow-lg p-2 text-sm">
      <p className="font-medium">{data.municipality}</p>
      <p className="text-muted-foreground">{formattedValue}</p>
    </div>
  )
}

export function InvesteringenREKScatterSection() {
  const [lookups, setLookups] = useState<REKLookups | null>(null)
  const [muniData, setMuniData] = useState<REKRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadedChunks, setLoadedChunks] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [selectedNiveau3, setSelectedNiveau3] = useState<string>('')
  const [selectedMetric, setSelectedMetric] = useState<'Totaal' | 'Per_inwoner'>('Totaal')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Fixed year: only 2026 data available
  const selectedYear = 2026

  // Load initial data and start chunk loading
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        setMuniData([])
        setLoadedChunks(0)

        const [metaRes, lookupsRes] = await Promise.all([
          fetch(getPublicPath('/data/gemeentelijke-investeringen/metadata.json')),
          fetch(getPublicPath('/data/gemeentelijke-investeringen/rek_lookups.json'))
        ])

        if (cancelled) return

        if (!metaRes.ok) throw new Error(`Failed to load metadata: ${metaRes.statusText}`)
        if (!lookupsRes.ok) throw new Error(`Failed to load lookups: ${lookupsRes.statusText}`)

        const meta = validateMetadata(await metaRes.json())
        const lookupsData = validateLookups(await lookupsRes.json())

        if (cancelled) return

        setLookups(lookupsData)
        setTotalChunks(meta.rek_chunks)

        // Set default niveau3 to first stripped value
        if (lookupsData.niveau3s.length > 0) {
          setSelectedNiveau3(stripPrefix(lookupsData.niveau3s[0].Niveau_3))
        }

        setIsLoading(false)

        // Load chunks sequentially
        const allChunks: REKRecord[] = []
        for (let i = 0; i < meta.rek_chunks; i++) {
          if (cancelled) return

          const chunkRes = await fetch(getPublicPath(`/data/gemeentelijke-investeringen/rek_municipality_data_chunk_${i}.json`))
          if (!chunkRes.ok) {
            throw new Error(`Failed to load chunk ${i}: ${chunkRes.statusText}`)
          }
          const chunkData = validateChunkData(await chunkRes.json())
          allChunks.push(...chunkData)
          setMuniData([...allChunks])
          setLoadedChunks(i + 1)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load REK data:', err)
          setError(err instanceof Error ? err.message : 'Fout bij het laden van de data')
          setIsLoading(false)
        }
      }
    }
    init()

    return () => {
      cancelled = true
    }
  }, [])

  // Get available niveau3 options
  const niveau3Options = useMemo(() => {
    if (!lookups) return []
    return lookups.niveau3s.map(n => stripPrefix(n.Niveau_3)).sort()
  }, [lookups])

  // Scatter data: aggregate by municipality for selected year and niveau3
  const scatterData = useMemo(() => {
    if (!selectedNiveau3 || !lookups) return []

    // Find original niveau3 value (with prefix) for filtering
    const originalNiveau3 = lookups.niveau3s.find(
      n => stripPrefix(n.Niveau_3) === selectedNiveau3
    )?.Niveau_3

    if (!originalNiveau3) return []

    const byMuni: Record<string, number> = {}

    muniData
      .filter(d => d.Rapportjaar === selectedYear && d.Niveau_3 === originalNiveau3)
      .forEach(record => {
        if (!byMuni[record.NIS_code]) {
          byMuni[record.NIS_code] = 0
        }
        byMuni[record.NIS_code] += record[selectedMetric]
      })

    return Object.entries(byMuni)
      .map(([nisCode, value], index) => ({
        municipality: getMunicipalityName(nisCode),
        NIS_code: nisCode,
        value,
        x: index,
      }))
      .sort((a, b) => a.municipality.localeCompare(b.municipality))
      .map((item, index) => ({ ...item, x: index }))
  }, [muniData, selectedNiveau3, selectedMetric, selectedYear, lookups])

  // Calculate percentiles for dynamic axis scaling
  const { yMin, yMax } = useMemo(() => {
    if (scatterData.length === 0) return { yMin: 0, yMax: 100 }

    const values = scatterData.map(d => d.value).sort((a, b) => a - b)
    const p5 = values[Math.floor(values.length * 0.05)] || 0
    const p95 = values[Math.floor(values.length * 0.95)] || values[values.length - 1]

    // Add 10% padding
    const padding = (p95 - p5) * 0.1
    return {
      yMin: Math.max(0, p5 - padding),
      yMax: p95 + padding
    }
  }, [scatterData])

  // Auto-scale formatters
  const { formatter: valueFormatter } = useMemo(() => {
    const values = scatterData.map(d => d.value)
    return createAutoScaledFormatter(values, selectedMetric === 'Totaal')
  }, [scatterData, selectedMetric])

  // Filtered data with search highlighting
  const { displayData, highlightedIndex } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { displayData: scatterData, highlightedIndex: -1 }
    }

    const query = searchQuery.toLowerCase()
    const index = scatterData.findIndex(d =>
      d.municipality.toLowerCase().includes(query)
    )

    return { displayData: scatterData, highlightedIndex: index }
  }, [scatterData, searchQuery])

  // Export data
  const exportData = useMemo(() => {
    return scatterData.map(d => ({
      label: d.municipality,
      value: d.value
    }))
  }, [scatterData])

  if (error) {
    return (
      <Card>
        <CardContent className="h-64 flex flex-col items-center justify-center space-y-4">
          <p className="text-sm text-destructive font-medium">Fout bij het laden van de data</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} size="sm">
            Opnieuw proberen
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !lookups) {
    return (
      <Card>
        <CardContent className="h-64 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground italic">Laden van data...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gemeentelijke Investeringen per Economische Rekening - Scatter Plot</CardTitle>
          <div className="flex items-center gap-4">
            {loadedChunks < totalChunks && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                Laden data: {Math.round((loadedChunks / totalChunks) * 100)}%
              </div>
            )}
            <ExportButtons
              title="Investeringen per Economische Rekening Scatter"
              slug="gemeentelijke-investeringen"
              sectionId="investments-rek-scatter"
              viewType="table"
              data={exportData}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Vergelijk investeringen per gemeente voor een specifiek economisch niveau. Enkel rapportjaar 2026 beschikbaar.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <Button
                variant={selectedMetric === 'Totaal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('Totaal')}
                className="h-9"
              >
                Totaal
              </Button>
              <Button
                variant={selectedMetric === 'Per_inwoner' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('Per_inwoner')}
                className="h-9"
              >
                Per inwoner
              </Button>
            </div>
            <HierarchicalFilter
              value={selectedNiveau3}
              onChange={setSelectedNiveau3}
              options={niveau3Options}
              placeholder="Selecteer niveau 3"
              minWidth={250}
            />
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek gemeente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* Scatter Chart */}
          <div className="w-full h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 80 }}>
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, displayData.length - 1]}
                  tick={false}
                  label={{ value: 'Gemeenten', position: 'insideBottom', offset: -10 }}
                />
                <YAxis
                  type="number"
                  dataKey="value"
                  domain={[yMin, yMax]}
                  tickFormatter={valueFormatter}
                >
                  <Label
                    value={selectedMetric === 'Totaal' ? 'Totale uitgave (€)' : 'Uitgave per inwoner (€)'}
                    angle={-90}
                    position="insideLeft"
                    offset={10}
                  />
                </YAxis>
                <Tooltip
                  content={<CustomTooltip selectedMetric={selectedMetric} />}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Scatter data={displayData} fill="#10b981">
                  {displayData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === highlightedIndex ? '#ef4444' : '#10b981'}
                      opacity={highlightedIndex >= 0 && index !== highlightedIndex ? 0.3 : 1}
                      r={index === highlightedIndex ? 6 : 4}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Niveau 3: <strong>{selectedNiveau3}</strong> | Rapportjaar: <strong>2026</strong> | {selectedMetric === 'Totaal' ? 'Totale uitgave' : 'Uitgave per inwoner'} | {displayData.length} gemeenten
          </p>
          {highlightedIndex >= 0 && (
            <p className="text-sm text-primary mt-1">
              Gemarkeerd: <strong>{displayData[highlightedIndex].municipality}</strong> - {selectedMetric === 'Totaal' ? formatFullCurrency(displayData[highlightedIndex].value) : `€ ${displayData[highlightedIndex].value.toFixed(2)}`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
