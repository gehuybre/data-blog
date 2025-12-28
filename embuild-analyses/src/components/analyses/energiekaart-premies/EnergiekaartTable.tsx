"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface TableDataPoint {
  jaar: number
  value: number
}

interface EnergiekaartTableProps {
  data: TableDataPoint[]
  label: string
  isCurrency?: boolean
}

export function EnergiekaartTable({ data, label, isCurrency = false }: EnergiekaartTableProps) {
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

  // Sort by year descending (most recent first)
  const sortedData = [...data].sort((a, b) => b.jaar - a.jaar)

  return (
    <div className="h-[400px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jaar</TableHead>
            <TableHead className="text-right">{label}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.jaar}>
              <TableCell className="font-medium">{row.jaar}</TableCell>
              <TableCell className="text-right">{formatValue(row.value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
