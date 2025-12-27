"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterableChart } from "../shared/FilterableChart"
import { FilterableTable } from "../shared/FilterableTable"
import { ExportButtons } from "../shared/ExportButtons"
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Import CSV data
import aantalCsvRaw from "../../../../analyses/energiekaart-premies/results/premies-res-tijdreeks-algemeen__default__Algemene Totalen__pivottable__Matrix__Aantal.csv"
import bedragCsvRaw from "../../../../analyses/energiekaart-premies/results/premies-res-tijdreeks-algemeen__default__Algemene Totalen__pivottable__Matrix__Totaal bedrag.csv"

// Types
type PremieRow = {
  Jaar: string
  Regio: string
  value: number
}

// Parse CSV data
function parseCSV(csvText: string): PremieRow[] {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",")
  const rows: PremieRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",")
    if (values.length >= 3) {
      rows.push({
        Jaar: values[0],
        Regio: values[1],
        value: parseFloat(values[2]) || 0,
      })
    }
  }

  return rows
}

const aantalData = parseCSV(aantalCsvRaw)
const bedragData = parseCSV(bedragCsvRaw)

// Combine data for chart
function getCombinedData() {
  const combined = new Map<string, { jaar: string; aantal: number; bedrag: number }>()

  for (const row of aantalData) {
    const key = row.Jaar
    if (!combined.has(key)) {
      combined.set(key, { jaar: row.Jaar, aantal: 0, bedrag: 0 })
    }
    combined.get(key)!.aantal += row.value
  }

  for (const row of bedragData) {
    const key = row.Jaar
    if (!combined.has(key)) {
      combined.set(key, { jaar: row.Jaar, aantal: 0, bedrag: 0 })
    }
    combined.get(key)!.bedrag += row.value
  }

  return Array.from(combined.values()).sort((a, b) => a.jaar.localeCompare(b.jaar))
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(n)
}

export function EnergiepremiesDashboard() {
  const combinedData = getCombinedData()
  const [currentView, setCurrentView] = React.useState<"chart" | "table">("chart")

  // Prepare data for export (aantal)
  const aantalExportData = aantalData.map((row) => ({
    label: row.Jaar,
    value: row.value,
    periodCells: [row.Jaar, row.Regio],
  }))

  // Prepare data for export (bedrag)
  const bedragExportData = bedragData.map((row) => ({
    label: row.Jaar,
    value: row.value,
    periodCells: [row.Jaar, row.Regio],
  }))

  return (
    <div className="space-y-6">
      {/* Section 1: Aantal premies */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Aantal toegekende premies</h2>
          <ExportButtons
            data={aantalExportData}
            title="Aantal toegekende energiepremies"
            slug="energiekaart-premies"
            sectionId="aantal"
            viewType={currentView}
            periodHeaders={["Jaar", "Regio"]}
            valueLabel="Aantal"
            dataSource="Energiekaart Vlaanderen"
            dataSourceUrl="https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen"
          />
        </div>

        <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table")}>
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Evolutie aantal premies per jaar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={combinedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jaar" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatNumber(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="aantal"
                        stroke="#2563eb"
                        strokeWidth={2}
                        name="Aantal premies"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Data aantal premies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Jaar</th>
                        <th className="text-left p-2">Regio</th>
                        <th className="text-right p-2">Aantal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aantalData.map((row, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{row.Jaar}</td>
                          <td className="p-2">{row.Regio}</td>
                          <td className="text-right p-2">{formatNumber(row.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Section 2: Totaal bedrag */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Totaal bedrag uitgekeerde premies</h2>
          <ExportButtons
            data={bedragExportData}
            title="Totaal bedrag energiepremies"
            slug="energiekaart-premies"
            sectionId="bedrag"
            viewType={currentView}
            periodHeaders={["Jaar", "Regio"]}
            valueLabel="Bedrag (EUR)"
            dataSource="Energiekaart Vlaanderen"
            dataSourceUrl="https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen"
          />
        </div>

        <Tabs defaultValue="chart">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Evolutie totaalbedrag per jaar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={combinedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jaar" />
                      <YAxis tickFormatter={(value) => `€${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value: number) => formatEuro(value)} />
                      <Legend />
                      <Bar
                        dataKey="bedrag"
                        fill="#16a34a"
                        name="Totaalbedrag (EUR)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Data totaalbedrag</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Jaar</th>
                        <th className="text-left p-2">Regio</th>
                        <th className="text-right p-2">Bedrag (EUR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bedragData.map((row, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{row.Jaar}</td>
                          <td className="p-2">{row.Regio}</td>
                          <td className="text-right p-2">{formatEuro(row.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
