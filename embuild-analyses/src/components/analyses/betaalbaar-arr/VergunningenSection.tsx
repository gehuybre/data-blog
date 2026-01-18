"use client"

import * as React from "react"
import { useMemo } from "react"
import type { MunicipalityData } from "./types"
import { DataTable } from "./DataTable"
import { ExportButtons } from "../shared/ExportButtons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CHART_THEME } from "@/lib/chart-theme"
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
  viewType?: "chart" | "table"
  hideControls?: boolean
}

const columns = [
  { key: "TX_REFNIS_NL", header: "Gemeente", format: "text" as const, sortable: true },
  { key: "Woningen_Nieuwbouw_2019sep_2022aug", header: "Nieuwbouw 2019-2022", format: "number" as const, sortable: true },
  { key: "Woningen_Nieuwbouw_2022sep_2025aug", header: "Nieuwbouw 2022-2025", format: "number" as const, sortable: true },
  { key: "Woningen_Nieuwbouw_pct_verschil_36m", header: "Nieuwbouw %", format: "percentage" as const, sortable: true },
  { key: "Gebouwen_Renovatie_2019sep_2022aug", header: "Renovatie 2019-2022", format: "number" as const, sortable: true },
  { key: "Gebouwen_Renovatie_2022sep_2025aug", header: "Renovatie 2022-2025", format: "number" as const, sortable: true },
  { key: "Gebouwen_Renovatie_pct_verschil_36m", header: "Renovatie %", format: "percentage" as const, sortable: true },
]

export function VergunningenSection({ data, viewType, hideControls = false }: VergunningenSectionProps) {
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")
  const activeView = viewType ?? currentView

  const exportData = useMemo(() => {
    return data.map((d) => ({
      label: d.TX_REFNIS_NL,
      value: 0,
      periodCells: [d.TX_REFNIS_NL],
      Nieuwbouw_2019_2022: d.Woningen_Nieuwbouw_2019sep_2022aug ?? 0,
      Nieuwbouw_2022_2025: d.Woningen_Nieuwbouw_2022sep_2025aug ?? 0,
      Nieuwbouw_pct: d.Woningen_Nieuwbouw_pct_verschil_36m ?? 0,
      Renovatie_2019_2022: d.Gebouwen_Renovatie_2019sep_2022aug ?? 0,
      Renovatie_2022_2025: d.Gebouwen_Renovatie_2022sep_2025aug ?? 0,
      Renovatie_pct: d.Gebouwen_Renovatie_pct_verschil_36m ?? 0,
    }))
  }, [data])
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Bouwvergunningen - 36 maanden vergelijking</h2>
          <p className="text-muted-foreground">
            Vergelijking van nieuwbouw en renovatie tussen twee 36-maanden periodes.
          </p>
        </div>
        {!hideControls && (
          <ExportButtons
            data={exportData}
            title="Bouwvergunningen - 36 maanden vergelijking"
            slug="betaalbaar-arr"
            sectionId="vergunningen"
            viewType={activeView}
            periodHeaders={["Gemeente"]}
            valueLabel="Aantal"
            dataSource="Statbel, Vlaamse Overheid"
            dataSourceUrl="https://statbel.fgov.be/"
          />
        )}
      </div>

      {hideControls ? (
        <>
          {activeView === "chart" && (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-3">Nieuwbouw woningen - 36 maanden</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={nieuwbouwData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: 'Aantal woningen', angle: -90, position: 'insideLeft' }} />
                      <Tooltip
                        contentStyle={CHART_THEME.tooltip}
                      />
                      <Legend />
                      <Bar dataKey="2019-2022" fill="var(--color-chart-2)" />
                      <Bar dataKey="2022-2025" fill="var(--color-chart-1)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Renovatie gebouwen - 36 maanden</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={renovatieData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: 'Aantal gebouwen', angle: -90, position: 'insideLeft' }} />
                      <Tooltip
                        contentStyle={CHART_THEME.tooltip}
                      />
                      <Legend />
                      <Bar dataKey="2019-2022" fill="var(--color-chart-4)" />
                      <Bar dataKey="2022-2025" fill="var(--color-chart-3)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-3">Percentage verschil nieuwbouw woningen</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={nieuwbouwVerschilData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: 'Verschil (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip
                        contentStyle={CHART_THEME.tooltip}
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
                        contentStyle={CHART_THEME.tooltip}
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
            </>
          )}

          {activeView === "table" && (
            <DataTable data={data} columns={columns} />
          )}
        </>
      ) : (
        <Tabs defaultValue="chart" onValueChange={(value) => setCurrentView(value as "chart" | "table")}>
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium mb-3">Nieuwbouw woningen - 36 maanden</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={nieuwbouwData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Aantal woningen', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={CHART_THEME.tooltip}
                    />
                    <Legend />
                    <Bar dataKey="2019-2022" fill="var(--color-chart-2)" />
                    <Bar dataKey="2022-2025" fill="var(--color-chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Renovatie gebouwen - 36 maanden</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={renovatieData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Aantal gebouwen', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={CHART_THEME.tooltip}
                    />
                    <Legend />
                    <Bar dataKey="2019-2022" fill="var(--color-chart-4)" />
                    <Bar dataKey="2022-2025" fill="var(--color-chart-3)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium mb-3">Percentage verschil nieuwbouw woningen</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={nieuwbouwVerschilData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Verschil (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={CHART_THEME.tooltip}
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
                      contentStyle={CHART_THEME.tooltip}
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
          </TabsContent>
          <TabsContent value="table">
            <DataTable data={data} columns={columns} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
