"use client"

import * as React from "react"
import { useMemo } from "react"
import type { MunicipalityData } from "./types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { DataTable } from "./DataTable"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
} from "recharts"

interface HuishoudensSectionProps {
  data: MunicipalityData[]
}

const columns = [
  { key: "TX_REFNIS_NL", header: "Gemeente", format: "text" as const, sortable: true },
  { key: "hh_1_pct_toename", header: "HH 1p %", format: "percentage" as const, sortable: true },
  { key: "hh_2_pct_toename", header: "HH 2p %", format: "percentage" as const, sortable: true },
  { key: "hh_3_pct_toename", header: "HH 3p %", format: "percentage" as const, sortable: true },
  { key: "hh_4+_pct_toename", header: "HH 4+p %", format: "percentage" as const, sortable: true },
]

// Helper to calculate quartiles
function calculateQuartiles(values: number[]) {
  const sorted = [...values].filter(v => v != null && !isNaN(v)).sort((a, b) => a - b)
  if (sorted.length === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0, mean: 0 }

  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const median = sorted[Math.floor(sorted.length * 0.5)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]

  return { min, q1, median, q3, max, mean }
}

export function HuishoudensSection({ data }: HuishoudensSectionProps) {
  const hasHouseholdData = data.some(d => d.HH_available)

  if (!hasHouseholdData) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Huishoudens - voorspelde toename 2025-2040</h2>
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Geen huishoudensdata beschikbaar voor de geselecteerde selectie.
            Huishoudensdata is momenteel alleen beschikbaar voor Vlaanderen.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const cleanData = data.filter(d => d.HH_available)

  // Calculate box plot data (quartiles for percentage growth)
  const boxPlotData = useMemo(() => {
    return [
      {
        name: "1 persoon",
        ...calculateQuartiles(cleanData.map(d => d.hh_1_pct_toename).filter(v => v != null) as number[])
      },
      {
        name: "2 personen",
        ...calculateQuartiles(cleanData.map(d => d.hh_2_pct_toename).filter(v => v != null) as number[])
      },
      {
        name: "3 personen",
        ...calculateQuartiles(cleanData.map(d => d.hh_3_pct_toename).filter(v => v != null) as number[])
      },
      {
        name: "4+ personen",
        ...calculateQuartiles(cleanData.map(d => d["hh_4+_pct_toename"]).filter(v => v != null) as number[])
      },
    ]
  }, [cleanData])

  // Calculate stacked bar chart data (absolute growth by household size)
  const stackedBarData = useMemo(() => {
    return cleanData
      .map(d => ({
        name: d.TX_REFNIS_NL,
        total: (d.hh_1_abs_toename ?? 0) + (d.hh_2_abs_toename ?? 0) +
               (d.hh_3_abs_toename ?? 0) + (d["hh_4+_abs_toename"] ?? 0),
        "1 persoon": d.hh_1_abs_toename ?? 0,
        "2 personen": d.hh_2_abs_toename ?? 0,
        "3 personen": d.hh_3_abs_toename ?? 0,
        "4+ personen": d["hh_4+_abs_toename"] ?? 0,
      }))
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15) // Top 15 municipalities
  }, [cleanData])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Huishoudens - voorspelde toename 2025-2040</h2>
        <p className="text-muted-foreground">
          Projecties van huishoudensgroei per grootte (1, 2, 3, 4+ personen).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Box plot - Percentage distribution */}
        <div>
          <h3 className="text-lg font-medium mb-3">Distributie percentage toename</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={boxPlotData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                formatter={(value) => (typeof value === 'number' ? value.toFixed(1) + '%' : value)}
              />
              <Legend />
              <Bar dataKey="min" fill="transparent" stroke="var(--color-chart-1)" stackId="a" />
              <Bar dataKey="q1" fill="var(--color-chart-1)" opacity={0.3} stackId="a" />
              <Bar dataKey="median" fill="var(--color-chart-1)" opacity={0.6} stackId="a" />
              <Bar dataKey="q3" fill="var(--color-chart-1)" opacity={0.3} stackId="a" />
              <Bar dataKey="max" fill="transparent" stroke="var(--color-chart-1)" stackId="a" />
              <Line type="monotone" dataKey="mean" stroke="var(--color-chart-5)" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Total absolute growth */}
        <div>
          <h3 className="text-lg font-medium mb-3">Totale absolute toename per gemeente (top 15)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stackedBarData.slice(0, 10)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="total" fill="var(--color-chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stacked bar chart - Absolute growth breakdown */}
      <div>
        <h3 className="text-lg font-medium mb-3">Absolute toename per huishoudensgrootte (top 15 gemeenten)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={stackedBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: 'Absolute toename', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Bar dataKey="1 persoon" stackId="a" fill="var(--color-chart-1)" />
            <Bar dataKey="2 personen" stackId="a" fill="var(--color-chart-2)" />
            <Bar dataKey="3 personen" stackId="a" fill="var(--color-chart-3)" />
            <Bar dataKey="4+ personen" stackId="a" fill="var(--color-chart-4)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DataTable data={cleanData} columns={columns} />
    </div>
  )
}
