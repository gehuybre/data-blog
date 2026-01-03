"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

import { formatScaledEuro, formatScaledNumber, getCurrencyScale } from "./formatters"

interface ChartDataPoint {
  jaar: number
  value: number
}

interface EnergiekaartChartProps {
  data: ChartDataPoint[]
  label: string
  isCurrency?: boolean
}

import { CHART_THEME } from "@/lib/chart-theme"

export function EnergiekaartChart({ data, label, isCurrency = false }: EnergiekaartChartProps) {
  // Calculate 4-year moving average
  const dataWithAverage = data.map((point, index) => {
    if (index < 3) {
      return { ...point, average: undefined }
    }
    const sum = data
      .slice(index - 3, index + 1)
      .reduce((acc, curr) => acc + curr.value, 0)
    return { ...point, average: sum / 4 }
  })

  const scale = isCurrency ? getCurrencyScale(data.map((d) => d.value)) : null

  const formatValue = (value: number) => {
    if (isCurrency && scale) return formatScaledEuro(value, scale)
    return new Intl.NumberFormat("nl-BE").format(value)
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={dataWithAverage} margin={CHART_THEME.margin}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} vertical={false} />
        <XAxis
          dataKey="jaar"
          tickFormatter={(value) => value.toString()}
          fontSize={CHART_THEME.fontSize}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(value) => {
            if (typeof value !== "number") return String(value)
            if (!isCurrency || !scale) return new Intl.NumberFormat("nl-BE").format(value)
            return formatScaledNumber(value, scale)
          }}
          fontSize={CHART_THEME.fontSize}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: number | undefined) => value !== undefined ? formatValue(value) : ""}
          labelFormatter={(jaar) => `Jaar: ${jaar}`}
          cursor={{ fill: "var(--muted)", opacity: 0.2 }}
          contentStyle={{
            ...CHART_THEME.tooltip,
            zIndex: 50,
          }}
        />
        <Legend iconType="circle" />
        <Bar
          dataKey="value"
          fill="var(--color-chart-1)"
          name={label}
          radius={[4, 4, 0, 0]}
        />
        <Line
          type="monotone"
          dataKey="average"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          dot={false}
          name="4-jaar gemiddelde"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
