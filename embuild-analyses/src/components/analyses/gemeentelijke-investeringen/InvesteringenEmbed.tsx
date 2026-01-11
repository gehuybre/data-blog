"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { SimpleGeoFilter } from "./SimpleGeoFilter"
import { SimpleGeoContext } from "../shared/GeoContext"
import { HierarchicalFilter } from "../shared/HierarchicalFilter"
import { getMunicipalityName } from "./nisUtils"
import {
  createAutoScaledFormatter,
  getScaledLabel,
  formatCurrency as formatFullCurrency,
} from "@/lib/number-formatters"
import { getPublicPath } from "@/lib/path-utils"

interface BVLookups {
  domains: Array<{ BV_domein: string }>
  subdomeins: Array<{ BV_domein: string; BV_subdomein: string }>
  beleidsvelds: Array<{ BV_subdomein: string; Beleidsveld: string }>
  municipalities: Record<string, string>
}

interface REKLookups {
  hoofdrekeningen: Array<{ Economische_rekening_hoofdrekening: string }>
  rubrieken: Array<{
    Economische_rekening_hoofdrekening: string
    Economische_rekening_rubriek: string
  }>
  municipalities: Record<string, string>
}

interface BVRecord {
  NIS_code: string
  Rapportjaar: number
  BV_domein: string
  BV_subdomein: string
  Beleidsveld: string
  Totaal: number
  Per_inwoner: number
}

interface REKRecord {
  NIS_code: string
  Rapportjaar: number
  Economische_rekening_hoofdrekening: string
  Economische_rekening_rubriek: string
  Totaal: number
  Per_inwoner: number
}

interface BVVlaanderenRecord {
  Rapportjaar: number
  BV_domein: string
  BV_subdomein: string
  Beleidsveld: string
  Totaal: number
  Per_inwoner: number
}

interface REKVlaanderenRecord {
  Rapportjaar: number
  Economische_rekening_hoofdrekening: string
  Economische_rekening_rubriek: string
  Totaal: number
  Per_inwoner: number
}

type ViewType = "chart" | "table"
type Perspective = "bv" | "rek"

interface InvesteringenEmbedProps {
  section: "investments-bv" | "investments-rek"
  viewType?: ViewType
}

// Runtime validation helpers
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

function validateBVLookups(data: unknown): BVLookups {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid BV lookups: expected object')
  }
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.domains) || !Array.isArray(obj.subdomeins) ||
      !Array.isArray(obj.beleidsvelds) || !obj.municipalities || typeof obj.municipalities !== 'object') {
    throw new Error('Invalid BV lookups: missing or invalid fields')
  }
  return {
    domains: obj.domains as Array<{ BV_domein: string }>,
    subdomeins: obj.subdomeins as Array<{ BV_domein: string; BV_subdomein: string }>,
    beleidsvelds: obj.beleidsvelds as Array<{ BV_subdomein: string; Beleidsveld: string }>,
    municipalities: obj.municipalities as Record<string, string>
  }
}

function validateREKLookups(data: unknown): REKLookups {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid REK lookups: expected object')
  }
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.hoofdrekeningen) || !Array.isArray(obj.rubrieken) ||
      !obj.municipalities || typeof obj.municipalities !== 'object') {
    throw new Error('Invalid REK lookups: missing or invalid fields')
  }
  return {
    hoofdrekeningen: obj.hoofdrekeningen as Array<{ Economische_rekening_hoofdrekening: string }>,
    rubrieken: obj.rubrieken as Array<{
      Economische_rekening_hoofdrekening: string
      Economische_rekening_rubriek: string
    }>,
    municipalities: obj.municipalities as Record<string, string>
  }
}

function validateBVVlaanderenData(data: unknown): BVVlaanderenRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid BV Vlaanderen data: expected array')
  }
  return data as BVVlaanderenRecord[]
}

function validateREKVlaanderenData(data: unknown): REKVlaanderenRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid REK Vlaanderen data: expected array')
  }
  return data as REKVlaanderenRecord[]
}

function validateBVChunkData(data: unknown): BVRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid BV chunk data: expected array')
  }
  return data as BVRecord[]
}

