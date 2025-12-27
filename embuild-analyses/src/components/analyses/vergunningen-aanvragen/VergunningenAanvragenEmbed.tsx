"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Import data
import nieuwbouwYearly from "../../../../analyses/vergunningen-aanvragen/results/nieuwbouw_yearly.json"
import verbouwYearly from "../../../../analyses/vergunningen-aanvragen/results/verbouw_yearly.json"
import sloopYearly from "../../../../analyses/vergunningen-aanvragen/results/sloop_yearly.json"

type YearlyRow = { y: number; p: number; g: number; w: number; m2: number }
type SloopYearlyRow = { y: number; p: number; g: number; m2: number; m3: number }

type SectionType = "nieuwbouw" | "verbouw" | "sloop"

function formatInt(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

interface VergunningenAanvragenEmbedProps {
  section: SectionType
  viewType: "chart" | "table" | "map"
}

export function VergunningenAanvragenEmbed({
  section,
  viewType,
}: VergunningenAanvragenEmbedProps) {
  const { data, title, metric, label } = useMemo(() => {
    if (section === "nieuwbouw") {
      return {
        data: nieuwbouwYearly as YearlyRow[],
        title: "Nieuwbouw vergunningsaanvragen",
        metric: "w" as const,
        label: "Wooneenheden",
      }
    } else if (section === "verbouw") {
      return {
        data: verbouwYearly as YearlyRow[],
        title: "Verbouw vergunningsaanvragen",
        metric: "w" as const,
        label: "Wooneenheden",
      }
    } else {
      return {
        data: sloopYearly as SloopYearlyRow[],
        title: "Sloop vergunningsaanvragen",
        metric: "m2" as const,
        label: "Gesloopte oppervlakte (m²)",
      }
    }
  }, [section])

  const chartData = useMemo(() => {
    return data.map((row) => ({
      jaar: row.y,
      waarde: row[metric],
    }))
  }, [data, metric])

  if (viewType === "map") {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Kaartweergave niet beschikbaar voor deze data
        </p>
      </div>
    )
  }

  if (viewType === "table") {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Jaar</th>
              <th className="text-right p-2">{label}</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => (
              <tr key={row.jaar} className="border-b">
                <td className="p-2">{row.jaar}</td>
                <td className="text-right p-2">{formatInt(row.waarde)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Chart view (default)
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="jaar" />
            <YAxis tickFormatter={formatInt} />
            <Tooltip formatter={(v: number) => formatInt(v)} />
            <Bar dataKey="waarde" name={label} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
