"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { MunicipalityMap } from "../shared/MunicipalityMap"
import { SimpleGeoFilter } from "./SimpleGeoFilter"
import { SimpleGeoContext } from "../shared/GeoContext"
import { ExportButtons } from "../shared/ExportButtons"
import { getMunicipalityName } from "./nisUtils"

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

interface REKVlaanderenRecord {
  Rapportjaar: number
  Niveau_3: string
  Alg_rekening: string
  Totaal: number
  Per_inwoner: number
}



const formatNumber = (num: number) => new Intl.NumberFormat('nl-BE').format(Math.round(num))
const formatCurrency = (num: number) => `€ ${formatNumber(num)}`

// Hierarchische filter component
function HierarchicalFilter({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const selectedLabel = value || placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="h-9 gap-1 min-w-[250px] justify-between"
        >
          <span className="truncate max-w-[230px]">{selectedLabel}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Zoek ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>Geen resultaat.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="alle"
                onSelect={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === '' ? "opacity-100" : "opacity-0")} />
                Alle
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}



export function InvesteringenREKSection() {
  const [lookups, setLookups] = useState<REKLookups | null>(null)
  const [vlaanderenData, setVlaanderenData] = useState<REKVlaanderenRecord[]>([])
  const [muniData, setMuniData] = useState<REKRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadedChunks, setLoadedChunks] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)

  const [selectedNiveau3, setSelectedNiveau3] = useState<string>('')
  const [selectedAlgRekening, setSelectedAlgRekening] = useState<string>('')
  const [selectedMetric, setSelectedMetric] = useState<'Totaal' | 'Per_inwoner'>('Totaal')
  const [geoSelection, setGeoSelection] = useState<{
    type: 'all' | 'region' | 'province' | 'municipality'
    code?: string
  }>({ type: 'all' })

  // Load initial data and start chunk loading
  useEffect(() => {
    async function init() {
      try {
        const [metaRes, lookupsRes, vlaanderenRes] = await Promise.all([
          fetch('/data/gemeentelijke-investeringen/metadata.json'),
          fetch('/data/gemeentelijke-investeringen/rek_lookups.json'),
          fetch('/data/gemeentelijke-investeringen/rek_vlaanderen_data.json')
        ])

        const meta = await metaRes.json()
        const lookupsData = await lookupsRes.json()
        const vlaanderen = await vlaanderenRes.json()

        setLookups(lookupsData)
        setVlaanderenData(vlaanderen)
        setTotalChunks(meta.rek_chunks)
        setIsLoading(false)

        // Load chunks sequentially
        for (let i = 0; i < meta.rek_chunks; i++) {
          const chunkRes = await fetch(`/data/gemeentelijke-investeringen/rek_municipality_data_chunk_${i}.json`)
          const chunkData = await chunkRes.json()
          setMuniData(prev => [...prev, ...chunkData])
          setLoadedChunks(i + 1)
        }
      } catch (err) {
        console.error('Failed to load REK data:', err)
      }
    }
    init()
  }, [])

  // Get available options based on selections
  const niveau3Options = useMemo(() => {
    if (!lookups) return []
    return lookups.niveau3s.map(n => n.Niveau_3).sort()
  }, [lookups])

  const algRekeningOptions = useMemo(() => {
    if (!lookups) return []
    let options = lookups.alg_rekenings
    if (selectedNiveau3) {
      options = options.filter(a => a.Niveau_3 === selectedNiveau3)
    }
    return options.map(a => a.Alg_rekening).sort()
  }, [lookups, selectedNiveau3])

  // Filter data based on selections
  const filteredData = useMemo(() => {
    let data = muniData

    if (selectedNiveau3) {
      data = data.filter(d => d.Niveau_3 === selectedNiveau3)
    }
    if (selectedAlgRekening) {
      data = data.filter(d => d.Alg_rekening === selectedAlgRekening)
    }

    // Apply geo filter
    if (geoSelection.type === 'municipality' && geoSelection.code) {
      data = data.filter(d => d.NIS_code === geoSelection.code)
    }

    return data
  }, [muniData, selectedNiveau3, selectedAlgRekening, geoSelection])

  // Chart data: Vlaanderen totals or municipality average
  const chartData = useMemo(() => {
    const byYear: Record<number, { Rapportjaar: number; value: number }> = {}

    if (geoSelection.type === 'all') {
      // Show Vlaanderen sum for Totaal, average for Per_inwoner
      filteredData.forEach(record => {
        if (!byYear[record.Rapportjaar]) {
          byYear[record.Rapportjaar] = { Rapportjaar: record.Rapportjaar, value: 0 }
        }
        byYear[record.Rapportjaar].value += record[selectedMetric]
      })

      // For Per_inwoner, calculate average
      if (selectedMetric === 'Per_inwoner') {
        const municipalityCounts: Record<number, number> = {}
        filteredData.forEach(record => {
          municipalityCounts[record.Rapportjaar] = (municipalityCounts[record.Rapportjaar] || 0) + 1
        })
        Object.keys(byYear).forEach(year => {
          const y = parseInt(year)
          if (municipalityCounts[y] > 0) {
            byYear[y].value = byYear[y].value / municipalityCounts[y]
          }
        })
      }
    } else {
      // For specific selection, show aggregated value
      filteredData.forEach(record => {
        if (!byYear[record.Rapportjaar]) {
          byYear[record.Rapportjaar] = { Rapportjaar: record.Rapportjaar, value: 0 }
        }
        byYear[record.Rapportjaar].value += record[selectedMetric]
      })
    }

    return Object.values(byYear).sort((a, b) => a.Rapportjaar - b.Rapportjaar)
  }, [filteredData, selectedMetric, geoSelection])

  // Table data: By municipality
  const tableData = useMemo(() => {
    const byMuni: Record<string, { municipality: string; total: number; count: number }> = {}

    filteredData.forEach(record => {
      // Show latest year for table
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

  // Map data: Latest rapportjaar (2026)
  const mapData = useMemo(() => {
    const latestYear = 2026
    const byMuni: Record<string, { municipalityCode: string; value: number }> = {}

    filteredData
      .filter(d => d.Rapportjaar === latestYear)
      .forEach(record => {
        if (!byMuni[record.NIS_code]) {
          byMuni[record.NIS_code] = { municipalityCode: record.NIS_code, value: 0 }
        }
        byMuni[record.NIS_code].value += record[selectedMetric]
      })

    return Object.values(byMuni)
  }, [filteredData, selectedMetric])

  if (isLoading || !lookups) {
    return (
      <Card>
        <CardContent className="h-64 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground italic">Laden van Investeringen per Economische Rekening...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <SimpleGeoContext.Provider value={{ selection: geoSelection, setSelection: setGeoSelection }}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Investeringen per Economische Rekening (REK)</CardTitle>
            <div className="flex items-center gap-4">
              {loadedChunks < totalChunks && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Laden data: {Math.round((loadedChunks / totalChunks) * 100)}%
                </div>
              )}
              <ExportButtons
                title="Investeringen per Economische Rekening"
                slug="gemeentelijke-investeringen"
                sectionId="investments-rek"
                viewType="table"
                data={tableData.map(d => ({ label: d.municipality, value: d.total }))}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Filter op niveau 3 en algemene rekening om de investeringen per gemeente te bekijken.
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
              <SimpleGeoFilter />
              <HierarchicalFilter
                value={selectedNiveau3}
                onChange={(v) => {
                  setSelectedNiveau3(v)
                  setSelectedAlgRekening('')
                }}
                options={niveau3Options}
                placeholder="Selecteer niveau 3"
              />
              {selectedNiveau3 && (
                <HierarchicalFilter
                  value={selectedAlgRekening}
                  onChange={setSelectedAlgRekening}
                  options={algRekeningOptions}
                  placeholder="Selecteer algemene rekening"
                />
              )}
            </div>

            <Tabs defaultValue="chart" className="w-full">
              <TabsList>
                <TabsTrigger value="chart">Grafiek</TabsTrigger>
                <TabsTrigger value="table">Tabel</TabsTrigger>
                <TabsTrigger value="map">Kaart</TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="mt-4">
                <div className="w-full h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Rapportjaar" />
                      <YAxis
                        label={{
                          value: selectedMetric === 'Totaal' ? 'Totale uitgave (€)' : 'Uitgave per inwoner (€)',
                          angle: -90,
                          position: 'insideLeft'
                        }}
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <Tooltip
                        formatter={(value) => {
                          if (typeof value !== 'number') return ''
                          return selectedMetric === 'Totaal' ? formatCurrency(value) : `€ ${value.toFixed(2)}`
                        }}
                        labelFormatter={(label) => `Rapportjaar ${label}`}
                      />
                      <Bar dataKey="value" fill="#10b981" name={selectedMetric === 'Totaal' ? 'Totaal' : 'Gemiddelde per inwoner'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {geoSelection.type === 'all'
                    ? selectedMetric === 'Totaal'
                      ? 'Som van alle gemeenten'
                      : 'Gemiddelde over alle gemeenten'
                    : 'Geselecteerde regio/provincie/gemeente'
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
                                ? formatCurrency(row.total)
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

              <TabsContent value="map" className="mt-4">
                <MunicipalityMap
                  data={mapData}
                  getGeoCode={(d) => d.municipalityCode}
                  getValue={(d) => d.value}
                  colorScheme="green"
                  showProvinceBoundaries={true}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Rapportjaar 2026 - {selectedMetric === 'Totaal' ? 'Totale uitgave' : 'Uitgave per inwoner'}
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </SimpleGeoContext.Provider>
  )
}