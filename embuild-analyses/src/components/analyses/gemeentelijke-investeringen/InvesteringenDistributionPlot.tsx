"use client"

import React, { useMemo } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
    Label,
} from 'recharts'
import {
    createAutoScaledFormatter,
    formatCurrency as formatFullCurrency,
} from "@/lib/number-formatters"

interface DataPoint {
    municipality: string
    NIS_code: string
    value: number
}

interface InvesteringenDistributionPlotProps {
    data: DataPoint[]
    selectedMetric: 'Totaal' | 'Per_inwoner'
    selectedMunicipality: string | null
    color?: string
}

export function InvesteringenDistributionPlot({
    data,
    selectedMetric,
    selectedMunicipality,
    color = "#3b82f6"
}: InvesteringenDistributionPlotProps) {
    // Define bins for the histogram
    const BIN_COUNT = 20

    const { bins, selectedMuniValue, selectedMuniName, yMax } = useMemo(() => {
        if (data.length === 0) return { bins: [], selectedMuniValue: null, selectedMuniName: null, yMax: 0 }

        const values = data.map(d => d.value)
        const min = 0 // Always start from 0 for consistency
        const max = Math.max(...values) * 1.05 // Add 5% padding

        const binSize = max / BIN_COUNT
        const bins = Array.from({ length: BIN_COUNT }, (_, i) => ({
            binIndex: i,
            min: i * binSize,
            max: (i + 1) * binSize,
            count: 0,
            isHighlighted: false,
        }))

        let selectedMuniValue = null
        let selectedMuniName = null

        data.forEach(d => {
            const binIdx = Math.min(Math.floor(d.value / binSize), BIN_COUNT - 1)
            bins[binIdx].count++

            if (d.NIS_code === selectedMunicipality) {
                selectedMuniValue = d.value
                selectedMuniName = d.municipality
                bins[binIdx].isHighlighted = true
            }
        })

        const yMax = Math.max(...bins.map(b => b.count))

        return { bins, selectedMuniValue, selectedMuniName, yMax }
    }, [data, selectedMunicipality, BIN_COUNT])

    // Formatters
    const { formatter: valueFormatter, scale: valueScale } = useMemo(() => {
        const values = data.map(d => d.value)
        return createAutoScaledFormatter(values, selectedMetric === 'Totaal')
    }, [data, selectedMetric])

    const formatTooltipValue = (val: number) => {
        return selectedMetric === 'Totaal'
            ? formatFullCurrency(val)
            : `€ ${val.toFixed(2)}`
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const bin = payload[0].payload
            return (
                <div className="bg-background border border-border rounded-md shadow-lg p-3 text-sm">
                    <p className="font-bold mb-1">Verdeling</p>
                    <p className="text-muted-foreground">
                        Bereik: {valueFormatter(bin.min)} - {valueFormatter(bin.max)}
                    </p>
                    <p className="font-medium mt-1">
                        Aantal gemeenten: <span className="text-primary">{bin.count}</span>
                    </p>
                    {bin.isHighlighted && selectedMuniName && (
                        <p className="text-destructive font-medium mt-2 border-t pt-1">
                            Inclusief {selectedMuniName} ({formatTooltipValue(selectedMuniValue!)})
                        </p>
                    )}
                </div>
            )
        }
        return null
    }

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bins} margin={{ top: 40, right: 30, bottom: 60, left: 40 }}>
                    <XAxis
                        dataKey="min"
                        tickFormatter={valueFormatter}
                        label={{ value: selectedMetric === 'Totaal' ? `Investering (€${valueScale || ''})` : 'Investering per inwoner (€)', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis
                        label={{ value: 'Aantal gemeenten', angle: -90, position: 'insideLeft', offset: 10 }}
                        allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="count">
                        {bins.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.isHighlighted ? "#ef4444" : color}
                                fillOpacity={0.8}
                            />
                        ))}
                    </Bar>
                    {selectedMuniValue !== null && (
                        <ReferenceLine
                            x={selectedMuniValue}
                            stroke="#ef4444"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                        >
                            <Label
                                value={selectedMuniName || ''}
                                position="top"
                                fill="#ef4444"
                                fontSize={12}
                                className="font-bold"
                            />
                        </ReferenceLine>
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
