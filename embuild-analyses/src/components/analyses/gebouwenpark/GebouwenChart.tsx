"use client"

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createAutoScaledFormatter, formatNumber } from "@/lib/number-formatters"

interface ChartDataPoint {
  year: number
  total: number
  residential: number
}

interface GebouwenChartProps {
  data: ChartDataPoint[]
  totalLabel?: string
  residentialLabel?: string
  showBothLines?: boolean
}

export function GebouwenChart({
  data,
  totalLabel = "Totaal Gebouwen",
  residentialLabel = "Woongebouwen",
  showBothLines = true
}: GebouwenChartProps) {
  // Auto-scale formatter for Y-axis to prevent label overflow
  const { formatter: yAxisFormatter } = useMemo(() => {
    const values = data.flatMap(d => [d.total, d.residential])
    return createAutoScaledFormatter(values, false) // false = not currency
  }, [data])
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis tickFormatter={yAxisFormatter} />
        <Tooltip formatter={(val: any) => formatNumber(Number(val))} />
        <Legend />
        <Line type="monotone" dataKey="total" name={totalLabel} stroke="#8884d8" strokeWidth={2} />
        {showBothLines && (
          <Line type="monotone" dataKey="residential" name={residentialLabel} stroke="#82ca9d" strokeWidth={2} />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
