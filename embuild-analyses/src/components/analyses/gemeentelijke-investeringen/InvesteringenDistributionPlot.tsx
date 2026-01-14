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

        // Sort data by value
        const sortedData = [...data].sort((a, b) => a.value - b.value)
        const totalCount = sortedData.length

        // Create 20 bins (5% each)
        const BIN_COUNT = 20
        const binSize = totalCount / BIN_COUNT

        const bins = Array.from({ length: BIN_COUNT }, (_, i) => {
            const startIndex = Math.floor(i * binSize)
            const endIndex = Math.min(Math.floor((i + 1) * binSize), totalCount)
            const binData = sortedData.slice(startIndex, endIndex)

            // Calculate median value for the bin
            const medianValue = binData.length > 0
                ? binData[Math.floor(binData.length / 2)].value
                : 0

            return {
                binIndex: i,
                percentileLabel: `${i * 5}-${(i + 1) * 5}%`,
                medianValue,
                count: binData.length,
                isHighlighted: false,
                min: binData.length > 0 ? binData[0].value : 0,
                max: binData.length > 0 ? binData[binData.length - 1].value : 0
            }
        })

        let selectedMuniValue = null
        let selectedMuniName = null

        if (selectedMunicipality) {
            const muniIdx = sortedData.findIndex(d => d.NIS_code === selectedMunicipality)
            if (muniIdx !== -1) {
                selectedMuniValue = sortedData[muniIdx].value
                selectedMuniName = sortedData[muniIdx].municipality
                const binIdx = Math.min(Math.floor(muniIdx / binSize), BIN_COUNT - 1)
                bins[binIdx].isHighlighted = true
            }
        }

        const yMax = Math.max(...bins.map(b => b.medianValue))

        return { bins, selectedMuniValue, selectedMuniName, yMax }
    }, [data, selectedMunicipality])

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
                    <p className="font-bold mb-1">Percentiel Groep ({bin.percentileLabel})</p>
                    <p className="text-muted-foreground">
                        Bereik: {valueFormatter(bin.min)} - {valueFormatter(bin.max)}
                    </p>
                    <p className="font-medium mt-1">
                        Mediaan in deze groep: <span className="text-primary">{valueFormatter(bin.medianValue)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        ({bin.count} gemeenten in deze schijf)
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
                        dataKey="percentileLabel"
                        label={{ value: 'Percentiel (groepen van 5% van alle gemeenten)', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis
                        label={{ value: selectedMetric === 'Totaal' ? `Investering (€${valueScale || ''})` : 'Investering per inwoner (€)', angle: -90, position: 'insideLeft', offset: 10 }}
                        tickFormatter={valueFormatter}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="medianValue">
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
                            y={selectedMuniValue}
                            stroke="#ef4444"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                        >
                            <Label
                                value={selectedMuniName || ''}
                                position="right"
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
