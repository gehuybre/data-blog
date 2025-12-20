"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataPoint {
  y: number
  q: number
  [key: string]: any
}

interface FilterableTableProps {
  data: DataPoint[]
  metric: string
  label?: string
}

export function FilterableTable({ data, metric, label = "Aantal" }: FilterableTableProps) {
  // Sort descending by date
  const sortedData = [...data].reverse()

  return (
    <div className="max-h-[400px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jaar</TableHead>
            <TableHead>Kwartaal</TableHead>
            <TableHead className="text-right">{label}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((d, i) => (
            <TableRow key={i}>
              <TableCell>{d.y}</TableCell>
              <TableCell>Q{d.q}</TableCell>
              <TableCell className="text-right">
                {d[metric]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
