"use client"

import * as React from "react"
import type { MunicipalityData } from "./types"
import { FilterableChart } from "../shared/FilterableChart"
import { DataTable } from "./DataTable"
import { ExportButtons } from "../shared/ExportButtons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface GebouwenparkSectionProps {
  data: MunicipalityData[]
  viewType?: "chart" | "table"
  hideControls?: boolean
}

const columns = [
  { key: "TX_REFNIS_NL", header: "Gemeente", format: "text" as const, sortable: true },
  { key: "Huizen_totaal_2025", header: "Huizen 2025", format: "number" as const, sortable: true },
  { key: "Appartementen_2025", header: "Appartementen 2025", format: "number" as const, sortable: true },
]

export function GebouwenparkSection({ data, viewType, hideControls = false }: GebouwenparkSectionProps) {
  const cleanData = data.filter(d => d.Huizen_totaal_2025 != null && d.Huizen_totaal_2025 > 0)
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")
  const activeView = viewType ?? currentView

  const exportData = React.useMemo(() => {
    return cleanData.map((d) => ({
      label: d.TX_REFNIS_NL,
      value: 0,
      periodCells: [d.TX_REFNIS_NL],
      Huizen_2025: d.Huizen_totaal_2025 ?? 0,
      Appartementen_2025: d.Appartementen_2025 ?? 0,
      Appartementen_ratio_pct: d.Huizen_totaal_2025
        ? ((d.Appartementen_2025 ?? 0) / d.Huizen_totaal_2025) * 100
        : 0,
    }))
  }, [cleanData])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Gebouwenpark 2025</h2>
          <p className="text-muted-foreground">
            Analyse van woningvoorraad: totaal aantal huizen en appartementen per gemeente.
          </p>
        </div>
        {!hideControls && (
          <ExportButtons
            data={exportData}
            title="Gebouwenpark 2025"
            slug="betaalbaar-arr"
            sectionId="gebouwenpark"
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
                  <h3 className="text-lg font-medium mb-3">Aantal huizen</h3>
                  <FilterableChart
                    data={cleanData.sort((a, b) => (b.Huizen_totaal_2025 ?? 0) - (a.Huizen_totaal_2025 ?? 0)).slice(0, 20)}
                    getLabel={(d) => d.TX_REFNIS_NL}
                    getValue={(d) => d.Huizen_totaal_2025 ?? 0}
                    chartType="bar"
                    yAxisLabel="Aantal huizen"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Aantal appartementen</h3>
                  <FilterableChart
                    data={cleanData.sort((a, b) => (b.Appartementen_2025 ?? 0) - (a.Appartementen_2025 ?? 0)).slice(0, 20)}
                    getLabel={(d) => d.TX_REFNIS_NL}
                    getValue={(d) => d.Appartementen_2025 ?? 0}
                    chartType="bar"
                    yAxisLabel="Aantal appartementen"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Ratio appartementen t.o.v. totaal huizen (%)</h3>
                <FilterableChart
                  data={cleanData
                    .map(d => ({
                      ...d,
                      ratio: ((d.Appartementen_2025 ?? 0) / (d.Huizen_totaal_2025 ?? 1) * 100)
                    }))
                    .sort((a, b) => b.ratio - a.ratio)
                    .slice(0, 20)}
                  getLabel={(d) => d.TX_REFNIS_NL}
                  getValue={(d) => (d.Appartementen_2025 ?? 0) / (d.Huizen_totaal_2025 ?? 1) * 100}
                  chartType="bar"
                  yAxisLabel="Percentage (%)"
                />
              </div>
            </>
          )}

          {activeView === "table" && (
            <DataTable data={cleanData} columns={columns} />
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
                <h3 className="text-lg font-medium mb-3">Aantal huizen</h3>
                <FilterableChart
                  data={cleanData.sort((a, b) => (b.Huizen_totaal_2025 ?? 0) - (a.Huizen_totaal_2025 ?? 0)).slice(0, 20)}
                  getLabel={(d) => d.TX_REFNIS_NL}
                  getValue={(d) => d.Huizen_totaal_2025 ?? 0}
                  chartType="bar"
                  yAxisLabel="Aantal huizen"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Aantal appartementen</h3>
                <FilterableChart
                  data={cleanData.sort((a, b) => (b.Appartementen_2025 ?? 0) - (a.Appartementen_2025 ?? 0)).slice(0, 20)}
                  getLabel={(d) => d.TX_REFNIS_NL}
                  getValue={(d) => d.Appartementen_2025 ?? 0}
                  chartType="bar"
                  yAxisLabel="Aantal appartementen"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Ratio appartementen t.o.v. totaal huizen (%)</h3>
              <FilterableChart
                data={cleanData
                  .map(d => ({
                    ...d,
                    ratio: ((d.Appartementen_2025 ?? 0) / (d.Huizen_totaal_2025 ?? 1) * 100)
                  }))
                  .sort((a, b) => b.ratio - a.ratio)
                  .slice(0, 20)}
                getLabel={(d) => d.TX_REFNIS_NL}
                getValue={(d) => (d.Appartementen_2025 ?? 0) / (d.Huizen_totaal_2025 ?? 1) * 100}
                chartType="bar"
                yAxisLabel="Percentage (%)"
              />
            </div>
          </TabsContent>
          <TabsContent value="table">
            <DataTable data={cleanData} columns={columns} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
