"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart
} from "recharts"
import type { LegendPayload } from "recharts/types/component/DefaultLegendContent"
import { CHART_COLORS, CHART_THEME } from "@/lib/chart-theme"
import { createAutoScaledFormatter } from "@/lib/number-formatters"

type UnknownRecord = Record<string, any>

export type ChartType = 'composed' | 'line' | 'bar' | 'area'

interface FilterableChartProps<TData = UnknownRecord> {
  data: TData[]
  metric?: string
  getLabel?: (d: TData) => string
  getValue?: (d: TData, metric?: string) => number
  getSortValue?: (d: TData) => number
  yAxisLabel?: string
  showMovingAverage?: boolean
  series?: Array<{
    key: string
    label?: string
    color?: string
  }>
  legendVisibleKeys?: string[]
  highlightSeriesKey?: string | null
  /**
   * Optional Y-axis formatter. If not provided and values are large (>10k),
   * an auto-scaled formatter will be used to prevent label overflow.
   */
  yAxisFormatter?: (value: number) => string
  /**
   * If true, treats values as currency and uses € symbol in auto-scaling.
   * Only applies when yAxisFormatter is not provided. Default: false.
   */
  isCurrency?: boolean
  /**
   * Chart type to render. Default: 'composed' (Bar + Line for moving average)
   * - 'composed': Bar chart with optional Line overlay (current default behavior)
   * - 'line': Line chart only
   * - 'bar': Bar chart only
   * - 'area': Area chart (filled line chart)
   */
  chartType?: ChartType
}

