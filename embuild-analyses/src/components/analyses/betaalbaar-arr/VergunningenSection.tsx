"use client"

import * as React from "react"
import { useMemo } from "react"
import type { MunicipalityData } from "./types"
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
} from "recharts"

interface VergunningenSectionProps {
  data: MunicipalityData[]
}

const columns = [
  { key: "TX_REFNIS_NL", header: "Gemeente", format: "text" as const, sortable: true },
  { key: "Woningen_Nieuwbouw_2019sep_2022aug", header: "Nieuwbouw 2019-2022", format: "number" as const, sortable: true },
  { key: "Woningen_Nieuwbouw_2022sep_2025aug", header: "Nieuwbouw 2022-2025", format: "number" as const, sortable: true },
  { key: "Woningen_Nieuwbouw_pct_verschil_36m", header: "Nieuwbouw %", format: "percentage" as const, sortable: true },
]

export function VergunningenSection({ data }: VergunningenSectionProps) {
  // Prepare grouped bar chart data for new construction
  const nieuwbouwData = useMemo(() => {
    return data
      .filter(d =>
        d.Woningen_Nieuwbouw_2022sep_2025aug != null &&
        d.Woningen_Nieuwbouw_2022sep_2025aug > 0
      )
      .map(d => ({
        name: d.TX_REFNIS_NL,
        "2019-2022": d.Woningen_Nieuwbouw_2019sep_2022aug ?? 0,
        "2022-2025": d.Woningen_Nieuwbouw_2022sep_2025aug ?? 0,
        verschil: d.Woningen_Nieuwbouw_pct_verschil_36m ?? 0,
      }))
      .sort((a, b) => b["2022-2025"] - a["2022-2025"])
      .slice(0, 15) // Top 15 municipalities
  }, [data])

  // Prepare grouped bar chart data for renovations
  const renovatieData = useMemo(() => {
    return data
      .filter(d =>
        d.Gebouwen_Renovatie_2022sep_2025aug != null &&
        d.Gebouwen_Renovatie_2022sep_2025aug > 0
      )
      .map(d => ({
        name: d.TX_REFNIS_NL,
        "2019-2022": d.Gebouwen_Renovatie_2019sep_2022aug ?? 0,
        "2022-2025": d.Gebouwen_Renovatie_2022sep_2025aug ?? 0,
        verschil: d.Gebouwen_Renovatie_pct_verschil_36m ?? 0,
      }))
      .sort((a, b) => b["2022-2025"] - a["2022-2025"])
      .slice(0, 15) // Top 15 municipalities
  }, [data])

  // Percentage difference data
  const nieuwbouwVerschilData = useMemo(() => {
    return data
      .filter(d => d.Woningen_Nieuwbouw_pct_verschil_36m != null)
      .map(d => ({
        name: d.TX_REFNIS_NL,
        verschil: d.Woningen_Nieuwbouw_pct_verschil_36m ?? 0,
      }))
      .sort((a, b) => a.verschil - b.verschil)
      .slice(0, 20)
  }, [data])

  const renovatieVerschilData = useMemo(() => {
    return data
      .filter(d => d.Gebouwen_Renovatie_pct_verschil_36m != null)
      .map(d => ({
        name: d.TX_REFNIS_NL,
        verschil: d.Gebouwen_Renovatie_pct_verschil_36m ?? 0,
      }))
      .sort((a, b) => a.verschil - b.verschil)
      .slice(0, 20)
  }, [data])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Bouwvergunningen - 36 maanden vergelijking</h2>
        <p className="text-muted-foreground">
          Vergelijking van nieuwbouw en renovatie tussen twee 36-maanden periodes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* New construction comparison */}
        <div>
          <h3 className="text-lg font-medium mb-3">Nieuwbouw woningen - 36 maanden</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={nieuwbouwData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Aantal woningen', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="2019-2022" fill="var(--color-chart-2)" />
              <Bar dataKey="2022-2025" fill="var(--color-chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Renovation comparison */}
        <div>
          <h3 className="text-lg font-medium mb-3">Renovatie gebouwen - 36 maanden</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={renovatieData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Aantal gebouwen', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="2019-2022" fill="var(--color-chart-4)" />
              <Bar dataKey="2022-2025" fill="var(--color-chart-3)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Percentage difference charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium mb-3">Percentage verschil nieuwbouw woningen</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={nieuwbouwVerschilData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Verschil (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                formatter={(value) => (typeof value === 'number' ? value.toFixed(1) + '%' : value)}
              />
              <Bar
                dataKey="verschil"
                fill="var(--color-chart-1)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Percentage verschil renovatie gebouwen</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={renovatieVerschilData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Verschil (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                formatter={(value) => (typeof value === 'number' ? value.toFixed(1) + '%' : value)}
              />
              <Bar
                dataKey="verschil"
                fill="var(--color-chart-3)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DataTable data={data} columns={columns} />
    </div>
  )
}
