
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { ArrowUpRight, Home, Building2, Warehouse } from 'lucide-react'

import data from '../../../../analyses/gebouwenpark/results/stats_2025.json'

// Helper to format numbers
const formatNumber = (num: number) => new Intl.NumberFormat('nl-BE').format(num)

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function GebouwenDashboard() {
    const { snapshot_2025, time_series } = data
    const national2025 = snapshot_2025.national

    // Prepare data for Bar Chart (Composition 2025)
    const compositionData = Object.entries(national2025.by_type).map(([type, count]) => ({
        name: type.replace('Huizen in ', '').replace('Buildings en ', '').replace('met appartementen', ''),
        value: count
    })).sort((a, b) => b.value - a.value)

    // Prepare data for Time Series
    const timeSeriesData = time_series.years.map((year, idx) => ({
        year,
        total: time_series.national.total_buildings[idx],
        residential: time_series.national.residential_buildings[idx]
    }))

    return (
        <div className="space-y-8">
            {/* Top Level Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Totaal Gebouwen</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(national2025.total)}</div>
                        <p className="text-xs text-muted-foreground">In 2025</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Woongebouwen</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(
                                national2025.by_type['Huizen in gesloten bebouwing'] +
                                national2025.by_type['Huizen in halfopen bebouwing'] +
                                national2025.by_type['Huizen in open bebouwing, hoeven en kastelen'] +
                                national2025.by_type['Buildings en flatgebouwen met appartementen']
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Huizen + Appartementsgebouwen</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="evolution" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="evolution">Evolutie (Tijdreeks)</TabsTrigger>
                    <TabsTrigger value="types">Type Bebouwing 2025</TabsTrigger>
                    <TabsTrigger value="regions">Regionale Verdeling</TabsTrigger>
                </TabsList>

                <TabsContent value="evolution" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Evolutie van het aantal gebouwen (1995-2025)</CardTitle>
                            <CardDescription>Groei van het totaal aantal gebouwen vs. woongebouwen</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="year" />
                                    <YAxis tickFormatter={(val) => `${val / 1000000}M`} />
                                    <Tooltip formatter={(val: any) => formatNumber(Number(val))} />
                                    <Legend />
                                    <Line type="monotone" dataKey="total" name="Totaal Gebouwen" stroke="#8884d8" strokeWidth={2} />
                                    <Line type="monotone" dataKey="residential" name="Woongebouwen" stroke="#82ca9d" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="types" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Verdeling per Type Bebouwing (2025)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={compositionData} layout="vertical" margin={{ left: 50 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(val) => `${val / 1000}k`} />
                                    <YAxis dataKey="name" type="category" width={150} style={{ fontSize: '12px' }} />
                                    <Tooltip formatter={(val: any) => formatNumber(Number(val))} />
                                    <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="regions" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        {Object.entries(snapshot_2025.regions).map(([code, reg]: [string, any]) => (
                            <Card key={code}>
                                <CardHeader>
                                    <CardTitle>{reg.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold mb-2">{formatNumber(reg.total)}</div>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Open:</span>
                                            <span>{formatNumber(reg.by_type['Huizen in open bebouwing, hoeven en kastelen'])}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Halfopen:</span>
                                            <span>{formatNumber(reg.by_type['Huizen in halfopen bebouwing'])}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Gesloten:</span>
                                            <span>{formatNumber(reg.by_type['Huizen in gesloten bebouwing'])}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Appartementen:</span>
                                            <span>{formatNumber(reg.by_type['Buildings en flatgebouwen met appartementen'])}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