export function FilterableChart<TData = UnknownRecord>({
  data,
  metric,
  getLabel,
  getValue,
  getSortValue,
  yAxisLabel,
  showMovingAverage = true,
  series,
  legendVisibleKeys,
  highlightSeriesKey,
  yAxisFormatter,
  isCurrency = false,
  chartType = 'composed',
}: FilterableChartProps<TData>) {
  const [mounted, setMounted] = useState(false)

  const hasSeries = Boolean(series?.length)

  useEffect(() => {
    setMounted(true)
  }, [])

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

    if (hasSeries) {
      return input.map((d) => ({
        ...d,
        name: labelGetter(d),
      }))
    }

    return input.map((d, i) => {
      const val = valueGetter(d, metric)
      let ma: number | null = null
      if (showMovingAverage) {
        let sum = 0
        let count = 0
        for (let j = 0; j < 4; j++) {
          if (i - j >= 0) {
            const prev = input[i - j]
            sum += valueGetter(prev, metric)
            count++
          }
        }
        ma = count === 4 ? sum / 4 : null
      }
      return {
        name: labelGetter(d),
        value: val,
        ma,
      }
    })
  }, [data, metric, getLabel, getValue, getSortValue, showMovingAverage, hasSeries])

  // Auto-scale formatter for Y-axis to prevent label overflow
  const computedYAxisFormatter = useMemo(() => {
    if (yAxisFormatter) return yAxisFormatter
    const values = hasSeries
      ? chartData.flatMap((d: any) =>
          (series ?? []).map((s) => (typeof d?.[s.key] === "number" ? d[s.key] : NaN))
        )
      : chartData.map((d: any) => d.value)
    const { formatter } = createAutoScaledFormatter(values, isCurrency)
    return formatter
  }, [chartData, yAxisFormatter, isCurrency, hasSeries, series])

  const lineSeries = useMemo(() => {
    if (!hasSeries) return []
    const palette = [
      "var(--color-chart-1)",
      "var(--color-chart-2)",
      "var(--color-chart-3)",
      "var(--color-chart-4)",
      "var(--color-chart-5)",
    ]
    return (series ?? []).map((s, index) => ({
      ...s,
      label: s.label ?? s.key,
      color: s.color ?? palette[index % palette.length],
    }))
  }, [hasSeries, series])
  const legendLabelByKey = useMemo(() => {
    return new Map(lineSeries.map((s) => [s.key, s.label ?? s.key]))
  }, [lineSeries])
  const renderLegend = (props: { payload?: readonly LegendPayload[] }) => {
    const payload = props.payload ?? []
    const allowed = legendVisibleKeys ? new Set(legendVisibleKeys) : null
    const items = allowed
      ? payload.filter((item) => item.dataKey && allowed.has(String(item.dataKey)))
      : payload
    if (items.length === 0) return null
    return (
      <ul
        className="recharts-default-legend"
        style={{
          padding: 0,
          margin: 0,
          listStyle: "none",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
        }}
      >
        {items.map((entry) => {
          const payloadName =
            entry.payload && "name" in entry.payload
              ? (entry.payload as { name?: string }).name
              : undefined
          const fallbackLabel =
            legendLabelByKey.get(String(entry.dataKey)) ??
            payloadName ??
            (entry.value != null ? String(entry.value) : undefined) ??
            (typeof entry.dataKey === "string" || typeof entry.dataKey === "number"
              ? String(entry.dataKey)
              : undefined)
          return (
            <li
              key={String(entry.dataKey ?? entry.value)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 8 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: entry.color || "currentColor",
                  display: "inline-block",
                }}
              />
              <span>
                {fallbackLabel}
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  if (!mounted) {
    return <div className="h-[400px] w-full min-w-0" />
  }

  const chartMargin = yAxisLabel ? { ...CHART_THEME.margin, left: 28 } : CHART_THEME.margin

  // Common chart elements
  const commonElements = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} vertical={false} />
      <XAxis
        dataKey="name"
        fontSize={CHART_THEME.fontSize}
        tickLine={false}
        axisLine={false}
      />
      <YAxis
        fontSize={CHART_THEME.fontSize}
        tickLine={false}
        axisLine={false}
        tickFormatter={computedYAxisFormatter}
        label={
          yAxisLabel
            ? {
                value: yAxisLabel,
                angle: -90,
                position: "insideLeft",
                offset: 10,
              }
            : undefined
        }
      />
      <Tooltip
        contentStyle={{
          backgroundColor: "var(--popover)",
          color: "var(--popover-foreground)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
        }}
      />
      {hasSeries ? (
        <Legend iconType="circle" content={renderLegend} />
      ) : legendVisibleKeys ? (
        <Legend iconType="circle" content={renderLegend} />
      ) : (
        <Legend iconType="circle" />
      )}
    </>
  )

  // Render series (for multi-line charts)
  const renderSeriesLines = () => {
    return lineSeries.map((s) => {
      const isHighlighted = highlightSeriesKey && s.key === highlightSeriesKey
      const isDimmed = highlightSeriesKey && s.key !== highlightSeriesKey
      return (
        <Line
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.label}
          stroke={s.color}
          dot={false}
          strokeWidth={isHighlighted ? 3 : 2}
          strokeOpacity={isDimmed ? 0.25 : 1}
        />
      )
    })
  }

  const renderSeriesAreas = () => {
    return lineSeries.map((s) => {
      const isHighlighted = highlightSeriesKey && s.key === highlightSeriesKey
      const isDimmed = highlightSeriesKey && s.key !== highlightSeriesKey
      return (
        <Area
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.label}
          stroke={s.color}
          fill={s.color}
          fillOpacity={isDimmed ? 0.1 : 0.3}
          strokeWidth={isHighlighted ? 3 : 2}
          strokeOpacity={isDimmed ? 0.25 : 1}
        />
      )
    })
  }

  const renderSeriesBars = () => {
    return lineSeries.map((s, index) => {
      const isHighlighted = highlightSeriesKey && s.key === highlightSeriesKey
      const isDimmed = highlightSeriesKey && s.key !== highlightSeriesKey
      return (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.label}
          fill={s.color}
          fillOpacity={isDimmed ? 0.25 : 1}
          radius={[4, 4, 0, 0]}
        />
      )
    })
  }

  // Render single metric chart elements
  const renderSingleMetric = () => {
    switch (chartType) {
      case 'line':
        return (
          <>
            <Line
              type="monotone"
              dataKey="value"
              name="Periode"
              stroke="var(--color-chart-1)"
              dot={false}
              strokeWidth={2}
            />
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="ma"
                name="Gemiddelde (4 periodes)"
                stroke="var(--color-chart-2)"
                dot={false}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
          </>
        )
      case 'bar':
        return (
          <Bar
            dataKey="value"
            name="Periode"
            fill="var(--color-chart-1)"
            radius={[4, 4, 0, 0]}
          />
        )
      case 'area':
        return (
          <>
            <Area
              type="monotone"
              dataKey="value"
              name="Periode"
              stroke="var(--color-chart-1)"
              fill="var(--color-chart-1)"
              fillOpacity={0.3}
            />
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="ma"
                name="Gemiddelde (4 periodes)"
                stroke="var(--color-chart-2)"
                dot={false}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
          </>
        )
      case 'composed':
      default:
        return (
          <>
            <Bar
              dataKey="value"
              name="Periode"
              fill="var(--color-chart-1)"
              radius={[4, 4, 0, 0]}
            />
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="ma"
                name="Gemiddelde (4 periodes)"
                stroke="var(--color-chart-2)"
                dot={false}
                strokeWidth={2}
              />
            )}
          </>
        )
    }
  }

  // Choose the appropriate chart container based on type
  const renderChart = () => {
    // For series data, use the chart type to determine visualization
    if (hasSeries) {
      switch (chartType) {
        case 'line':
          return (
            <LineChart data={chartData} margin={chartMargin}>
              {commonElements}
              {renderSeriesLines()}
            </LineChart>
          )
        case 'bar':
          return (
            <BarChart data={chartData} margin={chartMargin}>
              {commonElements}
              {renderSeriesBars()}
            </BarChart>
          )
        case 'area':
          return (
            <AreaChart data={chartData} margin={chartMargin}>
              {commonElements}
              {renderSeriesAreas()}
            </AreaChart>
          )
        case 'composed':
        default:
          return (
            <ComposedChart data={chartData} margin={chartMargin}>
              {commonElements}
              {renderSeriesLines()}
            </ComposedChart>
          )
      }
    }

    // For single metric, composed chart supports all combinations
    return (
      <ComposedChart data={chartData} margin={chartMargin}>
        {commonElements}
        {renderSingleMetric()}
      </ComposedChart>
    )
  }

  return (
    <div className="h-[400px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}
