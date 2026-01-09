"use client"

import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import {
  createAutoScaledFormatter,
  getScaledLabel,
  formatCurrency,
} from "@/lib/number-formatters"

interface ChartData {
  year: number
  value: number
  domain?: string
}

interface InvesteringenChartProps {
  data: ChartData[]
  selectedMetric: 'total' | 'per_capita'
}

export function InvesteringenChart({ data, selectedMetric }: InvesteringenChartProps) {
  const yAxisLabel = selectedMetric === 'total' ? 'Investering (€)' : 'Investering per inwoner (€)'

  // Auto-scale formatter for Y-axis to prevent label overflow
  const { formatter: yAxisFormatter, scale: yAxisScale } = useMemo(() => {
    const values = data.map(d => d.value)
    return createAutoScaledFormatter(values, true) // true = currency
  }, [data])

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          label={{ value: 'Jaar', position: 'insideBottom', offset: -5 }}
        />
        <YAxis
          label={{ value: getScaledLabel(yAxisLabel, yAxisScale), angle: -90, position: 'insideLeft' }}
          tickFormatter={yAxisFormatter}
        />
        <Tooltip
          formatter={(value: number | undefined) => value !== undefined ? [formatCurrency(value), 'Investering'] : ['', '']}
          labelFormatter={(label) => `Jaar: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Investering"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
