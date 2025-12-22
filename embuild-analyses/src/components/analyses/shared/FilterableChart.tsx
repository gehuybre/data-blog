"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart } from "recharts"

type UnknownRecord = Record<string, any>

interface FilterableChartProps<TData = UnknownRecord> {
  data: TData[]
  metric?: string
  getLabel?: (d: TData) => string
  getValue?: (d: TData, metric?: string) => number
  getSortValue?: (d: TData) => number
}

export function FilterableChart<TData = UnknownRecord>({
  data,
  metric,
  getLabel,
  getValue,
  getSortValue,
}: FilterableChartProps<TData>) {
  const chartData = useMemo(() => {
    const labelGetter =
      getLabel ??
      ((d: any) => d?.label ?? d?.name ?? (metric ? `${d?.y} Q${d?.q}` : ""))

    const valueGetter =
      getValue ??
      ((d: any, m?: string) => {
        if (typeof d?.value === "number") return d.value
        if (m) return Number(d?.[m] ?? 0)
        return Number(d?.value ?? 0)
      })

    const sortGetter =
      getSortValue ??
      ((d: any) => {
        if (typeof d?.sortValue === "number") return d.sortValue
        if (typeof d?.y === "number" && typeof d?.q === "number") return d.y * 10 + d.q
        return 0
      })

    const input = [...data]
    if (input.some((d: any) => typeof d?.sortValue === "number") || getSortValue) {
      input.sort((a: any, b: any) => sortGetter(a) - sortGetter(b))
    }

    // Calculate moving average (last 4 periods)
    return input.map((d, i) => {
      const val = valueGetter(d, metric)
      let sum = 0
      let count = 0
      // Look back 3 periods + current
      for (let j = 0; j < 4; j++) {
        if (i - j >= 0) {
          const prev = input[i - j]
          sum += valueGetter(prev, metric)
          count++
        }
      }
      const ma = count === 4 ? sum / 4 : null // Only show if we have full year? Or show partial?
      
      return {
        name: labelGetter(d),
        value: val,
        ma: ma
      }
    })
  }, [data, metric, getLabel, getValue, getSortValue])

  return (
    <div className="h-[400px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} aspect={2}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" name="Periode" fill="#8884d8" />
          <Line type="monotone" dataKey="ma" name="Gemiddelde (4 periodes)" stroke="#ff7300" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
