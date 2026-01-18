"use client"

import * as React from "react"
import { useMemo } from "react"
import type { MunicipalityData } from "./types"
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

interface VergelijkingSectionProps {
  data: MunicipalityData[]
  arrNameByCode?: Map<string, string>
  viewType?: "chart" | "table"
  hideControls?: boolean
}

interface ArrondissementAggregate {
  name: string
  code: string
  huizen: number
  appartementen: number
  flatsRatio: number
  nieuwbouw2019: number
  nieuwbouw2022: number
  renovatie2019: number
  renovatie2022: number
  totalHHToename: number
}

export function VergelijkingSection({ data, arrNameByCode, viewType, hideControls = false }: VergelijkingSectionProps) {
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")
  const activeView = viewType ?? currentView

  // Aggregate data by arrondissement
  const aggregated = useMemo(() => {
    const byArr = new Map<string, ArrondissementAggregate>()

    data.forEach(d => {
      const arrCode = d.CD_SUP_REFNIS
      if (!arrCode) return
      const arrName = arrNameByCode?.get(arrCode) ?? d.TX_REFNIS_NL

      const existing = byArr.get(arrCode) || {
        code: arrCode,
        name: arrName,
        huizen: 0,
        appartementen: 0,
        flatsRatio: 0,
        nieuwbouw2019: 0,
        nieuwbouw2022: 0,
        renovatie2019: 0,
        renovatie2022: 0,
        totalHHToename: 0,
      }

      if (arrNameByCode?.has(arrCode)) {
        existing.name = arrName
      }

      existing.huizen += d.Huizen_totaal_2025 ?? 0
      existing.appartementen += d.Appartementen_2025 ?? 0
      existing.nieuwbouw2019 += d.Woningen_Nieuwbouw_2019sep_2022aug ?? 0
      existing.nieuwbouw2022 += d.Woningen_Nieuwbouw_2022sep_2025aug ?? 0
      existing.renovatie2019 += d.Gebouwen_Renovatie_2019sep_2022aug ?? 0
      existing.renovatie2022 += d.Gebouwen_Renovatie_2022sep_2025aug ?? 0

      if (d.HH_available) {
        existing.totalHHToename +=
          (d.hh_1_abs_toename ?? 0) +
          (d.hh_2_abs_toename ?? 0) +
          (d.hh_3_abs_toename ?? 0) +
          (d["hh_4+_abs_toename"] ?? 0)
      }

      byArr.set(arrCode, existing)
    })

    // Calculate flats ratio for each arrondissement
    return Array.from(byArr.values())
      .map(arr => ({
        ...arr,
        flatsRatio: arr.huizen > 0 ? (arr.appartementen / arr.huizen) * 100 : 0,
      }))
      .filter(arr => arr.huizen > 0) // Only include arrondissements with data
  }, [data])

  const exportData = useMemo(() => {
    return aggregated.map((arr) => ({
      label: arr.name,
      value: 0,
      periodCells: [arr.name],
      Huizen_2025: arr.huizen,
      Flats_ratio_pct: arr.flatsRatio,
      Nieuwbouw_2019_2022: arr.nieuwbouw2019,
      Nieuwbouw_2022_2025: arr.nieuwbouw2022,
      Renovatie_2019_2022: arr.renovatie2019,
      Renovatie_2022_2025: arr.renovatie2022,
      HH_toename_2025_2040: arr.totalHHToename,
    }))
  }, [aggregated])

  // Prepare data for different charts
  const huizenData = useMemo(() =>
    [...aggregated].sort((a, b) => b.huizen - a.huizen),
    [aggregated]
  )

  const flatsRatioData = useMemo(() =>
    [...aggregated]
      .filter(a => a.flatsRatio > 0)
      .sort((a, b) => b.flatsRatio - a.flatsRatio),
    [aggregated]
  )

  const nieuwbouwData = useMemo(() =>
    [...aggregated]
      .filter(a => a.nieuwbouw2022 > 0)
      .sort((a, b) => b.nieuwbouw2022 - a.nieuwbouw2022),
    [aggregated]
  )

  const renovatieData = useMemo(() =>
    [...aggregated]
      .filter(a => a.renovatie2022 > 0)
      .sort((a, b) => b.renovatie2022 - a.renovatie2022),
    [aggregated]
  )

  const hhToenameData = useMemo(() =>
    [...aggregated]
      .filter(a => a.totalHHToename > 0)
      .sort((a, b) => b.totalHHToename - a.totalHHToename),
    [aggregated]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Vergelijking arrondissementen</h2>
          <p className="text-muted-foreground">
            Overzicht en verschillen tussen {aggregated.length} arrondissementen.
          </p>
        </div>
        {!hideControls && (
          <ExportButtons
            data={exportData}
            title="Vergelijking arrondissementen"
            slug="betaalbaar-arr"
            sectionId="vergelijking"
            viewType={activeView}
            periodHeaders={["Arrondissement"]}
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
              <div>
                <h3 className="text-lg font-medium mb-3">Totaal huizen 2025</h3>
                <ResponsiveContainer width="100%" height={Math.max(300, huizenData.length * 25)}>
                  <BarChart data={huizenData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
                    <Tooltip
                      contentStyle={CHART_THEME.tooltip}
                    />
                    <Bar dataKey="huizen" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Flats ratio per arrondissement (%)</h3>
                <ResponsiveContainer width="100%" height={Math.max(260, flatsRatioData.length * 20)}>
                  <BarChart data={flatsRatioData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={CHART_THEME.tooltip}
                      formatter={(value) => (typeof value === 'number' ? value.toFixed(2) + '%' : value)}
                    />
                    <Bar dataKey="flatsRatio" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Nieuwbouw 2022-2025 per arrondissement</h3>
                <ResponsiveContainer width="100%" height={Math.max(260, nieuwbouwData.length * 20)}>
                  <BarChart data={nieuwbouwData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Aantal woningen', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={CHART_THEME.tooltip}
                    />
                    <Bar dataKey="nieuwbouw2022" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Renovatie 2022-2025 per arrondissement</h3>
                <ResponsiveContainer width="100%" height={Math.max(260, renovatieData.length * 20)}>
                  <BarChart data={renovatieData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Aantal gebouwen', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={CHART_THEME.tooltip}
                    />
                    <Bar dataKey="renovatie2022" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {hhToenameData.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Totale huishoudensgroei 2025-2040 per arrondissement</h3>
                  <ResponsiveContainer width="100%" height={Math.max(260, hhToenameData.length * 20)}>
                    <BarChart data={hhToenameData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: 'Absolute toename', angle: -90, position: 'insideLeft' }} />
                      <Tooltip
                        contentStyle={CHART_THEME.tooltip}
                      />
                      <Bar dataKey="totalHHToename" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {activeView === "table" && (
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-medium">Arrondissement</th>
                      <th className="text-right p-2 font-medium">Huizen 2025</th>
                      <th className="text-right p-2 font-medium">Flats ratio (%)</th>
                      <th className="text-right p-2 font-medium">Nieuwbouw 2019-2022</th>
                      <th className="text-right p-2 font-medium">Nieuwbouw 2022-2025</th>
                      <th className="text-right p-2 font-medium">Renovatie 2019-2022</th>
                      <th className="text-right p-2 font-medium">Renovatie 2022-2025</th>
                      <th className="text-right p-2 font-medium">Totale HH toename</th>
                    </tr>
                  </thead>
                  <tbody>
                    {huizenData.map((arr, idx) => (
                      <tr key={arr.code} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                        <td className="p-2">{arr.name}</td>
                        <td className="text-right p-2">{arr.huizen.toLocaleString('nl-BE')}</td>
                        <td className="text-right p-2">{arr.flatsRatio.toFixed(2)}%</td>
                        <td className="text-right p-2">{arr.nieuwbouw2019.toLocaleString('nl-BE')}</td>
                        <td className="text-right p-2">{arr.nieuwbouw2022.toLocaleString('nl-BE')}</td>
                        <td className="text-right p-2">{arr.renovatie2019.toLocaleString('nl-BE')}</td>
                        <td className="text-right p-2">{arr.renovatie2022.toLocaleString('nl-BE')}</td>
                        <td className="text-right p-2">{arr.totalHHToename > 0 ? arr.totalHHToename.toLocaleString('nl-BE') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <Tabs defaultValue="chart" onValueChange={(value) => setCurrentView(value as "chart" | "table")}>
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Totaal huizen 2025</h3>
              <ResponsiveContainer width="100%" height={Math.max(300, huizenData.length * 25)}>
                <BarChart data={huizenData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
                  <Tooltip
                    contentStyle={CHART_THEME.tooltip}
                  />
                  <Bar dataKey="huizen" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Flats ratio per arrondissement (%)</h3>
              <ResponsiveContainer width="100%" height={Math.max(260, flatsRatioData.length * 20)}>
                <BarChart data={flatsRatioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={CHART_THEME.tooltip}
                    formatter={(value) => (typeof value === 'number' ? value.toFixed(2) + '%' : value)}
                  />
                  <Bar dataKey="flatsRatio" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Nieuwbouw 2022-2025 per arrondissement</h3>
              <ResponsiveContainer width="100%" height={Math.max(260, nieuwbouwData.length * 20)}>
                <BarChart data={nieuwbouwData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: 'Aantal woningen', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={CHART_THEME.tooltip}
                  />
                  <Bar dataKey="nieuwbouw2022" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Renovatie 2022-2025 per arrondissement</h3>
              <ResponsiveContainer width="100%" height={Math.max(260, renovatieData.length * 20)}>
                <BarChart data={renovatieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: 'Aantal gebouwen', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={CHART_THEME.tooltip}
                  />
                  <Bar dataKey="renovatie2022" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {hhToenameData.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Totale huishoudensgroei 2025-2040 per arrondissement</h3>
                <ResponsiveContainer width="100%" height={Math.max(260, hhToenameData.length * 20)}>
                  <BarChart data={hhToenameData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} height={100} angle={-45} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'Absolute toename', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={CHART_THEME.tooltip}
                    />
                    <Bar dataKey="totalHHToename" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
          <TabsContent value="table">
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-3">Overzichtstabel</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-medium">Arrondissement</th>
                      <th className="text-right p-2 font-medium">Huizen 2025</th>
                      <th className="text-right p-2 font-medium">Flats ratio (%)</th>
                      <th className="text-right p-2 font-medium">Nieuwbouw 2019-2022</th>
                      <th className="text-right p-2 font-medium">Nieuwbouw 2022-2025</th>
                      <th className="text-right p-2 font-medium">Renovatie 2019-2022</th>
                      <th className="text-right p-2 font-medium">Renovatie 2022-2025</th>
                      <th className="text-right p-2 font-medium">Totale HH toename</th>
                    </tr>
                  </thead>
                  <tbody>
                    {huizenData.map((arr, idx) => (
                      <tr key={arr.code} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                        <td className="p-2">{arr.name}</td>
                        <td className="text-right p-2">{arr.huizen.toLocaleString('nl-BE')}</td>
                        <td className="text-right p-2">{arr.flatsRatio.toFixed(2)}%</td>
                        <td className="text-right p-2">{arr.nieuwbouw2019.toLocaleString('nl-BE')}</td>
                        <td className="text-right p-2">{arr.nieuwbouw2022.toLocaleString('nl-BE')}</td>
                        <td className="text-right p-2">{arr.renovatie2019.toLocaleString('nl-BE')}</td>
                        <td className="text-right p-2">{arr.renovatie2022.toLocaleString('nl-BE')}</td>
                        <td className="text-right p-2">{arr.totalHHToename > 0 ? arr.totalHHToename.toLocaleString('nl-BE') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
