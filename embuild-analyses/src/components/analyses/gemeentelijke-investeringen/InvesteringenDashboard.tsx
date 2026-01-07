"use client"

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, AlertTriangle } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExportButtons } from "../shared/ExportButtons"
import { InvesteringenChart } from "./InvesteringenChart"
import { InvesteringenTable } from "./InvesteringenTable"
import { InvesteringenMap } from "./InvesteringenMap"
import type { Lookups, Metadata } from "./types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { validateMetadata, validateLookups, validateInvestmentData } from "./validation"

// Import data
import vlaanderenDomainData from '../../../../analyses/gemeentelijke-investeringen/results/investments_by_domain_vlaanderen.json'
import vlaanderenCategoryData from '../../../../analyses/gemeentelijke-investeringen/results/investments_by_category_vlaanderen.json'
import muniDomainData from '../../../../analyses/gemeentelijke-investeringen/results/investments_by_municipality_domain.json'
import muniTotalData from '../../../../analyses/gemeentelijke-investeringen/results/investments_by_municipality_total.json'
import muniCategoryData from '../../../../analyses/gemeentelijke-investeringen/results/investments_by_municipality_category.json'
import domainSummary from '../../../../analyses/gemeentelijke-investeringen/results/domain_summary.json'
import categorySummary from '../../../../analyses/gemeentelijke-investeringen/results/category_summary.json'
import lookups from '../../../../analyses/gemeentelijke-investeringen/results/lookups.json'
import metadata from '../../../../analyses/gemeentelijke-investeringen/results/metadata.json'

// Validate data at load time
if (!validateMetadata(metadata)) {
  throw new Error('Invalid metadata structure - see console for details')
}
if (!validateLookups(lookups)) {
  throw new Error('Invalid lookups structure - see console for details')
}
if (!validateInvestmentData(vlaanderenDomainData, 'domain')) {
  throw new Error('Invalid domain investment data - see console for details')
}
if (!validateInvestmentData(vlaanderenCategoryData, 'category')) {
  throw new Error('Invalid category investment data - see console for details')
}

const lookupsData = lookups as Lookups
const metadataData = metadata as Metadata

interface VlaanderenDomainRecord {
  year: number
  domain_code: string
  domain_name: string
  metric: 'total' | 'per_capita'
  value: number
}

interface VlaanderenCategoryRecord {
  year: number
  category_l1: string
  metric: 'total' | 'per_capita'
  value: number
}

interface MuniDomainRecord {
  municipality: string
  domain_code: string
  domain_name: string
  metric: 'total' | 'per_capita'
  value: number
  nis_code?: string
}

interface MuniCategoryRecord {
  municipality: string
  category_l1: string
  metric: 'total' | 'per_capita'
  value: number
  nis_code?: string
}

interface Summary {
  domain_name?: string
  category?: string
  total_value: number
  avg_value: number
  count: number
}

const vlaanderenDomain = vlaanderenDomainData as VlaanderenDomainRecord[]
const vlaanderenCategory = vlaanderenCategoryData as VlaanderenCategoryRecord[]
const muniDomain = muniDomainData as MuniDomainRecord[]
const muniTotal = muniTotalData as MuniDomainRecord[]
const muniCategory = muniCategoryData as MuniCategoryRecord[]
const domainSum = domainSummary as Summary[]
const categorySum = categorySummary as Summary[]

const formatNumber = (num: number) => new Intl.NumberFormat('nl-BE').format(Math.round(num))
const formatCurrency = (num: number) => `€ ${formatNumber(num)}`

// Get unique municipalities
const uniqueMunicipalities = Array.from(new Set(muniDomain.map(d => d.municipality))).sort()

