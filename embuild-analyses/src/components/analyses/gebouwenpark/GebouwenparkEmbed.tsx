"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TimeSeriesSection } from "../shared/TimeSeriesSection"
import { GebouwenChart } from "./GebouwenChart"
import { GebouwenTable } from "./GebouwenTable"
import type { GebouwenData } from "./types"

import rawData from "../../../../analyses/gebouwenpark/results/stats_2025.json"

const data = rawData as GebouwenData

interface GebouwenparkEmbedProps {
  section: "evolutie"
}

export function GebouwenparkEmbed({ section }: GebouwenparkEmbedProps) {
  const { time_series } = data

  // Prepare data for time series chart and table
  const timeSeriesData = useMemo(() => {
    return time_series.years.map((year, idx) => ({
      year,
      total: time_series.national.total_buildings[idx],
      residential: time_series.national.residential_buildings[idx]
    }))
  }, [time_series])

  // Prepare export data
  const exportData = useMemo(() => {
    return timeSeriesData.map((row) => ({
      label: row.year.toString(),
      value: row.total,
      periodCells: [row.year, row.total, row.residential]
    }))
  }, [timeSeriesData])

  return (
    <div className="p-4">
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
    </div>
  )
}
