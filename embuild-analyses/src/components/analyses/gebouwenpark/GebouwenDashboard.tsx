"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home } from 'lucide-react'
import { TimeSeriesSection } from "../shared/TimeSeriesSection"
import { GebouwenChart } from "./GebouwenChart"
import { GebouwenTable } from "./GebouwenTable"
import type { GebouwenData } from "./types"

import rawData from '../../../../analyses/gebouwenpark/results/stats_2025.json'

const data = rawData as GebouwenData

const formatNumber = (num: number) => new Intl.NumberFormat('nl-BE').format(num)

export function GebouwenDashboard() {
  const { snapshot_2025, time_series } = data
  const national2025 = snapshot_2025.national

  // Prepare data for time series chart and table
  const timeSeriesData = useMemo(() => {
    return time_series.years.map((year, idx) => ({
      year,
      total: time_series.national.total_buildings[idx],
      residential: time_series.national.residential_buildings[idx]
    }))
  }, [time_series])

  // Calculate residential total for metric card
  const residentialTotal =
    national2025.by_type['Huizen in gesloten bebouwing'] +
    national2025.by_type['Huizen in halfopen bebouwing'] +
    national2025.by_type['Huizen in open bebouwing, hoeven en kastelen'] +
    national2025.by_type['Buildings en flatgebouwen met appartementen']

  // Prepare export data for TimeSeriesSection
  const exportData = useMemo(() => {
    return timeSeriesData.map((row) => ({
      label: row.year.toString(),
      value: row.total,
      periodCells: [row.year, row.total, row.residential]
    }))
  }, [timeSeriesData])

  return (
    <div className="space-y-8">
      {/* Top Level Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Gebouwen</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(national2025.total)}</div>
            <p className="text-xs text-muted-foreground">In 2025</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Woongebouwen</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(residentialTotal)}</div>
            <p className="text-xs text-muted-foreground">Huizen + Appartementsgebouwen</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Section */}
      <TimeSeriesSection
        title="Evolutie van het aantal gebouwen (1995-2025)"
        slug="gebouwenpark"
        sectionId="evolutie"
        dataSource="Statbel Building Stock 2025"
        dataSourceUrl="https://statbel.fgov.be/"
        defaultView="chart"
        views={[
          {
            value: "chart",
            label: "Grafiek",
            exportData,
            exportMeta: {
              viewType: "chart",
              periodHeaders: ["Jaar", "Totaal Gebouwen", "Woongebouwen"],
              valueLabel: "Aantal"
            },
            content: (
              <Card>
                <CardContent className="pt-6">
                  <GebouwenChart data={timeSeriesData} />
                </CardContent>
              </Card>
            )
          },
          {
            value: "table",
            label: "Tabel",
            exportData,
            exportMeta: {
              viewType: "table",
              periodHeaders: ["Jaar", "Totaal Gebouwen", "Woongebouwen"],
              valueLabel: "Aantal"
            },
            content: (
              <Card>
                <CardContent className="pt-6">
                  <GebouwenTable data={timeSeriesData} />
                </CardContent>
              </Card>
            )
          }
        ]}
      />

      {/* Regional Breakdown Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Regionale Verdeling (2025)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(snapshot_2025.regions).map(([code, reg]) => (
            <Card key={code}>
              <CardHeader>
                <CardTitle>{reg.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold mb-2">{formatNumber(reg.total)}</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Open:</span>
                    <span>{formatNumber(reg.by_type['Huizen in open bebouwing, hoeven en kastelen'])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Halfopen:</span>
                    <span>{formatNumber(reg.by_type['Huizen in halfopen bebouwing'])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gesloten:</span>
                    <span>{formatNumber(reg.by_type['Huizen in gesloten bebouwing'])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Appartementen:</span>
                    <span>{formatNumber(reg.by_type['Buildings en flatgebouwen met appartementen'])}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