// Domain filter component
function DomainFilterInline({
  selected,
  onChange,
  domains,
}: {
  selected: string | 'all'
  onChange: (domain: string | 'all') => void
  domains: Array<{ domain_code: string; domain_name: string }>
}) {
  const [open, setOpen] = useState(false)

  const selectedLabel = useMemo(() => {
    if (selected === 'all') return 'Alle domeinen'
    return domains.find((d) => d.domain_code === selected)?.domain_name ?? 'Alle domeinen'
  }, [selected, domains])

  const sortedDomains = useMemo(() => {
    return [...domains].sort((a, b) => a.domain_name.localeCompare(b.domain_name))
  }, [domains])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" role="combobox" aria-expanded={open} className="h-9 gap-1 min-w-[180px]">
          <span className="truncate max-w-[160px]">{selectedLabel}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Zoek domein..." />
          <CommandList>
            <CommandEmpty>Geen resultaat.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="alle-domeinen"
                onSelect={() => {
                  onChange('all')
                  setOpen(false)
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", selected === 'all' ? "opacity-100" : "opacity-0")} />
                Alle domeinen
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Beleidsdomein">
              {sortedDomains.map((domain) => (
                <CommandItem
                  key={domain.domain_code}
                  value={domain.domain_name}
                  onSelect={() => {
                    onChange(domain.domain_code)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selected === domain.domain_code ? "opacity-100" : "opacity-0")} />
                  {domain.domain_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Metric filter component
function MetricFilterInline({
  selected,
  onChange,
}: {
  selected: 'total' | 'per_capita'
  onChange: (metric: 'total' | 'per_capita') => void
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant={selected === 'total' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('total')}
        className="h-9"
      >
        Totaal
      </Button>
      <Button
        variant={selected === 'per_capita' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('per_capita')}
        className="h-9"
      >
        Per inwoner
      </Button>
    </div>
  )
}

export function InvesteringenDashboard() {
  // Domain section state
  const [selectedDomain, setSelectedDomain] = useState<string | 'all'>('all')
  const [selectedMetricDomain, setSelectedMetricDomain] = useState<'total' | 'per_capita'>('total')

  // Category section state
  const [selectedMetricCategory, setSelectedMetricCategory] = useState<'total' | 'per_capita'>('total')

  // ========== DOMAIN SECTION DATA ==========

  // Time series data for domain section
  const domainTimeSeriesData = useMemo(() => {
    let data = vlaanderenDomain.filter((r) => r.metric === selectedMetricDomain)

    if (selectedDomain !== 'all') {
      data = data.filter((r) => r.domain_code === selectedDomain)
    }

    // Group by year
    const byYear = data.reduce((acc, record) => {
      if (!acc[record.year]) {
        acc[record.year] = { year: record.year, value: 0 }
      }
      acc[record.year].value += record.value
      return acc
    }, {} as Record<number, { year: number; value: number }>)

    return Object.values(byYear).sort((a, b) => a.year - b.year)
  }, [selectedDomain, selectedMetricDomain])

  // Table data for domain section
  const domainTableData = useMemo(() => {
    return domainSum.slice(0, 50).map((d) => ({
      domain: d.domain_name!,
      total: d.total_value,
      average: d.avg_value,
      count: d.count,
    }))
  }, [])

  // Map data for domain section
  const domainMapData = useMemo(() => {
    let data = selectedDomain === 'all' ? muniTotal : muniDomain.filter(d => d.domain_code === selectedDomain)
    data = data.filter(d => d.metric === selectedMetricDomain)

    return data.map(d => ({
      municipality: d.municipality,
      value: d.value,
      nis_code: d.nis_code,
    }))
  }, [selectedDomain, selectedMetricDomain])

  // ========== CATEGORY SECTION DATA ==========

  // Time series data for category section
  const categoryTimeSeriesData = useMemo(() => {
    let data = vlaanderenCategory.filter((r) => r.metric === selectedMetricCategory)

    // Group by year (category_l1 is always 'I Investeringsverrichtingen' for now in summary)
    const byYear = data.reduce((acc, record) => {
      if (!acc[record.year]) {
        acc[record.year] = { year: record.year, value: 0 }
      }
      acc[record.year].value += record.value
      return acc
    }, {} as Record<number, { year: number; value: number }>)

    return Object.values(byYear).sort((a, b) => a.year - b.year)
  }, [selectedMetricCategory])

  // Table data for category section
  const categoryTableData = useMemo(() => {
    return categorySum.slice(0, 50).map((d) => ({
      domain: d.category!,
      total: d.total_value,
      average: d.avg_value,
      count: d.count,
    }))
  }, [])

  // Map data for category section
  const categoryMapData = useMemo(() => {
    let data = muniCategory.filter(d => d.metric === selectedMetricCategory)

    // Group by municipality
    const byMuni = data.reduce((acc, record) => {
      if (!acc[record.municipality]) {
        acc[record.municipality] = { municipality: record.municipality, value: 0 }
      }
      acc[record.municipality].value += record.value
      return acc
    }, {} as Record<string, { municipality: string; value: number }>)

    return Object.values(byMuni).map(d => ({
      ...d,
      nis_code: data.find(r => r.municipality === d.municipality)?.nis_code
    }))
  }, [selectedMetricCategory])

  // Check if Kostenpost data is truncated (use explicit flag from metadata)
  const isKostenpostTruncated = metadataData.is_kostenpost_truncated ?? false

  return (
    <div className="space-y-8">
      {isKostenpostTruncated && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Gegevens incompleet</AlertTitle>
          <AlertDescription className="text-amber-700">
            De detailgegevens per kostenpost zijn momenteel slechts voor {metadataData.kostenpost_municipalities ?? 50} van de {metadataData.total_municipalities} gemeenten beschikbaar.
            De gegevens per beleidsdomein zijn wel volledig voor alle gemeenten.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Laatste jaar (Beleidsveld)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metadataData.bv_latest_year}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gemeenten (Totaal)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metadataData.total_municipalities)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Beleidsdomeinen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lookupsData.domains.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Investeringen per beleidsdomein</CardTitle>
            <ExportButtons
              title="Investeringen per beleidsdomein"
              slug="gemeentelijke-investeringen"
              sectionId="investments-by-domain"
              viewType="table"
              data={domainTableData.map(d => ({ label: d.domain, value: d.total }))}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <MetricFilterInline selected={selectedMetricDomain} onChange={setSelectedMetricDomain} />
              <DomainFilterInline
                selected={selectedDomain}
                onChange={setSelectedDomain}
                domains={lookupsData.domains}
              />
            </div>

            <Tabs defaultValue="chart" className="w-full">
              <TabsList>
                <TabsTrigger value="chart">Grafiek</TabsTrigger>
                <TabsTrigger value="table">Tabel</TabsTrigger>
                <TabsTrigger value="map">Kaart</TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="mt-4">
                <InvesteringenChart
                  data={domainTimeSeriesData}
                  selectedMetric={selectedMetricDomain}
                />
              </TabsContent>

              <TabsContent value="table" className="mt-4">
                <InvesteringenTable data={domainTableData} />
              </TabsContent>

              <TabsContent value="map" className="mt-4">
                <InvesteringenMap
                  data={domainMapData}
                  selectedMetric={selectedMetricDomain}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Category Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Investeringen per kostenpost (detail)</CardTitle>
            <ExportButtons
              title="Investeringen per kostenpost"
              slug="gemeentelijke-investeringen"
              sectionId="investments-by-category"
              viewType="table"
              data={categoryTableData.map(d => ({ label: d.domain, value: d.total }))}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <MetricFilterInline selected={selectedMetricCategory} onChange={setSelectedMetricCategory} />
            </div>

            <Tabs defaultValue="chart" className="w-full">
              <TabsList>
                <TabsTrigger value="chart">Grafiek</TabsTrigger>
                <TabsTrigger value="table">Tabel</TabsTrigger>
                <TabsTrigger value="map">Kaart</TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="mt-4">
                <InvesteringenChart
                  data={categoryTimeSeriesData}
                  selectedMetric={selectedMetricCategory}
                />
              </TabsContent>

              <TabsContent value="table" className="mt-4">
                <InvesteringenTable data={categoryTableData} label="Kostenpost" />
              </TabsContent>

              <TabsContent value="map" className="mt-4">
                <InvesteringenMap
                  data={categoryMapData}
                  selectedMetric={selectedMetricCategory}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
