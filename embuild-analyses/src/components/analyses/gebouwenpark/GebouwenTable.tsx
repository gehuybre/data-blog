"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TableDataPoint {
  year: number
  total: number
  residential: number
}

interface GebouwenTableProps {
  data: TableDataPoint[]
}

const formatNumber = (num: number) => new Intl.NumberFormat('nl-BE').format(num)

export function GebouwenTable({ data }: GebouwenTableProps) {
  // Sort by year descending for table view
  const sortedData = [...data].sort((a, b) => b.year - a.year)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jaar</TableHead>
            <TableHead className="text-right">Totaal Gebouwen</TableHead>
            <TableHead className="text-right">Woongebouwen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.year}>
              <TableCell className="font-medium">{row.year}</TableCell>
              <TableCell className="text-right">{formatNumber(row.total)}</TableCell>
              <TableCell className="text-right">{formatNumber(row.residential)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
