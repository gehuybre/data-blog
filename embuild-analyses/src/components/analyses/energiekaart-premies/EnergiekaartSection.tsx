"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { ExportButtons } from "../shared/ExportButtons"
import { EnergiekaartChart } from "./EnergiekaartChart"
import { EnergiekaartTable } from "./EnergiekaartTable"
import type { YearlyDataRow } from "./EnergiekaartDashboard"
import { formatScaledEuro, getCurrencyLabel, getCurrencyScale } from "./formatters"

interface EnergiekaartSectionProps {
  title: string
  data: YearlyDataRow[]
  metric: keyof YearlyDataRow
  label: string
  slug: string
  sectionId: string
  dataSource: string
  dataSourceUrl: string
  selectedMeasure: string
  isCurrency?: boolean
}

export function EnergiekaartSection({
  title,
  data,
  metric,
  label,
  slug,
  sectionId,
  dataSource,
  dataSourceUrl,
  selectedMeasure,
  isCurrency = false,
}: EnergiekaartSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("grafiek")

  // Prepare chart data
  const chartData = useMemo(() => {
    return data
      .map((row) => ({
        jaar: row.jaar,
        value: Number(row[metric]),
      }))
      .sort((a, b) => a.jaar - b.jaar)
  }, [data, metric])

  const currencyScale = useMemo(() => {
    if (!isCurrency) return null
    return getCurrencyScale(chartData.map((d) => d.value))
  }, [chartData, isCurrency])

  const displayLabel = useMemo(() => {
    if (!isCurrency || !currencyScale) return label
    return getCurrencyLabel(label, currencyScale)
  }, [currencyScale, isCurrency, label])

  // Prepare CSV data
  const csvData = useMemo(() => {
    return chartData.map((row) => ({
      label: row.jaar.toString(),
      value: row.value,
    }))
  }, [chartData])

  // Calculate summary stats
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { latest: 0, min: 0, max: 0, total: 0 }
    }

    const values = chartData.map((d) => d.value)
    const latest = values[values.length - 1] || 0
    const min = Math.min(...values)
    const max = Math.max(...values)
    const total = values.reduce((sum, v) => sum + v, 0)

    return { latest, min, max, total }
  }, [chartData])

  // Format numbers
  const formatNumber = (value: number) => {
    if (isCurrency) {
      if (!currencyScale) return `€ ${value}`
      return formatScaledEuro(value, currencyScale)
    }
    return new Intl.NumberFormat("nl-BE").format(value)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          {selectedMeasure !== "Totaal" && (
            <p className="text-sm text-muted-foreground mt-1">
              Gefilterd op: {selectedMeasure}
            </p>
          )}
        </div>
        <ExportButtons
          data={csvData}
          title={title}
          slug={slug}
          sectionId={sectionId}
          viewType="chart"
          periodHeaders={["Jaar"]}
          valueLabel={label}
          dataSource={dataSource}
          dataSourceUrl={dataSourceUrl}
        />
      </div>

      {/* Summary Stats */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Meest recent</div>
            <div className="text-2xl font-bold">{formatNumber(stats.latest)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {chartData[chartData.length - 1]?.jaar}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Maximum</div>
            <div className="text-2xl font-bold">{formatNumber(stats.max)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Minimum</div>
            <div className="text-2xl font-bold">{formatNumber(stats.min)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Totaal (alle jaren)</div>
            <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="grafiek">Grafiek</TabsTrigger>
          <TabsTrigger value="tabel">Tabel</TabsTrigger>
        </TabsList>

        <TabsContent value="grafiek" className="mt-4">
          <Card className="p-6">
            <EnergiekaartChart data={chartData} label={displayLabel} isCurrency={isCurrency} />
          </Card>
        </TabsContent>

        <TabsContent value="tabel" className="mt-4">
          <Card className="p-6">
            <EnergiekaartTable data={chartData} label={displayLabel} isCurrency={isCurrency} />
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  )
}