function validateREKChunkData(data: unknown): REKRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid REK chunk data: expected array')
  }
  return data as REKRecord[]
}

export function InvesteringenEmbed({ section, viewType = "chart" }: InvesteringenEmbedProps) {
  const perspective: Perspective = section === "investments-bv" ? "bv" : "rek"

  const [bvLookups, setBVLookups] = useState<BVLookups | null>(null)
  const [rekLookups, setREKLookups] = useState<REKLookups | null>(null)
  const [bvVlaanderenData, setBVVlaanderenData] = useState<BVVlaanderenRecord[]>([])
  const [rekVlaanderenData, setREKVlaanderenData] = useState<REKVlaanderenRecord[]>([])
  const [bvMuniData, setBVMuniData] = useState<BVRecord[]>([])
  const [rekMuniData, setREKMuniData] = useState<REKRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadedChunks, setLoadedChunks] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // BV filters
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [selectedSubdomein, setSelectedSubdomein] = useState<string>('')
  const [selectedBeleidsveld, setSelectedBeleidsveld] = useState<string>('')

  // REK filters
  const [selectedHoofdrekening, setSelectedHoofdrekening] = useState<string>('')
  const [selectedRubriek, setSelectedRubriek] = useState<string>('')

  const [selectedMetric, setSelectedMetric] = useState<'Totaal' | 'Per_inwoner'>('Totaal')
  const [geoSelection, setGeoSelection] = useState<{
    type: 'all' | 'region' | 'province' | 'municipality'
    code?: string
  }>({ type: 'all' })
  const [currentView, setCurrentView] = useState<ViewType>(viewType)

  // Load initial data and start chunk loading
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Reset data to prevent double-loading on remount
        setBVMuniData([])
        setREKMuniData([])
        setLoadedChunks(0)

        if (perspective === "bv") {
          const [metaRes, lookupsRes, vlaanderenRes] = await Promise.all([
            fetch(getPublicPath('/data/gemeentelijke-investeringen/metadata.json')),
            fetch(getPublicPath('/data/gemeentelijke-investeringen/bv_lookups.json')),
            fetch(getPublicPath('/data/gemeentelijke-investeringen/bv_vlaanderen_data.json'))
          ])

          if (cancelled) return

          if (!metaRes.ok) throw new Error(`Failed to load metadata: ${metaRes.statusText}`)
          if (!lookupsRes.ok) throw new Error(`Failed to load lookups: ${lookupsRes.statusText}`)
          if (!vlaanderenRes.ok) throw new Error(`Failed to load Vlaanderen data: ${vlaanderenRes.statusText}`)

          const meta = validateMetadata(await metaRes.json())
          const lookupsData = validateBVLookups(await lookupsRes.json())
          const vlaanderen = validateBVVlaanderenData(await vlaanderenRes.json())

          if (cancelled) return

          setBVLookups(lookupsData)
          setBVVlaanderenData(vlaanderen)
          setTotalChunks(meta.bv_chunks)
          setIsLoading(false)

          // Load chunks sequentially
          const allChunks: BVRecord[] = []
          for (let i = 0; i < meta.bv_chunks; i++) {
            if (cancelled) return

            const chunkRes = await fetch(getPublicPath(`/data/gemeentelijke-investeringen/bv_municipality_data_chunk_${i}.json`))
            if (!chunkRes.ok) {
              throw new Error(`Failed to load chunk ${i}: ${chunkRes.statusText}`)
            }
            const chunkData = validateBVChunkData(await chunkRes.json())
            allChunks.push(...chunkData)
            setBVMuniData([...allChunks])
            setLoadedChunks(i + 1)
          }
        } else {
          // REK perspective
          const [metaRes, lookupsRes, vlaanderenRes] = await Promise.all([
            fetch(getPublicPath('/data/gemeentelijke-investeringen/metadata.json')),
            fetch(getPublicPath('/data/gemeentelijke-investeringen/rek_lookups.json')),
            fetch(getPublicPath('/data/gemeentelijke-investeringen/rek_vlaanderen_data.json'))
          ])

          if (cancelled) return

          if (!metaRes.ok) throw new Error(`Failed to load metadata: ${metaRes.statusText}`)
          if (!lookupsRes.ok) throw new Error(`Failed to load lookups: ${lookupsRes.statusText}`)
          if (!vlaanderenRes.ok) throw new Error(`Failed to load Vlaanderen data: ${vlaanderenRes.statusText}`)

          const meta = validateMetadata(await metaRes.json())
          const lookupsData = validateREKLookups(await lookupsRes.json())
          const vlaanderen = validateREKVlaanderenData(await vlaanderenRes.json())

          if (cancelled) return

          setREKLookups(lookupsData)
          setREKVlaanderenData(vlaanderen)
          setTotalChunks(meta.rek_chunks)
          setIsLoading(false)

          // Load chunks sequentially
          const allChunks: REKRecord[] = []
          for (let i = 0; i < meta.rek_chunks; i++) {
            if (cancelled) return

            const chunkRes = await fetch(getPublicPath(`/data/gemeentelijke-investeringen/rek_municipality_data_chunk_${i}.json`))
            if (!chunkRes.ok) {
              throw new Error(`Failed to load chunk ${i}: ${chunkRes.statusText}`)
            }
            const chunkData = validateREKChunkData(await chunkRes.json())
            allChunks.push(...chunkData)
            setREKMuniData([...allChunks])
            setLoadedChunks(i + 1)
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load data:', err)
          setError(err instanceof Error ? err.message : 'Fout bij het laden van de data')
          setIsLoading(false)
        }
      }
    }
    init()

    return () => {
      cancelled = true
    }
  }, [perspective])

  // BV filtering logic
  const bvDomainOptions = useMemo(() => {
    if (!bvLookups) return []
    return bvLookups.domains.map(d => d.BV_domein).sort()
  }, [bvLookups])

  const bvSubdomeinOptions = useMemo(() => {
    if (!bvLookups) return []
    let options = bvLookups.subdomeins
    if (selectedDomain) {
      options = options.filter(s => s.BV_domein === selectedDomain)
    }
    return options.map(s => s.BV_subdomein).sort()
  }, [bvLookups, selectedDomain])

  const bvBeleidsveldOptions = useMemo(() => {
    if (!bvLookups) return []
    let options = bvLookups.beleidsvelds
    if (selectedSubdomein) {
      options = options.filter(b => b.BV_subdomein === selectedSubdomein)
    }
    return options.map(b => b.Beleidsveld).sort()
  }, [bvLookups, selectedSubdomein])

  // REK filtering logic
  const rekHoofdrekenOptions = useMemo(() => {
    if (!rekLookups) return []
    return rekLookups.hoofdrekeningen.map(h => h.Economische_rekening_hoofdrekening).sort()
  }, [rekLookups])

  const rekRubriekOptions = useMemo(() => {
    if (!rekLookups) return []
    let options = rekLookups.rubrieken
    if (selectedHoofdrekening) {
      options = options.filter(r => r.Economische_rekening_hoofdrekening === selectedHoofdrekening)
    }
    return options.map(r => r.Economische_rekening_rubriek).sort()
  }, [rekLookups, selectedHoofdrekening])

  // Filter data based on selections
  const filteredBVData = useMemo(() => {
    let data = bvMuniData

    if (selectedDomain) {
      data = data.filter(d => d.BV_domein === selectedDomain)
    }
    if (selectedSubdomein) {
      data = data.filter(d => d.BV_subdomein === selectedSubdomein)
    }
    if (selectedBeleidsveld) {
      data = data.filter(d => d.Beleidsveld === selectedBeleidsveld)
    }

    // Apply geo filter
    if (geoSelection.type === 'municipality' && geoSelection.code) {
      data = data.filter(d => d.NIS_code === geoSelection.code)
    }

    return data
  }, [bvMuniData, selectedDomain, selectedSubdomein, selectedBeleidsveld, geoSelection])

  const filteredREKData = useMemo(() => {
    let data = rekMuniData

    if (selectedHoofdrekening) {
      data = data.filter(d => d.Economische_rekening_hoofdrekening === selectedHoofdrekening)
    }
    if (selectedRubriek) {
      data = data.filter(d => d.Economische_rekening_rubriek === selectedRubriek)
    }

    // Apply geo filter
    if (geoSelection.type === 'municipality' && geoSelection.code) {
      data = data.filter(d => d.NIS_code === geoSelection.code)
    }

    return data
  }, [rekMuniData, selectedHoofdrekening, selectedRubriek, geoSelection])

  const filteredData = perspective === "bv" ? filteredBVData : filteredREKData

  // Chart data: Vlaanderen totals or municipality average
  const chartData = useMemo(() => {
    const byYear: Record<number, { Rapportjaar: number; value: number }> = {}

    if (geoSelection.type === 'all') {
      const perMuniYear: Record<string, number> = {}

      filteredData.forEach(record => {
        const key = `${record.NIS_code}_${record.Rapportjaar}`
        perMuniYear[key] = (perMuniYear[key] || 0) + record[selectedMetric]
      })

      Object.entries(perMuniYear).forEach(([key, value]) => {
        const year = parseInt(key.split('_')[1])
        if (!byYear[year]) {
          byYear[year] = { Rapportjaar: year, value: 0 }
        }
        byYear[year].value += value
      })

      if (selectedMetric === 'Per_inwoner') {
        const municipalityCounts: Record<number, Set<string>> = {}
        filteredData.forEach(record => {
          if (!municipalityCounts[record.Rapportjaar]) {
            municipalityCounts[record.Rapportjaar] = new Set()
          }
          municipalityCounts[record.Rapportjaar].add(record.NIS_code)
        })
        Object.keys(byYear).forEach(year => {
          const y = parseInt(year)
          const count = municipalityCounts[y]?.size || 0
          if (count > 0) {
            byYear[y].value = byYear[y].value / count
          }
        })
      }
    } else {
      filteredData.forEach(record => {
        if (!byYear[record.Rapportjaar]) {
          byYear[record.Rapportjaar] = { Rapportjaar: record.Rapportjaar, value: 0 }
        }
        byYear[record.Rapportjaar].value += record[selectedMetric]
      })
    }

    return Object.values(byYear).sort((a, b) => a.Rapportjaar - b.Rapportjaar)
  }, [filteredData, selectedMetric, geoSelection])

  // Auto-scale formatter for Y-axis
  const { formatter: yAxisFormatter, scale: yAxisScale } = useMemo(() => {
    const values = chartData.map(d => d.value)
    return createAutoScaledFormatter(values, true)
  }, [chartData])

  // Table data: By municipality (latest year)
  const tableData = useMemo(() => {
    const byMuni: Record<string, { municipality: string; total: number; count: number }> = {}

    filteredData.forEach(record => {
      if (record.Rapportjaar !== 2026) return

      if (!byMuni[record.NIS_code]) {
        byMuni[record.NIS_code] = {
          municipality: getMunicipalityName(record.NIS_code),
          total: 0,
          count: 0
        }
      }
      byMuni[record.NIS_code].total += record[selectedMetric]
      byMuni[record.NIS_code].count += 1
    })

    return Object.values(byMuni)
      .sort((a, b) => b.total - a.total)
      .slice(0, 50)
  }, [filteredData, selectedMetric])

  // Get available municipalities from the filtered data
  const availableMunicipalities = useMemo(() => {
    const nisCodesSet = new Set(filteredData.map(d => d.NIS_code))
    return Array.from(nisCodesSet)
  }, [filteredData])

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

  if (isLoading || (perspective === "bv" && !bvLookups) || (perspective === "rek" && !rekLookups)) {
    return (
      <Card>
        <CardContent className="h-64 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground italic">
            Laden van {perspective === "bv" ? "Beleidsdomein" : "Economische Rekening"} data...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <SimpleGeoContext.Provider value={{ selection: geoSelection, setSelection: setGeoSelection }}>
      <Card>
        <CardHeader>
          <CardTitle>
            {perspective === "bv" ? "Investeringen per Beleidsdomein (BV)" : "Investeringen per Economische Rekening (REK)"}
          </CardTitle>
          {loadedChunks < totalChunks && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              Laden data: {Math.round((loadedChunks / totalChunks) * 100)}%
            </div>
          )}
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
              <SimpleGeoFilter availableMunicipalities={availableMunicipalities} />

              {perspective === "bv" && (
                <>
                  <HierarchicalFilter
                    value={selectedDomain}
                    onChange={(v) => {
                      setSelectedDomain(v)
                      setSelectedSubdomein('')
                      setSelectedBeleidsveld('')
                    }}
                    options={bvDomainOptions}
                    placeholder="Selecteer domein"
                  />
                  {selectedDomain && (
                    <HierarchicalFilter
                      value={selectedSubdomein}
                      onChange={(v) => {
                        setSelectedSubdomein(v)
                        setSelectedBeleidsveld('')
                      }}
                      options={bvSubdomeinOptions}
                      placeholder="Selecteer subdomein"
                    />
                  )}
                  {selectedSubdomein && (
                    <HierarchicalFilter
                      value={selectedBeleidsveld}
                      onChange={setSelectedBeleidsveld}
                      options={bvBeleidsveldOptions}
                      placeholder="Selecteer beleidsveld"
                    />
                  )}
                </>
              )}

              {perspective === "rek" && (
                <>
                  <HierarchicalFilter
                    value={selectedHoofdrekening}
                    onChange={(v) => {
                      setSelectedHoofdrekening(v)
                      setSelectedRubriek('')
                    }}
                    options={rekHoofdrekenOptions}
                    placeholder="Selecteer hoofdrekening"
                  />
                  {selectedHoofdrekening && (
                    <HierarchicalFilter
                      value={selectedRubriek}
                      onChange={setSelectedRubriek}
                      options={rekRubriekOptions}
                      placeholder="Selecteer rubriek"
                    />
                  )}
                </>
              )}
            </div>

            <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as ViewType)} className="w-full">
              <TabsList>
                <TabsTrigger value="chart">Grafiek</TabsTrigger>
                <TabsTrigger value="table">Tabel</TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="mt-4">
                <div className="w-full h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Rapportjaar" />
                      <YAxis
                        label={{
                          value: getScaledLabel(
                            selectedMetric === 'Totaal' ? 'Totale uitgave (€)' : 'Uitgave per inwoner (€)',
                            yAxisScale
                          ),
                          angle: -90,
                          position: 'insideLeft'
                        }}
                        tickFormatter={yAxisFormatter}
                      />
                      <Tooltip
                        formatter={(value) => {
                          if (typeof value !== 'number') return ''
                          return selectedMetric === 'Totaal' ? formatFullCurrency(value) : `€ ${value.toFixed(2)}`
                        }}
                        labelFormatter={(label) => `Rapportjaar ${label}`}
                      />
                      <Bar dataKey="value" fill="#3b82f6" name={selectedMetric === 'Totaal' ? 'Totaal' : 'Gemiddelde per inwoner'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {geoSelection.type === 'all'
                    ? selectedMetric === 'Totaal'
                      ? 'Som van alle gemeenten'
                      : 'Gemiddelde over alle gemeenten'
                    : 'Geselecteerde gemeente'
                  }
                </p>
              </TabsContent>

              <TabsContent value="table" className="mt-4">
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left font-medium">Gemeente</th>
                        <th className="p-2 text-right font-medium">
                          {selectedMetric === 'Totaal' ? 'Totaal' : 'Per inwoner'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="p-4 text-center text-muted-foreground italic">
                            Data aan het laden...
                          </td>
                        </tr>
                      ) : (
                        tableData.map((row, i) => (
                          <tr key={i} className="border-b">
                            <td className="p-2">{row.municipality}</td>
                            <td className="p-2 text-right">
                              {selectedMetric === 'Totaal'
                                ? formatFullCurrency(row.total)
                                : `€ ${row.total.toFixed(2)}`
                              }
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Top 50 gemeenten (rapportjaar 2026)
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </SimpleGeoContext.Provider>
  )
}
