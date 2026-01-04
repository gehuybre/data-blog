"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChartDataPoint {
  year: number
  total: number
  residential: number
}

interface GebouwenChartProps {
  data: ChartDataPoint[]
}

const formatNumber = (num: number) => new Intl.NumberFormat('nl-BE').format(num)

export function GebouwenChart({ data }: GebouwenChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis tickFormatter={(val) => `${val / 1000000}M`} />
        <Tooltip formatter={(val: any) => formatNumber(Number(val))} />
        <Legend />
        <Line type="monotone" dataKey="total" name="Totaal Gebouwen" stroke="#8884d8" strokeWidth={2} />
        <Line type="monotone" dataKey="residential" name="Woongebouwen" stroke="#82ca9d" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
