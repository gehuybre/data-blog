"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart } from "recharts"

interface DataPoint {
  y: number
  q: number
  [key: string]: any
}

interface FilterableChartProps {
  data: DataPoint[]
  metric: string
}

export function FilterableChart({ data, metric }: FilterableChartProps) {
  const chartData = useMemo(() => {
    // Calculate moving average (last 4 quarters)
    return data.map((d, i) => {
      const val = d[metric] as number
      let sum = 0
      let count = 0
      // Look back 3 quarters + current
      for (let j = 0; j < 4; j++) {
        if (i - j >= 0) {
          const prev = data[i - j]
          sum += prev[metric] as number
          count++
        }
      }
      // We want "12-maandelijks lopend gemiddelde".
      // If we have quarterly data, the sum of the last 4 quarters is the annual total.
      // The average of the last 4 quarters is the quarterly average.
      // Usually "12-month moving average" on monthly data means "Average of last 12 months".
      // On quarterly data, "Average of last 4 quarters" is equivalent.
      const ma = count === 4 ? sum / 4 : null // Only show if we have full year? Or show partial?
      
      return {
        name: `${d.y} Q${d.q}`,
        value: val,
        ma: ma
      }
    })
  }, [data, metric])

  return (
    <div className="h-[400px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} aspect={2}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" name="Kwartaal" fill="#8884d8" />
          <Line type="monotone" dataKey="ma" name="Gemiddelde (4 kwartalen)" stroke="#ff7300" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
