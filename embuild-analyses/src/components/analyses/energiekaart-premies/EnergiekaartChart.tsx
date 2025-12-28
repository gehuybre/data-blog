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

interface ChartDataPoint {
  jaar: number
  value: number
}

interface EnergiekaartChartProps {
  data: ChartDataPoint[]
  label: string
  isCurrency?: boolean
}

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

  const formatValue = (value: number) => {
    if (isCurrency) {
      return new Intl.NumberFormat("nl-BE", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }
    return new Intl.NumberFormat("nl-BE").format(value)
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={dataWithAverage} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="jaar"
          tickFormatter={(value) => value.toString()}
          style={{ fontSize: "0.875rem" }}
        />
        <YAxis tickFormatter={formatValue} style={{ fontSize: "0.875rem" }} />
        <Tooltip
          formatter={(value: number) => formatValue(value)}
          labelFormatter={(jaar) => `Jaar: ${jaar}`}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
        <Bar dataKey="value" fill="hsl(var(--primary))" name={label} />
        <Line
          type="monotone"
          dataKey="average"
          stroke="hsl(var(--destructive))"
          strokeWidth={2}
          dot={false}
          name="4-jaar gemiddelde"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
